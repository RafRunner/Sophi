// Comando para pular para um index da playlist
const radin = require('../botfunctions/player');
const Command = require('../domain/Command');
const CommandHelp = require('../domain/CommandHelp');
const { messageStartsWithCommand } = require('../util/commandUtil');
const { resolveIndex, getIndexRegex } = require('../util/indexUtil');

const goto = new Command(
    (_message, normalizedMessage) => {
        return messageStartsWithCommand(normalizedMessage, ['goto', 'go']);
    },

    async (message, argument, serverPlayer) => {
        const result = getIndexRegex().exec(argument);
        if (!result) {
            message.reply('Uso errado do comando! Deve ser -goto 3 por exemplo :v');
            return;
        }

        const index = resolveIndex(result[1], serverPlayer);

        if (serverPlayer.skipToSong(index)) {
            radin(serverPlayer);
        }
    },

    new CommandHelp('goto', 'go', 'vai para algum ponto da playlist, aceita um index')
);

module.exports = goto;
