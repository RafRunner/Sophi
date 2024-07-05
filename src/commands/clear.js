// Comando para limpar a playlist
const Command = require("../domain/Command");
const { messageIsCommand } = require('../util/commandUtil');

const clear = new Command(
    (_message, normalizedMessage) => {
        return messageIsCommand(normalizedMessage, ['clear', 'c', 'stop']);
    },

    async (message, _argument, serverPlayer) => {
        serverPlayer.clearPlaylist();
        message.channel.send('TÁ LIMPO 😠');
    }
);

module.exports = clear;
