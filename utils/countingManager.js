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

            // Note: Restriction "same_user" appliquée sauf après reset (currentNumber = 0)
            // Après une remise à zéro, n'importe qui peut recommencer, même le joueur qui a causé l'erreur

            let expectedNumber = channelConfig.currentNumber + 1;
            let actualNumber;

            if (config.mathEnabled) {
                // Mode mathématique activé
                const calculation = this.parseExpression(content);
                console.log(`🎲 Calcul reçu:`, calculation);
                if (calculation.error) {
                    return {
                        valid: false,
                        reason: 'math_error',
                        message: '', // Plus de message automatique - tout dans l'embed
                        emoji: '💥',
                        shouldReset: true
                    };
                }
                actualNumber = calculation.result;
                console.log(`🔢 Nombre calculé: ${actualNumber}`);
            } else {
                // Mode simple (nombres uniquement)
                actualNumber = parseInt(content);
                if (isNaN(actualNumber)) {
                    return {
                        valid: false,
                        reason: 'not_number',
                        message: '', // Plus de message automatique - tout dans l'embed
                        emoji: '💥',
                        shouldReset: true
                    };
                }
            }

            // DEBUG: Afficher les informations de validation (mode réduit)
            console.log(`🔍 Validation: lastUser="${channelConfig.lastUserId}" | current=${channelConfig.currentNumber} | attendu=${expectedNumber} | reçu=${actualNumber}`);

            // Vérifier si c'est le même utilisateur (double comptage) - SAUF si le comptage a été resetté
            // Après un reset, currentNumber = 0 ET lastUserId = null, donc n'importe qui peut recommencer
            if (channelConfig.lastUserId === message.author.id && channelConfig.currentNumber > 0) {
                console.log(`🚨 DOUBLE COMPTAGE DÉTECTÉ: même utilisateur ${message.author.id}`);
                return {
                    valid: false,
                    reason: 'same_user_reset',
                    message: '', // Plus de message automatique - tout dans l'embed
                    emoji: '💥',
                    shouldReset: true, // Reset immédiat pour double comptage
                    expectedNumber: expectedNumber,
                    receivedNumber: actualNumber,
                    keepMessage: true
                };
            }

            // Vérifier si le nombre est correct
            if (actualNumber !== expectedNumber) {
                console.log(`🚨 MAUVAIS NOMBRE: attendu ${expectedNumber}, reçu ${actualNumber}`);
                return {
                    valid: false,
                    reason: 'wrong_number',
                    message: '', // Plus de message automatique - tout dans l'embed
                    emoji: '💥',
                    shouldReset: true,
                    expectedNumber: expectedNumber,
                    receivedNumber: actualNumber,
                    keepMessage: true // Flag pour conserver le message d'erreur
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
                message: '', // Plus de message d'erreur - tout dans l'embed
                emoji: '❌',
                shouldReset: true
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

            // Vérifier si c'est un nouveau record
            const isNewRecord = validationResult.number > (channelConfig.record || 0);
            if (isNewRecord) {
                channelConfig.record = validationResult.number;
                channelConfig.recordDate = new Date().toISOString();
                channelConfig.recordUserId = userId;
                console.log(`🏆 NOUVEAU RECORD: ${validationResult.number} par ${message.author.tag}`);
            }

            // Mettre à jour la configuration
            channelConfig.currentNumber = validationResult.number;
            channelConfig.lastUserId = userId;
            channelConfig.lastMessageId = message.id;

            this.saveCountingConfig(guildId, config);

            // Ajouter réactions
            try {
                if (config.reactionsEnabled) {
                    await message.react(validationResult.emoji); // ✅ pour message valide
                    
                    if (isNewRecord) {
                        await message.react('🏆'); // 🏆 pour nouveau record
                        console.log(`🏆 Réaction record ajoutée pour: "${message.content}"`);
                    }
                }
            } catch (reactionError) {
                console.error('Erreur ajout réaction:', reactionError);
            }

            console.log(`✅ Message valide accepté: "${message.content}" par ${message.author.tag}`);

        } catch (error) {
            console.error('Erreur processCountingMessage:', error);
        }
    }

    // Traiter un message de comptage invalide - RÉACTION ❌ + EMBED CLASSE
    async processInvalidMessage(message, validationResult) {
        try {
            const guildId = message.guild.id;
            const channelId = message.channel.id;

            const config = this.getCountingConfig(guildId);
            const channelConfig = config.channels.find(c => c.channelId === channelId);

            if (!channelConfig) return;

            // Ajouter réaction ❌ pour les erreurs
            try {
                await message.react('❌');
                console.log(`❌ Réaction d'erreur ajoutée pour: "${message.content}" par ${message.author.tag}`);
            } catch (reactionError) {
                console.error('Erreur ajout réaction ❌:', reactionError);
            }

            // Créer embed classe selon le type d'erreur
            if (validationResult.shouldReset) {
                console.log(`🔧 Création embed pour erreur: ${validationResult.reason}`);
                const { EmbedBuilder } = require('discord.js');
                
                let embed;
                
                if (validationResult.reason === 'same_user_reset') {
                    // Embed spécial pour double comptage
                    embed = new EmbedBuilder()
                        .setTitle('⚡ Double Comptage Détecté')
                        .setDescription(`**${message.author.username}** a tenté de compter deux fois consécutivement`)
                        .addFields(
                            { name: '🎯 Nombre Tenté', value: `\`${validationResult.receivedNumber}\``, inline: true },
                            { name: '🔄 Reset Effectué', value: `Retour à \`0\``, inline: true },
                            { name: '🏆 Record Serveur', value: `\`${channelConfig.record || 0}\``, inline: true }
                        )
                        .setColor(0xff4757) // Rouge moderne
                        .setTimestamp()
                        .setFooter({ 
                            text: 'N\'importe qui peut redémarrer à 1', 
                            iconURL: message.guild.iconURL() 
                        });
                } else if (validationResult.reason === 'wrong_number') {
                    // Embed spécial pour mauvais nombre
                    embed = new EmbedBuilder()
                        .setTitle('🎯 Erreur de Séquence')
                        .setDescription(`**${message.author.username}** a écrit \`${validationResult.receivedNumber}\` au lieu de \`${validationResult.expectedNumber}\``)
                        .addFields(
                            { name: '✅ Attendu', value: `\`${validationResult.expectedNumber}\``, inline: true },
                            { name: '❌ Reçu', value: `\`${validationResult.receivedNumber}\``, inline: true },
                            { name: '🏆 Record', value: `\`${channelConfig.record || 0}\``, inline: true }
                        )
                        .setColor(0xffa726) // Orange moderne
                        .setTimestamp()
                        .setFooter({ 
                            text: 'Comptage remis à zéro - Redémarrer à 1', 
                            iconURL: message.guild.iconURL() 
                        });
                } else {
                    // Embed générique pour autres erreurs
                    embed = new EmbedBuilder()
                        .setTitle('🚫 Erreur de Comptage')
                        .setDescription(`**${message.author.username}** : ${validationResult.reason}`)
                        .addFields(
                            { name: '🔄 Action', value: 'Reset automatique', inline: true },
                            { name: '🎯 Prochain', value: '`1`', inline: true },
                            { name: '🏆 Record', value: `\`${channelConfig.record || 0}\``, inline: true }
                        )
                        .setColor(0xe74c3c) // Rouge classique
                        .setTimestamp()
                        .setFooter({ 
                            text: 'Système de comptage automatique', 
                            iconURL: message.guild.iconURL() 
                        });
                }

                // Envoyer l'embed avec debug complet
                try {
                    console.log(`🎨 Tentative d'envoi embed pour ${validationResult.reason}...`);
                    const sentMessage = await message.channel.send({ embeds: [embed] });
                    console.log(`📨 ✅ Embed classe envoyé avec succès! ID: ${sentMessage.id}`);
                } catch (embedError) {
                    console.error(`❌ Erreur envoi embed:`, embedError);
                }
            }

            console.log(`📝 ✅ EMBED SYSTEM: Message d'erreur traité avec embed: "${message.content}" par ${message.author.tag} - ${validationResult.reason}`);

        } catch (error) {
            console.error('Erreur processInvalidMessage:', error);
        }
    }

    // SUPPRIMÉ - Méthode dédiée remplacée par inline dans processInvalidMessage

    // Vérifier si un contenu est un nombre ou une expression mathématique valide
    isValidNumberOrMath(content) {
        // Nettoyer le contenu
        const cleaned = content.trim().replace(/\s+/g, '');
        
        if (!cleaned) return false;
        
        // Vérifier si c'est un nombre simple
        if (/^\d+$/.test(cleaned)) {
            console.log(`✅ Nombre simple détecté: "${content}"`);
            return true;
        }
        
        // Vérifier si c'est une expression mathématique pure
        // Caractères autorisés : chiffres, opérateurs mathématiques, parenthèses, racine carrée
        const mathPattern = /^[0-9+\-*×÷\/^%()√.,\s]+$/;
        
        if (!mathPattern.test(cleaned)) {
            console.log(`🚫 Message ignoré (caractères non-mathématiques): "${content}"`);
            return false;
        }
        
        // Vérifier qu'il y a au moins un chiffre
        if (!/\d/.test(cleaned)) {
            console.log(`🚫 Message ignoré (aucun chiffre): "${content}"`);
            return false;
        }
        
        // Rejeter les messages qui sont principalement du texte
        const digitCount = (cleaned.match(/\d/g) || []).length;
        const totalLength = cleaned.length;
        
        // Au moins 30% du message doit être des chiffres pour être considéré comme mathématique
        if (digitCount / totalLength < 0.3) {
            console.log(`🚫 Message ignoré (pas assez de chiffres): "${content}" (${digitCount}/${totalLength})`);
            return false;
        }
        
        console.log(`✅ Expression mathématique détectée: "${content}"`);
        return true;
    }

    // Parser une expression mathématique
    parseExpression(expression) {
        try {
            console.log(`🔍 parseExpression début: "${expression}"`);
            
            // Nettoyer l'expression
            let cleaned = expression.replace(/\s+/g, '');
            console.log(`🧹 Après nettoyage: "${cleaned}"`);
            
            // Remplacer les symboles Unicode
            cleaned = cleaned.replace(/×/g, '*').replace(/÷/g, '/');
            console.log(`🔄 Après Unicode: "${cleaned}"`);
            
            // Gérer la racine carrée (symbole uniquement, éviter le double remplacement)
            if (cleaned.includes('√')) {
                cleaned = cleaned.replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)');
                cleaned = cleaned.replace(/√(\d+(?:\.\d+)?)/g, 'Math.sqrt($1)');
                console.log(`√ Après racine carrée: "${cleaned}"`);
            }
            
            // Remplacer les fonctions mathématiques courantes SEULEMENT si pas déjà préfixées
            if (!cleaned.includes('Math.sqrt')) {
                cleaned = cleaned.replace(/\bsqrt\(([^)]+)\)/gi, 'Math.sqrt($1)');
            }
            if (!cleaned.includes('Math.pow')) {
                cleaned = cleaned.replace(/\bpow\(([^,]+),([^)]+)\)/gi, 'Math.pow($1,$2)');
            }
            if (!cleaned.includes('Math.abs')) {
                cleaned = cleaned.replace(/\babs\(([^)]+)\)/gi, 'Math.abs($1)');
            }
            console.log(`🔧 Après fonctions: "${cleaned}"`);
            
            // Remplacer les constantes mathématiques
            cleaned = cleaned.replace(/\bpi\b/gi, 'Math.PI');
            cleaned = cleaned.replace(/\be\b/gi, 'Math.E');
            
            // Remplacer ^ par Math.pow pour les puissances simples
            cleaned = cleaned.replace(/(\d+(?:\.\d+)?)\^(\d+(?:\.\d+)?)/g, 'Math.pow($1,$2)');
            cleaned = cleaned.replace(/\(([^)]+)\)\^(\d+(?:\.\d+)?)/g, 'Math.pow(($1),$2)');
            
            console.log(`✨ Expression finale à évaluer: "${cleaned}"`);
            
            // Évaluation sécurisée
            let result;
            
            // Pour les expressions simples, utiliser eval directement
            if (/^[0-9+\-*\/().,\s]+$/.test(cleaned)) {
                console.log('📊 Évaluation simple avec eval');
                result = eval(cleaned);
            } else {
                console.log('🧮 Évaluation avec Function constructor');
                // Pour les expressions avec Math., utiliser Function constructor
                const func = new Function('Math', `return ${cleaned}`);
                result = func(Math);
            }
            
            console.log(`🎯 Résultat calculé: ${result}`);
            
            // Vérifier que le résultat est un nombre valide
            if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
                console.log('❌ Résultat invalide');
                return { error: 'Résultat de calcul invalide' };
            }
            
            // Arrondir si nécessaire
            result = Math.round(result);
            console.log(`✅ Résultat final: ${result}`);
            
            return { result: result };
            
        } catch (error) {
            console.log('❌ Erreur parseExpression:', error);
            return { error: 'Expression mathématique invalide' };
        }
    }

    // Évaluation sécurisée d'expressions mathématiques
    safeEval(expression) {
        try {
            // Liste blanche des fonctions et constantes autorisées
            const allowedFunctions = {
                'Math.sqrt': Math.sqrt,
                'Math.pow': Math.pow,
                'Math.abs': Math.abs,
                'Math.round': Math.round,
                'Math.floor': Math.floor,
                'Math.ceil': Math.ceil,
                'Math.max': Math.max,
                'Math.min': Math.min,
                'Math.PI': Math.PI,
                'Math.E': Math.E
            };
            
            // Validation finale avant évaluation
            const dangerousPatterns = [
                /eval\(/i,
                /function\(/i,
                /=>/,
                /\.\s*constructor/i,
                /\.\s*prototype/i,
                /require\(/i,
                /import\(/i,
                /process\./i,
                /global\./i,
                /window\./i,
                /document\./i
            ];
            
            for (const pattern of dangerousPatterns) {
                if (pattern.test(expression)) {
                    return null;
                }
            }
            
            // Pour les expressions simples sans fonctions Math, utiliser eval direct
            if (!/Math\./.test(expression)) {
                try {
                    return eval(expression);
                } catch (error) {
                    return null;
                }
            }
            
            // Pour les expressions avec fonctions Math, utiliser un contexte simplifié
            try {
                // Créer un contexte avec des noms simples pour éviter les problèmes de Function constructor
                const Math_sqrt = Math.sqrt;
                const Math_pow = Math.pow;
                const Math_abs = Math.abs;
                const Math_round = Math.round;
                const Math_floor = Math.floor;
                const Math_ceil = Math.ceil;
                const Math_max = Math.max;
                const Math_min = Math.min;
                const Math_PI = Math.PI;
                const Math_E = Math.E;
                
                // Remplacer les points par des underscores dans l'expression pour l'évaluation
                let evalExpression = expression
                    .replace(/Math\.sqrt/g, 'Math_sqrt')
                    .replace(/Math\.pow/g, 'Math_pow')
                    .replace(/Math\.abs/g, 'Math_abs')
                    .replace(/Math\.round/g, 'Math_round')
                    .replace(/Math\.floor/g, 'Math_floor')
                    .replace(/Math\.ceil/g, 'Math_ceil')
                    .replace(/Math\.max/g, 'Math_max')
                    .replace(/Math\.min/g, 'Math_min')
                    .replace(/Math\.PI/g, 'Math_PI')
                    .replace(/Math\.E/g, 'Math_E');
                
                const func = new Function('Math_sqrt', 'Math_pow', 'Math_abs', 'Math_round', 'Math_floor', 'Math_ceil', 'Math_max', 'Math_min', 'Math_PI', 'Math_E', `return ${evalExpression}`);
                const result = func(Math_sqrt, Math_pow, Math_abs, Math_round, Math_floor, Math_ceil, Math_max, Math_min, Math_PI, Math_E);
                return result;
            } catch (error) {
                console.log('Erreur Function constructor:', error.message);
                return null;
            }
            
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