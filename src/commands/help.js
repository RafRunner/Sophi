// Comando para mostrar o uso básico do bot
const Command = require('../domain/Command');
const {messageIsCommand } = require('../util/commandUtil');
const CommandHelp = require('../domain/CommandHelp');
const { EmbedBuilder } = require('discord.js');

/**
 *
 * @param {Command[]} commands other commands
 * @returns {Command} the help command
 */
function helpMaker(commands) {
    const helpMessage = commands
        .filter((c) => c.help.name !== 'help' && c.help.name !== 'version')
        .map((c) => `> **${c.help.name}**: ${c.help.helpText}. **Alias**: ${c.help.aliases}.`)
        .join('\n\n');

    return new Command(
        (_message, normalizedMessage) => {
            return messageIsCommand(normalizedMessage, ['help', 'h']);
        },

        async (message, _argument, _serverPlayer) => {
            const embed = new EmbedBuilder()
                .setColor(0x1f85de)
                .setTitle('**Help**')
                .setDescription(
                    'É útil saber que um index pode ser relativo, usando - ou +' +
                        ', assim como algumas palavras como last, next ou first. Comandos disponíveis:\n\n' +
                        helpMessage
                );

            await message.channel.send({
                embeds: [embed],
            });
        },

        new CommandHelp('help', 'h', 'mostra os comandos disponíveis'),
        false
    );
}

module.exports = helpMaker;
