const ytstream = require('yt-stream');
// const fs = require('fs');
// const path = require('path');
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
        // const filePath = await downloadAudio(selectedSong, serverPlayer.guildId);
        const ytStream = await ytstream.stream(selectedSong.url, {
            quality: 'high',
            type: 'audio',
            highWaterMark: 1048576 * 32,
            download: true,
        });
        const stream = ytStream.stream;
        let errorProcessed = false;

        stream.on('error', (error) => {
            if (errorProcessed) {
                return;
            }
            errorProcessed = true;

            logger.error(`Erro em playstream música "${selectedSong.title}" server ${serverPlayer.guildId}.`, error);
            playlistEntry.reties++;

            if (serverPlayer.skipToSong()) {
                radin(serverPlayer);
            }
        });
        stream.on('close', () => {
            logger.info(`Close ${serverPlayer.audioPlayer.state} ${serverPlayer.guildId}`);
            // if (!serverPlayer.notPlayingOrPaused()) {
            //     serverPlayer.audioPlayer.stop()
            // }
        });
        stream.on('end', () => logger.info(`End ${serverPlayer.audioPlayer.state} ${serverPlayer.guildId}`));

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

        let resource = createAudioResource(stream, {
            inputType: StreamType.Arbitrary,
        });

        serverPlayer.audioPlayer.play(resource);
        serverPlayer.playerSubscription = serverPlayer.voiceConnection.subscribe(serverPlayer.audioPlayer);

        serverPlayer.audioPlayer.on('error', (error) => {
            if (errorProcessed) {
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

// async function downloadAudio(selectedSong, guildId) {
//     const filePath = path.resolve(__dirname, '..', '..', 'audio_cache', `${guildId}.webm`).toString();
//     if (fs.existsSync(filePath)) {
//         fs.rmSync(filePath);
//     }

//     const ytStream = await ytstream.stream(selectedSong.url, {
//         quality: 'high',
//         type: 'audio',
//         highWaterMark: 1048576 * 32,
//         download: true
//     });
//     const stream = ytStream.stream;
//     const writeStream = fs.createWriteStream(filePath);
//     stream.pipe(writeStream);

//     await new Promise((resolve, reject) => {
//         const handleError = (error) => {
//             logger.error(`Erro em playstream música "${selectedSong.title}" server ${guildId}.`);
//             reject(error);
//             stream.unpipe();
//             writeStream.close();
//         };
//         writeStream.on('finish', resolve);
//         writeStream.on('error', handleError);
//         stream.on('error', handleError);
//     });

//     return filePath;
// }

module.exports = radin;
