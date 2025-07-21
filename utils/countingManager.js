const fs = require('fs');
const path = require('path');

class CountingManager {
    constructor() {
        this.configPath = path.join(__dirname, '../data/counting.json');
        this.mathOperators = {
            '+': (a, b) => a + b,
            '-': (a, b) => a - b,
            '*': (a, b) => a * b,
            '×': (a, b) => a * b,
            '/': (a, b) => b !== 0 ? a / b : null,
            '÷': (a, b) => b !== 0 ? a / b : null,
            '^': (a, b) => Math.pow(a, b),
            '%': (a, b) => b !== 0 ? a % b : null
        };
    }

    // Vérifier si un message de comptage est valide
    async validateCountingMessage(message) {
        try {
            const guildId = message.guild.id;
            const channelId = message.channel.id;
            const userId = message.author.id;
            const content = message.content.trim();

            // Récupérer la configuration
            const config = this.getCountingConfig(guildId);
            const channelConfig = config.channels.find(c => c.channelId === channelId);

            if (!channelConfig) {
                return { valid: false, reason: 'not_counting_channel' };
            }

            // Vérifier si le message contient des pièces jointes (images, fichiers, etc.)
            if (message.attachments.size > 0) {
                return { valid: false, reason: 'ignore_message', ignore: true };
            }

            // Vérifier si c'est un nombre ou une expression mathématique valide
            if (!this.isValidNumberOrMath(content)) {
                return { valid: false, reason: 'ignore_message', ignore: true };
            }

            // Vérifier si c'est le même utilisateur que le précédent
            if (channelConfig.lastUserId === userId) {
                return { 
                    valid: false, 
                    reason: 'same_user',
                    message: '❌ Tu ne peux pas compter deux fois de suite !',
                    emoji: '❌',
                    shouldReset: true
                };
            }

            let expectedNumber = channelConfig.currentNumber + 1;
            let actualNumber;

            if (config.mathEnabled) {
                // Mode mathématique activé
                const calculation = this.parseExpression(content);
                if (calculation.error) {
                    return {
                        valid: false,
                        reason: 'math_error',
                        message: `❌ Erreur mathématique: ${calculation.error}`,
                        emoji: '❌',
                        shouldReset: true
                    };
                }
                actualNumber = calculation.result;
            } else {
                // Mode simple (nombres uniquement)
                actualNumber = parseInt(content);
                if (isNaN(actualNumber)) {
                    return {
                        valid: false,
                        reason: 'not_number',
                        message: '❌ Ce n\'est pas un nombre valide !',
                        emoji: '❌',
                        shouldReset: true
                    };
                }
            }

            // Vérifier si le nombre est correct
            if (actualNumber !== expectedNumber) {
                return {
                    valid: false,
                    reason: 'wrong_number',
                    message: `❌ Mauvais nombre ! Attendu: **${expectedNumber}**, reçu: **${actualNumber}**`,
                    emoji: '❌',
                    shouldReset: true,
                    expectedNumber: expectedNumber,
                    receivedNumber: actualNumber
                };
            }

            // Le message est valide
            return {
                valid: true,
                number: actualNumber,
                message: this.getSuccessMessage(actualNumber),
                emoji: '✅'
            };

        } catch (error) {
            console.error('Erreur validateCountingMessage:', error);
            return {
                valid: false,
                reason: 'error',
                message: '❌ Une erreur est survenue lors de la validation',
                emoji: '❌'
            };
        }
    }

    // Traiter un message de comptage valide
    async processCountingMessage(message, validationResult) {
        try {
            const guildId = message.guild.id;
            const channelId = message.channel.id;
            const userId = message.author.id;

            const config = this.getCountingConfig(guildId);
            const channelConfig = config.channels.find(c => c.channelId === channelId);

            if (!channelConfig) return;

            // Mettre à jour la configuration
            channelConfig.currentNumber = validationResult.number;
            channelConfig.lastUserId = userId;
            channelConfig.lastMessageId = message.id;

            this.saveCountingConfig(guildId, config);

            // Ajouter une réaction si activé
            if (config.reactionsEnabled) {
                await message.react(validationResult.emoji);
            }

            // Messages spéciaux pour certains nombres
            if (this.isSpecialNumber(validationResult.number)) {
                await message.reply(this.getSpecialMessage(validationResult.number));
            }

        } catch (error) {
            console.error('Erreur processCountingMessage:', error);
        }
    }

    // Traiter un message de comptage invalide
    async processInvalidMessage(message, validationResult) {
        try {
            const guildId = message.guild.id;
            const channelId = message.channel.id;

            const config = this.getCountingConfig(guildId);
            const channelConfig = config.channels.find(c => c.channelId === channelId);

            if (!channelConfig) return;

            // Ajouter une réaction d'erreur si activé
            if (config.reactionsEnabled) {
                await message.react(validationResult.emoji);
            }

            // Envoyer un message d'erreur
            if (validationResult.message) {
                const errorMessage = await message.reply(validationResult.message);
                
                // Supprimer le message d'erreur après 5 secondes
                setTimeout(async () => {
                    try {
                        await errorMessage.delete();
                    } catch (error) {
                        // Ignorer les erreurs de suppression
                    }
                }, 5000);
            }

            // Réinitialiser le canal si nécessaire
            if (validationResult.shouldReset) {
                const oldNumber = channelConfig.currentNumber;
                channelConfig.currentNumber = 0;
                channelConfig.lastUserId = null;
                channelConfig.lastMessageId = null;
                this.saveCountingConfig(guildId, config);

                // Message de réinitialisation avec détails
                let resetMessage = `🔄 **Comptage réinitialisé !**\n\n`;
                
                if (validationResult.reason === 'wrong_number') {
                    resetMessage += `❌ **Erreur:** Mauvais nombre (attendu: ${validationResult.expectedNumber}, reçu: ${validationResult.receivedNumber})\n`;
                } else if (validationResult.reason === 'same_user') {
                    resetMessage += `❌ **Erreur:** <@${message.author.id}> a tenté de compter deux fois de suite\n`;
                } else if (validationResult.reason === 'math_error') {
                    resetMessage += `❌ **Erreur:** Expression mathématique invalide\n`;
                } else if (validationResult.reason === 'not_number') {
                    resetMessage += `❌ **Erreur:** "${message.content}" n'est pas un nombre valide\n`;
                }
                
                resetMessage += `📊 **Progression perdue:** 0 → ${oldNumber} → 0\n`;
                resetMessage += `🎯 **Recommençons !** Le prochain nombre est **1**`;

                await message.channel.send(resetMessage);
            }

        } catch (error) {
            console.error('Erreur processInvalidMessage:', error);
        }
    }

    // Vérifier si un contenu est un nombre ou une expression mathématique valide
    isValidNumberOrMath(content) {
        // Nettoyer le contenu
        const cleaned = content.trim().replace(/\s+/g, '');
        
        if (!cleaned) return false;
        
        // Vérifier si c'est un nombre simple
        if (/^\d+$/.test(cleaned)) {
            return true;
        }
        
        // Vérifier si c'est une expression mathématique
        // Caractères autorisés : chiffres, opérateurs mathématiques, parenthèses, racine carrée
        const mathPattern = /^[0-9+\-*×÷\/^%()√.,\s]+$/;
        
        if (!mathPattern.test(cleaned)) {
            return false;
        }
        
        // Vérifier qu'il y a au moins un chiffre
        if (!/\d/.test(cleaned)) {
            return false;
        }
        
        // Rejeter les messages qui sont principalement du texte
        const digitCount = (cleaned.match(/\d/g) || []).length;
        const totalLength = cleaned.length;
        
        // Au moins 30% du message doit être des chiffres pour être considéré comme mathématique
        return digitCount / totalLength >= 0.3;
    }

    // Parser une expression mathématique
    parseExpression(expression) {
        try {
            // Nettoyer l'expression
            let cleaned = expression.replace(/\s+/g, '');
            
            // Remplacer les symboles Unicode
            cleaned = cleaned.replace(/×/g, '*').replace(/÷/g, '/');
            
            // Gérer la racine carrée
            if (cleaned.includes('√')) {
                cleaned = cleaned.replace(/√(\d+)/g, 'Math.sqrt($1)');
            }
            
            // Validation de sécurité - ne permettre que les caractères mathématiques
            if (!/^[0-9+\-*\/^%().\s]+$/.test(cleaned.replace(/Math\.sqrt/g, ''))) {
                return { error: 'Caractères non autorisés dans l\'expression' };
            }
            
            // Remplacer ^ par Math.pow
            cleaned = cleaned.replace(/(\d+)\^(\d+)/g, 'Math.pow($1,$2)');
            
            // Évaluer l'expression de manière sécurisée
            const result = this.safeEval(cleaned);
            
            if (result === null || isNaN(result) || !isFinite(result)) {
                return { error: 'Résultat invalide' };
            }
            
            // Arrondir à l'entier le plus proche
            const roundedResult = Math.round(result);
            
            return { result: roundedResult };
            
        } catch (error) {
            return { error: 'Expression mathématique invalide' };
        }
    }

    // Évaluation sécurisée d'expressions mathématiques
    safeEval(expression) {
        try {
            // Liste blanche des fonctions autorisées
            const allowedFunctions = {
                'Math.sqrt': Math.sqrt,
                'Math.pow': Math.pow,
                'Math.abs': Math.abs,
                'Math.round': Math.round,
                'Math.floor': Math.floor,
                'Math.ceil': Math.ceil
            };
            
            // Remplacer les fonctions par des variables temporaires
            let safeExpression = expression;
            const functionMap = {};
            let counter = 0;
            
            for (const [func, implementation] of Object.entries(allowedFunctions)) {
                const regex = new RegExp(func.replace('.', '\\.'), 'g');
                const placeholder = `__FUNC${counter}__`;
                safeExpression = safeExpression.replace(regex, placeholder);
                functionMap[placeholder] = implementation;
                counter++;
            }
            
            // Créer une fonction d'évaluation sécurisée
            const func = new Function(
                ...Object.keys(functionMap),
                `return (${safeExpression})`
            );
            
            return func(...Object.values(functionMap));
            
        } catch (error) {
            return null;
        }
    }

    // Vérifier si un nombre est spécial
    isSpecialNumber(number) {
        const specialNumbers = [
            100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
            1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000
        ];
        return specialNumbers.includes(number) || number % 1000 === 0;
    }

    // Obtenir un message spécial pour certains nombres
    getSpecialMessage(number) {
        if (number === 100) return '🎉 **Premier centenaire !** Félicitations !';
        if (number === 500) return '🏆 **500 !** Vous êtes sur la bonne voie !';
        if (number === 1000) return '🎊 **Millier atteint !** Incroyable !';
        if (number === 5000) return '🌟 **5000 !** Vous êtes des champions !';
        if (number === 10000) return '💎 **DIX MILLE !** Légendaire !';
        if (number % 1000 === 0) return `🎯 **${number} !** Superbe nombre rond !`;
        return `🎈 **${number} !** Continue comme ça !`;
    }

    // Obtenir un message de succès
    getSuccessMessage(number) {
        const messages = [
            '✅ Correct !',
            '🎯 Parfait !',
            '👍 Bien joué !',
            '🔥 Excellent !',
            '⭐ Bravo !',
            '💯 Parfait !',
            '🎉 Superbe !',
            '✨ Magnifique !'
        ];
        
        if (number % 100 === 0) return '🎊 Nombre rond !';
        if (number % 50 === 0) return '🎯 Joli nombre !';
        if (number % 10 === 0) return '⭐ Dixaine !';
        
        return messages[Math.floor(Math.random() * messages.length)];
    }

    // Récupérer la configuration de comptage
    getCountingConfig(guildId) {
        try {
            if (!fs.existsSync(path.dirname(this.configPath))) {
                fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
            }

            if (!fs.existsSync(this.configPath)) {
                fs.writeFileSync(this.configPath, '{}');
            }

            const data = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            
            if (!data[guildId]) {
                data[guildId] = {
                    channels: [],
                    mathEnabled: true,
                    reactionsEnabled: true
                };
                fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
            }

            return data[guildId];
        } catch (error) {
            console.error('Erreur getCountingConfig:', error);
            return {
                channels: [],
                mathEnabled: true,
                reactionsEnabled: true
            };
        }
    }

    // Sauvegarder la configuration
    saveCountingConfig(guildId, config) {
        try {
            const data = fs.existsSync(this.configPath) ? 
                JSON.parse(fs.readFileSync(this.configPath, 'utf8')) : {};
            
            data[guildId] = config;
            fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Erreur saveCountingConfig:', error);
        }
    }

    // Obtenir les statistiques de comptage pour un serveur
    getCountingStats(guildId) {
        const config = this.getCountingConfig(guildId);
        return {
            totalChannels: config.channels.length,
            mathEnabled: config.mathEnabled,
            reactionsEnabled: config.reactionsEnabled,
            channels: config.channels.map(c => ({
                channelId: c.channelId,
                currentNumber: c.currentNumber,
                lastUserId: c.lastUserId
            }))
        };
    }
}

module.exports = new CountingManager();