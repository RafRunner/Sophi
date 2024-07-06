// Comando para o bot remover uma música específica da playlist por index
const Command = require('../domain/Command');
const { resolveIndex, getIndexRegex } = require('../util/indexUtil');
const { messageStartsWithCommand } = require('../util/commandUtil');
const CommandHelp = require('../domain/CommandHelp');

const remove = new Command(
    (_message, normalizedMessage) => {
        return messageStartsWithCommand(normalizedMessage, ['remove', 'rm']);
    },

    async (message, argument, serverPlayer) => {
        const result = getIndexRegex().exec(argument);
        if (!result) {
            message.reply('Uso errado do comando! Deve ser -r 3 por exemplo ou -clear para remover todas :v');
            return;
        }

        const index = resolveIndex(result[1], serverPlayer);
        const removedEntry = serverPlayer.removeFromPlaylist(index);

        message.channel.send(`Música ${removedEntry.ytInfo.title} removida OwO`);
    },

    new CommandHelp('remove', 'rm', 'remove um item playlist. Aceita um index')
);

module.exports = remove;
