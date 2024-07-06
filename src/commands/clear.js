// Comando para limpar a playlist
const Command = require('../domain/Command');
const CommandHelp = require('../domain/CommandHelp');
const { messageIsCommand } = require('../util/commandUtil');

const clear = new Command(
    (_message, normalizedMessage) => {
        return messageIsCommand(normalizedMessage, ['clear', 'c', 'stop']);
    },

    async (message, _argument, serverPlayer) => {
        serverPlayer.clearPlaylist();
        message.channel.send('TÁ LIMPO 😠');
    },

    new CommandHelp('clear', 'c, stop', 'limpa a playlist, removendo todos os itens e parando o que estiver tocando')
);

module.exports = clear;
