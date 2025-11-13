const { prisma } = require('../util/database');
const logger = require('../util/logger');

/**
 * Repository for CommandExecution operations
 */
class CommandExecutionRepository {
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
    async logCommand(serverId, userId, commandName, commandArguments, success, errorMessage = null, errorAt = null) {
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
}

module.exports = new CommandExecutionRepository();

