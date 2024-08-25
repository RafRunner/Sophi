// const ytstream = require('yt-stream');
const ytdl = require("@distube/ytdl-core");
const fs = require('fs');
const path = require('path');
const {
    joinVoiceChannel,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    StreamType,
} = require('@discordjs/voice');
const ServerPlayer = require('../domain/ServerPlayer');
const PlaylistEntry = require('../domain/PlaylistEntry');
const logger = require('../util/logger');
const { YouTubeVideo } = require('play-dl');
const { Readable } = require('stream');

/**
 *
 * @param {ServerPlayer} serverPlayer
 * @param {boolean} sendMessage
 * @returns {Promise<void>}
 */
async function radin(serverPlayer, sendMessage = true) {
    const playlistEntry = serverPlayer.getCurrentEntry();
    if (!playlistEntry) {
        logger.warn(`Playlist tinha acabado ${serverPlayer.guildId}`);
        return;
    }

    const sucesso = await playReq(serverPlayer, playlistEntry, sendMessage);

    if (!sucesso) {
        goToNextSong(serverPlayer);
        return;
    }

    clearTimeout(serverPlayer.idleTimer);

    serverPlayer.audioPlayer.once(AudioPlayerStatus.Idle, (_oldState, _newState) => {
        logger.info(`${serverPlayer.guildId} serverPlayer idle`);
        serverPlayer.idleTimer = setTimeout(() => {
            serverPlayer.voiceConnection.disconnect();
        }, 15 * 60 * 1000); // 15 minutes

        setTimeout(() => {
            const songCurrentIndex = serverPlayer.playlist.indexOf(playlistEntry);
            if (songCurrentIndex !== -1) {
                serverPlayer.removeFromPlaylist(songCurrentIndex);
            }
        }, 4 * 60 * 60 * 1000); // Four hours

        serverPlayer.checkPlayingToNoOne(playlistEntry.originalVoiceChannelId, playlistEntry.message);

        if (playlistEntry.stopRadin) {
            playlistEntry.stopRadin = false;
            return;
        }

        goToNextSong(serverPlayer);
    });
}

/**
 *
 * @param {ServerPlayer} serverPlayer
 * @returns {Promise<void>}
 */
function goToNextSong(serverPlayer) {
    serverPlayer.setCurrentSongIndex(serverPlayer.currentSongIndex + 1);

    if (serverPlayer.playlistHasEnded()) {
        return;
    }

    radin(serverPlayer);
}

/**
 *
 * @param {ServerPlayer} serverPlayer
 * @param {PlaylistEntry} playlistEntry
 * @param {boolean} sendMessage
 * @returns {Promise<boolean>}
 */
async function playReq(serverPlayer, playlistEntry, sendMessage) {
    const { message, ytInfo: selectedSong, originalVoiceChannelId } = playlistEntry;

    try {
        const filePath = await downloadAudio(selectedSong, serverPlayer.guildId);
        // const stream = await createStream(selectedSong.url);
        // stream.on('error', (error) => {
        //     logger.error(`Erro em playstream música "${selectedSong.title}" server ${serverPlayer.guildId}.`, error);
        // });

        const joinOptions = {
            channelId: originalVoiceChannelId,
            guildId: serverPlayer.guildId,
            adapterCreator: message.guild.voiceAdapterCreator,
        };

        if (
            !serverPlayer.voiceConnection ||
            joinOptions.channelId !== serverPlayer.voiceConnection.joinConfig.channelId
        ) {
            serverPlayer.voiceConnection = joinVoiceChannel(joinOptions);
        } else if (serverPlayer.voiceConnection.state.status === VoiceConnectionStatus.Disconnected) {
            serverPlayer.voiceConnection.rejoin(joinOptions);
        }

        if (sendMessage) {
            message.channel.send(
                `Está tocando: ${selectedSong.title} (${selectedSong.url}) (${selectedSong.durationRaw})\n` +
                    `A pedido de: ${message.member.displayName}`
            );
        }

        const resource = createAudioResource(filePath, {
            inputType: StreamType.Arbitrary,
        });

        // serverPlayer.audioPlayer.stop();
        serverPlayer.audioPlayer.play(resource);
        serverPlayer.playerSubscription = serverPlayer.voiceConnection.subscribe(serverPlayer.audioPlayer);

        const entryIndex = serverPlayer.currentSongIndex;
        let errorProcessed = false;
        serverPlayer.audioPlayer.on('error', (error) => {
            if (errorProcessed || entryIndex !== serverPlayer.currentSongIndex) {
                return;
            }
            errorProcessed = true;
            serverPlayer.audioPlayer.removeAllListeners();

            logger.warn(`Erro em audioplayer música "${selectedSong.title}" server ${serverPlayer.guildId}.`, error);
            playlistEntry.reties++;

            if (serverPlayer.skipToSong()) {
                radin(serverPlayer);
            }
        });

        logger.info(
            `Tocando '${selectedSong.title}' (${selectedSong.durationRaw}) a pedido de '${message.author.username}'` +
                `(${message.author.id}) no servidor '${message.guild.name}'(${serverPlayer.guildId})`
        );

        return true;
    } catch (e) {
        logger.error(`Erro ao reproduzir música "${selectedSong.title}" server ${serverPlayer.guildId}.\n${e}`, e);
        message.channel.send(
            `Não foi possível reproduzir a música (${selectedSong.title})\n` +
                `Provavelmente tem restrição de idade ou está privado @w@`
        );

        return false;
    }
}

/**
 * TODO use pipelines if going back to this strategy in the future
 * @param {YouTubeVideo} selectedSong video to play
 * @param {string} guildId
 * @returns {string} download absolute path
 */
async function downloadAudio(selectedSong, guildId) {
    const filePath = path.resolve(__dirname, '..', '..', 'audio_cache', `${guildId}.webm`);
    if (fs.existsSync(filePath)) {
        fs.rmSync(filePath);
    }

    const stream = await createStream(selectedSong.url);
    const writeStream = fs.createWriteStream(filePath);
    stream.pipe(writeStream);

    await new Promise((resolve, reject) => {
        const handleError = (error) => {
            logger.error(`Erro em playstream música "${selectedSong.title}" server ${guildId}.`);
            reject(error);
            stream.unpipe();
            writeStream.close();
        };
        stream.on('end', resolve)
        writeStream.on('error', handleError);
        stream.on('error', handleError);
    });

    return filePath;
}

/**
 * Creates a stream from url
 * @param {string} songUrl url to stream
 * @returns {Promise<Readable>} the stream
 */
async function createStream(songUrl) {
    // const ytStream = await ytstream.stream(songUrl, {
    //     quality: 'high',
    //     type: 'audio',
    //     highWaterMark: 256 * 1024,
    //     download: true
    // });
    // return ytStream.stream;
    return ytdl(songUrl, {
        filter: 'audioonly',
        quality: 'highestaudio',
    })
}

module.exports = radin;
