const { prisma } = require('../util/database');
const logger = require('../util/logger');

/**
 * Repository for PlayedEntry operations
 */
class PlayedEntryRepository {
    /**
     * Create a played entry when playback starts
     * @param {string} serverId - Discord guild ID
     * @param {string} userId - Discord user ID who requested the song
     * @param {string} youtubeUrl - YouTube video URL
     * @param {string} title - Video title
     * @param {string?} channelName - YouTube channel name
     * @param {string?} durationRaw - Duration as raw string (e.g., "3:45")
     * @param {number?} durationInSeconds - Duration in seconds
     * @param {Date?} requestedAt - When the song was requested
     * @returns {Promise<number | null>} The created entry ID, or null on error
     */
    async createPlayedEntry(
        serverId,
        userId,
        youtubeUrl,
        title,
        channelName = null,
        durationRaw = null,
        durationInSeconds = null,
        requestedAt = null
    ) {
        try {
            const entry = await prisma.playedEntry.create({
                data: {
                    serverId: serverId,
                    userId: userId,
                    youtubeUrl: youtubeUrl,
                    title: title,
                    channelName: channelName,
                    durationRaw: durationRaw,
                    durationInSeconds: durationInSeconds,
                    requestedAt: requestedAt || new Date(),
                    playedAt: new Date(), // Will be updated when playback finishes
                    playedInFull: false, // Will be updated when playback finishes
                },
            });
            return entry.id;
        } catch (error) {
            logger.error(`Erro ao criar entrada tocada no banco: ${title}`, error);
            return null;
        }
    }

    /**
     * Update a played entry when playback finishes or gets skipped
     * @param {number} entryId - The entry ID to update
     * @param {Date?} playedAt - When the song finished playing
     * @param {boolean} playedInFull - Whether the song played to completion
     * @returns {Promise<void>}
     */
    async updatePlayedEntry(entryId, playedAt = null, playedInFull = false) {
        try {
            await prisma.playedEntry.update({
                where: { id: entryId },
                data: {
                    playedAt: playedAt || new Date(),
                    playedInFull: playedInFull,
                },
            });
        } catch (error) {
            logger.error(`Erro ao atualizar entrada tocada no banco: ID ${entryId}`, error);
        }
    }
}

module.exports = new PlayedEntryRepository();
