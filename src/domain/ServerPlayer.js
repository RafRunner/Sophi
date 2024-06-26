const {
    createAudioPlayer,
    NoSubscriberBehavior,
    VoiceConnection,
    AudioPlayer,
    AudioPlayerStatus,
    PlayerSubscription,
} = require('@discordjs/voice');
const { Message } = require('discord.js');
const { withTimeout, Mutex } = require('async-mutex');
const { getClient } = require('../util/clientManager');
const SophiError = require('../domain/SophiError');
const PlaylistEntry = require('./PlaylistEntry');
const logger = require('../util/logger');

class ServerPlayer {
    /**
     *
     * @param {number} guildId The guild this player is responsible for
     */
    constructor(guildId) {
        /**
         * @type {PlaylistEntry[]}
         */
        this.playlist = [];

        /**
         * @type {number}
         */
        this.currentSongIndex = 0;

        /**
         * @type {NodeJS.Timeout?}
         */
        this.idleTimer = null;

        /**
         * @type {NodeJS.Timeout?}
         */
        this.pauseTimer = null;

        /**
         * @type {VoiceConnection?}
         */
        this.voiceConnection = null;

        /**
         * @type {PlayerSubscription?}
         */
        this.playerSubscription = null;

        /**
         * @type {AudioPlayer}
         */
        this.audioPlayer = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play,
            },
        });

        /**
         * @type {number}
         */
        this.timesPlayingToNoOne = 0;

        /**
         * @type {Mutex}
         */
        this.mutex = withTimeout(new Mutex(), 100 * 1000);

        /**
         * @type {number}
         */
        this.guildId = guildId;
    }

    /**
     *
     * @param {PlaylistEntry} playlistEntry
     * @param {boolean} asNext
     * @returns {void}
     */
    addToPlaylist(playlistEntry, asNext = false) {
        if (asNext) {
            this.playlist.splice(this.currentSongIndex + 1, 0, playlistEntry);
        } else {
            this.playlist.push(playlistEntry);
        }
    }

    /**
     *
     * @param {number} index
     * @returns {PlaylistEntry}
     */
    removeFromPlaylist(index) {
        this.checkValidIndex(index);
        const [removed] = this.playlist.splice(index, 1);

        if (index <= this.currentSongIndex) {
            this.currentSongIndex--;
            if (index === this.currentSongIndex + 1) {
                // Going to next entry, skipping the current one
                this.audioPlayer.stop();
            }
        }

        return removed;
    }

    /**
     *
     * @returns {PlaylistEntry}
     */
    getCurrentEntry() {
        return this.playlist[this.currentSongIndex];
    }

    /**
     *
     * @returns {boolean}
     */
    playlistHasEnded() {
        return this.currentSongIndex >= this.playlist.length;
    }

    /**
     *
     * @param {number?} index
     * @returns {boolean} If the radin needs to be called
     */
    skipToSong(index = null) {
        if (index === null) {
            if (this.playlistHasEnded()) {
                return false;
            }
            index = this.currentSongIndex + 1;
        } else {
            this.checkValidIndex(index);
        }

        if (!this.playlistHasEnded()) {
            this.getCurrentEntry().stopRadin = true;
            this.setCurrentSongIndex(index);
            this.audioPlayer.stop();
        } else {
            this.setCurrentSongIndex(index);
        }

        return true;
    }

    /**
     *
     * @param {number} index
     * @returns {void}
     */
    setCurrentSongIndex(index) {
        this.currentSongIndex = Math.max(0, Math.min(this.playlist.length, index));
    }

    /**
     *
     * @param {number} index
     * @returns {void}
     */
    checkValidIndex(index) {
        if (index < 0 || index >= this.playlist.length) {
            throw new SophiError(
                `Índice ${index + 1} inválido! Veja a playlist com -q para saber quais podem ser usados :P`
            );
        }
    }

    /**
     *
     * @param {number} from
     * @param {number} to
     * @returns {void}
     */
    move(from, to) {
        this.checkValidIndex(from);
        if (from === this.currentSongIndex) {
            throw new SophiError(`Índice ${from + 1} inválido! Não se pode mover a música tocando agora :P`);
        }
        if (to < 0) {
            throw new SophiError(`Índice ${to + 1} inválido! Deve ser maior ou igual a um :P`);
        }
        if (to === this.currentSongIndex) {
            throw new SophiError(
                `Índice ${to + 1} inválido! Não se pode mover para a música tocando agora. Mova para next e dê skip :P`
            );
        }
        if (to > this.playlist.length) {
            throw new SophiError(`Índice ${to + 1} inválido! Deve ser menor que um após o último da playlist :P`);
        }
        if (from === to) {
            throw new SophiError('Os índices são iguais aa');
        }

        if (to === this.playlist.length) {
            const playlistEntry = this.removeFromPlaylist(from);
            this.addToPlaylist(playlistEntry);
        } else {
            const temp = this.playlist[from];
            this.playlist[from] = this.playlist[to];
            this.playlist[to] = temp;
        }
    }

    /**
     *
     * @returns {AudioPlayerStatus}
     */
    playerStatus() {
        return this.audioPlayer.state.status;
    }

    /**
     *
     * @returns {boolean}
     */
    notPlayingOrPaused() {
        return this.playerStatus() != AudioPlayerStatus.Paused && this.playerStatus() != AudioPlayerStatus.Playing;
    }

    clearPlaylist() {
        if (this.playlist.length === 0) {
            return;
        }
        if (this.getCurrentEntry()) {
            this.getCurrentEntry().stopRadin = true;
        }
        this.playlist = [];
        this.currentSongIndex = 0;
        this.audioPlayer.stop();
    }

    shufflePlaylist() {
        if (this.currentSongIndex + 2 >= this.playlist.length) {
            return;
        }
        const playlistCopy = [...this.playlist];
        const restOfPlaylist = playlistCopy.splice(this.currentSongIndex + 1);
        this.playlist = [...playlistCopy, ...restOfPlaylist.sort(() => 0.5 - Math.random())];
    }

    /**
     *
     * @param {string} channelId
     * @param {Message} message
     * @returns {void}
     */
    checkPlayingToNoOne(channelId, message) {
        const channel = getClient().channels.cache.get(channelId);
        if (!channel) {
            logger.warn(`Canal de id ${channelId} não encontrado no chache do bot...`);
            return;
        }

        const membersInChannel = channel.members.filter((member) => !member.user.bot);

        // Bot está sozinho na sala
        if (membersInChannel.size === 0) {
            this.timesPlayingToNoOne++;
            if (this.timesPlayingToNoOne >= 2) {
                this.clearPlaylist();
                this.voiceConnection.disconnect();
                this.timesPlayingToNoOne = 0;
                message.channel.send('Saí do canal de voz e limpei a playlist pois estava tocando para ninguém =(');
            }
        } else {
            this.timesPlayingToNoOne = 0;
        }
    }

    /**
     * Calculates how many entries are left in the playlist
     * @returns {number}
     */
    toBePlayed() {
        if (this.playlistHasEnded()) {
            return 0;
        }
        return this.playlist.length - this.currentSongIndex;
    }
}

module.exports = ServerPlayer;
