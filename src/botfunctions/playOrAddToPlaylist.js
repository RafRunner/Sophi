const { Message } = require('discord.js');
const { YouTubeVideo } = require('play-dl');
const ServerPlayer = require('../domain/ServerPlayer');
const PlaylistEntry = require('../domain/PlaylistEntry');
const radin = require('../botfunctions/player');
const { playlistLimit: limit } = require('../botfunctions/searchTrack');
const logger = require('../util/logger');
const { formatDuration } = require('../util/formatUtil');

/**
 *
 * @param {Message} message
 * @param {ServerPlayer} serverPlayer
 * @param {YouTubeVideo[]} ytInfos
 * @param {boolean} asNext
 * @returns {Promise<any>}
 */
async function playOrAddToPlaylist(message, serverPlayer, ytInfos, asNext = false) {
    const filteredInfos = ytInfos.filter((ytInfo) => {
        if (ytInfo.durationInSec > 2 * 60 * 60) {
            message.reply(`O vídeo ${ytInfo.title} tem mais de duas horas! Muito longo uwu`);
            return false;
        }
        return true;
    });
    if (filteredInfos.length === 0) {
        return;
    }

    const trimed = trimPlaylist(serverPlayer, filteredInfos, limit);

    if (trimed) {
        if (filteredInfos.length === 0) {
            message.reply(`A playlist já está cheia! O tamanho máximo é de ${limit} @w@`);
            return;
        } else {
            message.reply(`A playlist está bem grande! Limitei seu pedido a ${filteredInfos.length} música(s) @w@`);
        }
    }
    const playlistHasEnded = serverPlayer.playlistHasEnded();
    const playlistSecondsSoFar = serverPlayer.playlist
        .slice(serverPlayer.currentSongIndex)
        .map((entry) => entry.ytInfo.durationInSec)
        .reduce((acc, val) => acc + val, 0);
    const inFront = serverPlayer.playlist.length - serverPlayer.currentSongIndex - 1;
    const position = inFront > 0 ? ` atrás de ${inFront} pedido(s)` : '';

    let totalSeconds = 0;
    for (const ytInfo of filteredInfos) {
        totalSeconds += ytInfo.durationInSec;

        if (playlistSecondsSoFar + totalSeconds > 10 * 60 * 60) {
            message.reply('A playlist já tem 10 horas! WoW! não pode durar mais que isso @w@');
            break;
        }

        const playlistEntry = new PlaylistEntry(message, ytInfo);
        serverPlayer.addToPlaylist(playlistEntry, asNext);
    }

    const durationStr = formatDuration(totalSeconds);

    if (filteredInfos.length > 1) {
        message.reply(
            `Um total de ${filteredInfos.length} músicas (${durationStr}) foram adicionadas${
                asNext ? ' como as próximas' : position
            } na fila e.e`
        );
    } else if (!playlistHasEnded) {
        message.reply(
            `Sua música '${filteredInfos[0].title}' (${durationStr}) foi adicionada${
                asNext ? ' como a próxima' : position
            } na fila e.e`
        );
    }

    logger.info(`Adicionados ${filteredInfos.length} itens à playlist. Tempo: ${durationStr}`);

    if (playlistHasEnded) {
        await radin(serverPlayer);
    }
}

/**
 *
 * @param {ServerPlayer} serverPlayer
 * @param {YouTubeVideo[]} ytInfos
 * @param {number} limit
 * @returns {boolean}
 */
function trimPlaylist(serverPlayer, ytInfos, limit) {
    const toBePlayed = serverPlayer.toBePlayed();

    if (toBePlayed + ytInfos.length > limit) {
        const toAdd = Math.max(limit - toBePlayed, 0);
        ytInfos.splice(toAdd, ytInfos.length - toAdd);
        return true;
    }

    return false;
}

module.exports = playOrAddToPlaylist;
