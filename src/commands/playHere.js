const { joinVoiceChannel, AudioPlayerStatus } = require('@discordjs/voice');
const Command = require('../domain/Command');
const { messageIsCommand } = require('../util/commandUtil');
const CommandHelp = require('../domain/CommandHelp');

const playHere = new Command(
    (_message, normalizedMessage) => {
        return messageIsCommand(normalizedMessage, ['playHere', 'here', 'ph']);
    },

    async (message, _argument, serverPlayer) => {
        if (serverPlayer.notPlayingOrPaused()) {
            message.reply(`Não tem nada todando ou pausado! Use o comando play(p) ewe`);
            return;
        }

        serverPlayer.playerSubscription.unsubscribe();
        serverPlayer.voiceConnection.destroy();

        serverPlayer.voiceConnection = joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });
        serverPlayer.voiceConnection.subscribe(serverPlayer.audioPlayer);

        if (serverPlayer.playerStatus() === AudioPlayerStatus.Paused) {
            clearInterval(serverPlayer.pauseTimer);
            audioPlayer.unpause();
        }

        message.reply('Movi OwO');
    },

    new CommandHelp('playHere', 'here, ph', 'faz o bot trocar para o canal de voz do usuário usando o comando')
);

module.exports = playHere;
