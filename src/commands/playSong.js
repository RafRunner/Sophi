// Comandos para adicionar músicas na playlist
const playdl = require('play-dl');
const ytdl = require('ytdl-core');
const radin = require('../player');
const Command = require('../domain/Command');
const PlaylistEntry = require('../domain/PlaylistEntry');
const { messageStartsWithCommand } = require('../util/commandUtil');
const { resolveIndex, getIndexRegex } = require('../util/indexUtil');

// TODO Implementar limitação da durtação dos vídeos, pesquisa
// e no futuro busca em outros serviços de vídeos/áudio.
async function searchYoutube(searchTerm) {
    if (searchTerm.startsWith('https')) {
        if (playdl.yt_validate(searchTerm) === false && !ytdl.validateURL(searchTerm)) {
            return [null, 'Infelizmente só consigo reproduzir links do YouTube a'];
        }

        // Supostamente é uma playlist do youtube. Validamos desse jeito pois se o vídeo faz parte de uma playlist
        // o play-dl.yt_validate identifica como uma playlist, e não queremos isso.
        if (searchTerm.includes('/playlist?list')) {
            return searchYoutubePlaylist(searchTerm);
        }

        searchTerm = searchTerm.replace(/&.+$/gi, '');

        const basicInfo = await ytdl.getBasicInfo(searchTerm);
        const ytInfo = {
            title: basicInfo.videoDetails.title,
            url: searchTerm,
        };
        return [[ytInfo], null];
    }

    const [ytInfo] = await playdl.search(searchTerm, { source: { youtube: 'video' }, limit: 1, fuzzy: true });

    if (!ytInfo) {
        return [null, 'Infelizmente sua pesquisa não foi encontrada ou não é um link de um vídeo no YouTube aa'];
    }

    if (ytInfo.discretionAdvised) {
        return [null, `Não foi possível reproduzir a música (${ytInfo.title})\nPois ela tem restrição de idade @w@`];
    }

    return [[ytInfo], null];
}

async function searchYoutubePlaylist(playlistUrl) {
    if (playdl.yt_validate(playlistUrl) !== 'playlist') {
        return [null, 'Infelizmente só consigo reproduzir links de vídeos ou playlists do YouTube a'];
    }

    let videos = null;

    try {
        const playlistInfo = await playdl.playlist_info(playlistUrl, { incomplete: true });
        await playlistInfo.fetch();
        videos = await playlistInfo.page(1);
    } catch(e) {
        console.log(`Erro ao obter músicas da playlist: "${playlistUrl}": ${e}\n${e.stack}`);
    }

    if (!videos) {
        return [null, 'Infelizmente ocorreu um erro ao ler os vídeos dessa playlist do YouTube aa'];
    }

    return [videos, null];
}

function playOrAddToPlaylist(message, serverPlayer, ytInfos, asNext = false) {
    const playlistHasEnded = serverPlayer.playlistHasEnded();

    if (ytInfos.length > 1) {
        message.reply(
            `Um total de (${ytInfos.length}) músicas foram adicionadas ${asNext ? 'como as próximas' : ''} na queue e.e`
        );
    } else if (!playlistHasEnded) {
        message.reply(`Sua música (${ytInfos[0].title}) foi adicionada ${asNext ? 'como a próxima' : ''} na queue e.e`);
    }

    ytInfos.forEach((ytInfo, index) => {
        const playlistEntry = new PlaylistEntry(message, ytInfo);

        serverPlayer.addToPlaylist(playlistEntry, asNext);

        if (playlistHasEnded && index == 0) {
            radin(serverPlayer);
        }
    });
}

const play = new Command(
    (message, normalizedMessage) => {
        return messageStartsWithCommand(normalizedMessage, ['play', 'p']);
    },

    async (message, argument, serverPlayer) => {
        const [ytInfos, error] = await searchYoutube(argument);

        if (error) {
            return message.reply(error);
        }

        playOrAddToPlaylist(message, serverPlayer, ytInfos);
    }
);

const playNext = new Command(
    (message, normalizedMessage) => {
        return messageStartsWithCommand(normalizedMessage, ['playnext', 'pn']);
    },

    async (message, argument, serverPlayer) => {
        const [ytInfos, error] = await searchYoutube(argument);

        if (error) {
            return message.reply(error);
        }

        playOrAddToPlaylist(message, serverPlayer, ytInfos, true);
    }
);

const playAgain = new Command(
    (message, normalizedMessage) => {
        return messageStartsWithCommand(normalizedMessage, ['playagain', 'pa']);
    },

    async (message, argument, serverPlayer) => {
        const result = getIndexRegex().exec(argument);
        if (!result) {
            return message.reply('Uso errado do comando! Deve ser -pa 3 por exemplo :v');
        }

        const index = resolveIndex(result[1], serverPlayer);
        serverPlayer.checkValidIndex(index);
        const playlistEntry = serverPlayer.playlist[index];

        playOrAddToPlaylist(message, serverPlayer, [playlistEntry.ytInfo]);
    }
);

module.exports = [play, playNext, playAgain];
