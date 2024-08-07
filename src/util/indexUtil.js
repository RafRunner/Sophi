const ServerPlayer = require('../domain/ServerPlayer');

const possibleIndexString = '[-+]?\\s*\\d+|first|previous|this|next|last';

module.exports = {
    /**
     *
     * @param {string} indexS
     * @param {ServerPlayer} serverPlayer
     * @returns {number}
     */
    resolveIndex: (indexS, serverPlayer) => {
        if (indexS === 'first') {
            return 0;
        }
        if (indexS === 'previous') {
            return serverPlayer.currentSongIndex - 1;
        }
        if (indexS === 'this') {
            return serverPlayer.currentSongIndex;
        }
        if (indexS === 'next') {
            return serverPlayer.currentSongIndex + 1;
        }
        if (indexS === 'last') {
            return serverPlayer.playlist.length - 1;
        }

        const isRelativeIndex = indexS.startsWith('-') || indexS.startsWith('+');
        const index = Number(indexS);
        if (isRelativeIndex) {
            return serverPlayer.currentSongIndex + index;
        }

        return index - 1;
    },

    /**
     *
     * @returns {RegExp}
     */
    getIndexRegex: () => {
        return new RegExp(`^(${possibleIndexString})$`, 'di');
    },

    /**
     *
     * @returns {RegExp}
     */
    getTwoIndexesRegex: () => {
        return new RegExp(`^(${possibleIndexString})\\s+(${possibleIndexString})$`, 'gi');
    },
};
