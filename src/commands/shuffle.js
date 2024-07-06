// Comando para embaralhar o restante da playlist
const Command = require('../domain/Command');
const CommandHelp = require('../domain/CommandHelp');
const { messageIsCommand } = require('../util/commandUtil');

const shuffle = new Command(
    (_message, normalizedMessage) => {
        return messageIsCommand(normalizedMessage, ['shuffle', 'random', 'r']);
    },

    async (message, _argument, serverPlayer) => {
        serverPlayer.shufflePlaylist();
        message.channel.send('Tudo bem misturado 🌀');
    },

    new CommandHelp('shuffle', 'random, r', 'embaralha os itens da playlist')
);

module.exports = shuffle;
