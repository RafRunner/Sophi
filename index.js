const Sophi = require('discord.js');
const { Intents } = require('discord.js');
const token  = require('./src/token').token;
const skip = require('./src/commands/skip');
const pause = require('./src/commands/pause');
const playSong = require('./src/commands/playSong');

const client = new Sophi.Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.DIRECT_MESSAGES],
    partials : ['CHANNEL', 'MESSAGE'],
});

const playlists = [];
const currentAudioPlayers = {
    '1': null,
};

const allCommands = [pause, playSong, skip];

client.on('ready', () => {
    client.user.setActivity('indie babe uwu', { type: 'LISTENING'});
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.id === client.user.id || message.content[0] !== '-') { 
        return;
    }

    allCommands.forEach((command) => {
        const [willExecute, argument] = command.shouldExecute(message)
        if (!willExecute) {
            return;
        }

        if (command.requireInVoice && !message.member.voice?.channel) {
            return message.reply('Você precisa estar conectado à uma sala de voz para fazer isto :s');
        }

        command.execute(message, argument, playlists, currentAudioPlayers);
    });
});

client.login(token);
