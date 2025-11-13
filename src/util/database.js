const logger = require('./logger');
const { PrismaClient } = require('@prisma/client');

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
    initialize,
    disconnect,
    prisma,
};

