const { prisma } = require('../util/database');
const logger = require('../util/logger');

/**
 * Repository for Server operations
 */
class ServerRepository {
    /**
     * Ensure a server exists in the database, create if not exists
     * @param {string} serverId - Discord guild ID
     * @param {string} serverName - Server name
     * @param {string} ownerId - Server owner Discord ID
     * @returns {Promise<void>}
     */
    async ensureServer(serverId, serverName, ownerId) {
        try {
            await prisma.server.upsert({
                where: { id: serverId },
                update: {
                    name: serverName,
                    ownerId: ownerId,
                    updatedAt: new Date(),
                },
                create: {
                    id: serverId,
                    name: serverName,
                    ownerId: ownerId,
                },
            });
        } catch (error) {
            logger.error(`Erro ao garantir servidor no banco: ${serverId}`, error);
        }
    }
}

module.exports = new ServerRepository();

