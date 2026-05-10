const logger = require('../config/logger');
const fs = require('fs').promises;
const path = require('path');

class LogService {
    // Buscar logs de erro por data
    static async getErrorLogs(date) {
        try {
            const logPath = path.join(__dirname, '../../logs/errors', `${date}-error.log`);
            const content = await fs.readFile(logPath, 'utf-8');
            const logs = content.split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line));
            return logs;
        } catch (error) {
            logger.error('Erro ao ler logs', { error: error.message });
            return [];
        }
    }
    
    // Buscar logs combinados
    static async getCombinedLogs(date) {
        try {
            const logPath = path.join(__dirname, '../../logs/combined', `${date}-combined.log`);
            const content = await fs.readFile(logPath, 'utf-8');
            const logs = content.split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line));
            return logs;
        } catch (error) {
            return [];
        }
    }
    
    // Estatísticas de erro
    static async getErrorStats(days = 7) {
        const stats = {
            total: 0,
            byType: {},
            byHour: new Array(24).fill(0),
            last24h: 0
        };
        
        const now = new Date();
        
        for (let i = 0; i < days; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const logs = await this.getErrorLogs(dateStr);
            
            logs.forEach(log => {
                stats.total++;
                
                // Contar por tipo de erro
                const errorType = log.type || 'Unknown';
                stats.byType[errorType] = (stats.byType[errorType] || 0) + 1;
                
                // Contar por hora
                const hour = new Date(log.timestamp).getHours();
                stats.byHour[hour]++;
                
                // Últimas 24h
                const logDate = new Date(log.timestamp);
                const diffHours = (now - logDate) / (1000 * 60 * 60);
                if (diffHours <= 24) stats.last24h++;
            });
        }
        
        return stats;
    }
}

module.exports = LogService;