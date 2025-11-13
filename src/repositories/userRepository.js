const { prisma } = require('../util/database');
const logger = require('../util/logger');

/**
 * Repository for User operations
 */
class UserRepository {
    /**
     * Ensure a user exists in the database, create if not exists
     * @param {string} userId - Discord user ID
     * @param {string} username - Username
     * @param {string} tag - Full user tag (username#discriminator)
     * @returns {Promise<void>}
     */
    async ensureUser(userId, username, tag) {
        try {
            await prisma.user.upsert({
                where: { id: userId },
                update: {
                    username: username,
                    tag: tag,
                    updatedAt: new Date(),
                },
                create: {
                    id: userId,
                    username: username,
                    tag: tag,
                },
            });
        } catch (error) {
            logger.error(`Erro ao garantir usuário no banco: ${userId}`, error);
        }
    }
}

module.exports = new UserRepository();

