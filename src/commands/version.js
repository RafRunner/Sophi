const version = require('../../package.json').version;
const Command = require('../domain/Command');
const { messageIsCommand } = require('../util/commandUtil');

const versionCommand = new Command(
    (_message, normalizedMessage) => {
        return messageIsCommand(normalizedMessage, ['version', 'v']);
    },

    async (message, _argument, _serverPlayer) => {
        message.reply(`Versão ${version}`);
    },

    false
);

module.exports = versionCommand;
