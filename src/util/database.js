const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient();

/**
 * Initialize the database connection
 * @returns {Promise<void>}
 */
async function initialize() {
    try {
        await prisma.$connect();
        logger.info('Conexão com banco de dados estabelecida com sucesso.');
    } catch (error) {
        logger.error('Erro ao conectar com banco de dados:', error);
        throw error;
    }
}

/**
 * Ensure a server exists in the database, create if not exists
 * @param {string} serverId - Discord guild ID
 * @param {string} serverName - Server name
 * @param {string} ownerId - Server owner Discord ID
 * @returns {Promise<void>}
 */
async function ensureServer(serverId, serverName, ownerId) {
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

/**
 * Ensure a user exists in the database, create if not exists
 * @param {string} userId - Discord user ID
 * @param {string} username - Username
 * @param {string} tag - Full user tag (username#discriminator)
 * @returns {Promise<void>}
 */
async function ensureUser(userId, username, tag) {
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

/**
 * Log a command execution to the database
 * @param {string} serverId - Discord guild ID
 * @param {string} userId - Discord user ID
 * @param {string} commandName - Command name (e.g., "play", "skip")
 * @param {string?} commandArguments - Command arguments/parameters
 * @param {boolean} success - Whether command succeeded
 * @param {string?} errorMessage - Brief error description if command failed
 * @param {Date?} errorAt - Timestamp when error occurred
 * @returns {Promise<void>}
 */
async function logCommand(serverId, userId, commandName, commandArguments, success, errorMessage = null, errorAt = null) {
    try {
        await prisma.commandExecution.create({
            data: {
                serverId: serverId,
                userId: userId,
                commandName: commandName,
                arguments: commandArguments || null,
                success: success,
                errorMessage: errorMessage,
                errorAt: errorAt,
            },
        });
    } catch (error) {
        logger.error(`Erro ao registrar comando no banco: ${commandName}`, error);
    }
}

/**
 * Disconnect from the database
 * @returns {Promise<void>}
 */
async function disconnect() {
    try {
        await prisma.$disconnect();
        logger.info('Desconectado do banco de dados.');
    } catch (error) {
        logger.error('Erro ao desconectar do banco de dados:', error);
    }
}

module.exports = {
    prisma,
    initialize,
    ensureServer,
    ensureUser,
    logCommand,
    disconnect,
};

