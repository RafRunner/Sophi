const { prisma } = require('../util/database');
const logger = require('../util/logger');

/**
 * Repository for PlayedEntry operations
 */
class PlayedEntryRepository {
    /**
     * Log a played entry to the database
     * @param {string} serverId - Discord guild ID
     * @param {string} userId - Discord user ID who requested the song
     * @param {string} youtubeUrl - YouTube video URL
     * @param {string} title - Video title
     * @param {string?} channelName - YouTube channel name
     * @param {string?} durationRaw - Duration as raw string (e.g., "3:45")
     * @param {number?} durationInSeconds - Duration in seconds
     * @param {Date?} requestedAt - When the song was requested
     * @param {Date?} playedAt - When the song finished playing
     * @param {boolean} playedInFull - Whether the song played to completion
     * @returns {Promise<void>}
     */
    async logPlayedEntry(
        serverId,
        userId,
        youtubeUrl,
        title,
        channelName = null,
        durationRaw = null,
        durationInSeconds = null,
        requestedAt = null,
        playedAt = null,
        playedInFull = false
    ) {
        try {
            await prisma.playedEntry.create({
                data: {
                    serverId: serverId,
                    userId: userId,
                    youtubeUrl: youtubeUrl,
                    title: title,
                    channelName: channelName,
                    durationRaw: durationRaw,
                    durationInSeconds: durationInSeconds,
                    requestedAt: requestedAt || new Date(),
                    playedAt: playedAt || new Date(),
                    playedInFull: playedInFull,
                },
            });
        } catch (error) {
            logger.error(`Erro ao registrar entrada tocada no banco: ${title}`, error);
        }
    }
}

module.exports = new PlayedEntryRepository();

