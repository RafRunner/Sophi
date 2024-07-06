const radin = require('../botfunctions/player');
const Command = require('../domain/Command');
const CommandHelp = require('../domain/CommandHelp');
const { messageIsCommand } = require('../util/commandUtil');

const skip = new Command(
    (_message, normalizedMessage) => {
        return messageIsCommand(normalizedMessage, ['skip', 'next', 's', 'n']);
    },

    async (message, _argument, serverPlayer) => {
        if (serverPlayer.playlistHasEnded()) {
            return message.channel.send('Não tem nada tocando ou pausado uwu');
        }

        if (serverPlayer.skipToSong()) {
            radin(serverPlayer);
        }

        message.channel.send('Skiiiiiiiiiipooooo-desu vruuuuuuuuuuuuuuuuuuuuuuuuuuum!!!!');
    },

    new CommandHelp('skip', 's', 'pula o que estiver tocando para o próximo da playlist')
);

module.exports = skip;
