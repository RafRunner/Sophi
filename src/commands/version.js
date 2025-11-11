const version = require('../../package.json').version;
const Command = require('../domain/Command');
const CommandHelp = require('../domain/CommandHelp');
const { messageIsCommand } = require('../util/commandUtil');

const versionCommand = new Command(
    (_message, normalizedMessage) => {
        return messageIsCommand(normalizedMessage, ['version', 'v']);
    },

    async (message, _argument, _serverPlayer) => {
        message.reply(`Versão ${version}`);
    },

    new CommandHelp('version', 'v', 'mostra a versão do bot'),
    false
);

module.exports = versionCommand;
