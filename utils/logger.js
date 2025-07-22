const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logsPath = path.join(__dirname, '../logs/confessions.json');
        this.ensureLogsDirectory();
    }

    ensureLogsDirectory() {
        const logsDir = path.dirname(this.logsPath);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.logsPath)) {
            fs.writeFileSync(this.logsPath, JSON.stringify([], null, 2));
        }
    }

    logConfession(confessionData) {
        try {
            // Read existing logs
            const logsContent = fs.readFileSync(this.logsPath, 'utf8');
            const logs = JSON.parse(logsContent);

            // Add new confession log
            logs.push(confessionData);

            // Keep only the last 1000 confessions to prevent file from growing too large
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }

            // Write back to file
            fs.writeFileSync(this.logsPath, JSON.stringify(logs, null, 2));

            console.log(`Confession logged: ${confessionData.id} by ${confessionData.author.username}`);
        } catch (error) {
            console.error('Error logging confession:', error);
        }
    }

    getConfessionLogs(limit = 50) {
        try {
            const logsContent = fs.readFileSync(this.logsPath, 'utf8');
            const logs = JSON.parse(logsContent);
            
            // Return the most recent logs
            return logs.slice(-limit).reverse();
        } catch (error) {
            console.error('Error reading confession logs:', error);
            return [];
        }
    }

    getConfessionById(messageId) {
        try {
            const logsContent = fs.readFileSync(this.logsPath, 'utf8');
            const logs = JSON.parse(logsContent);
            
            return logs.find(log => log.id === messageId);
        } catch (error) {
            console.error('Error finding confession by ID:', error);
            return null;
        }
    }

    getConfessionsByUser(userId, limit = 20) {
        try {
            const logsContent = fs.readFileSync(this.logsPath, 'utf8');
            const logs = JSON.parse(logsContent);
            
            return logs
                .filter(log => log.author.id === userId)
                .slice(-limit)
                .reverse();
        } catch (error) {
            console.error('Error finding confessions by user:', error);
            return [];
        }
    }

    getStatistics() {
        try {
            const logsContent = fs.readFileSync(this.logsPath, 'utf8');
            const logs = JSON.parse(logsContent);
            
            const stats = {
                totalConfessions: logs.length,
                textOnly: logs.filter(log => log.content.text && !log.content.hasImage).length,
                imageOnly: logs.filter(log => !log.content.text && log.content.hasImage).length,
                textAndImage: logs.filter(log => log.content.text && log.content.hasImage).length,
                uniqueUsers: new Set(logs.map(log => log.author.id)).size,
                last24Hours: logs.filter(log => {
                    const logTime = new Date(log.timestamp);
                    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return logTime > yesterday;
                }).length
            };
            
            return stats;
        } catch (error) {
            console.error('Error generating statistics:', error);
            return null;
        }
    }
}

module.exports = new Logger();
