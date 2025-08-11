/**
 * BUMP MANAGER
 * Gestionnaire pour le système de bump multi-plateforme
 */

const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class BumpManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.platforms = {
            'topgg': {
                name: 'Top.gg',
                cooldown: 12 * 60 * 60 * 1000, // 12 heures
                emoji: '🔥',
                color: '#ff6b6b'
            },
            'discordbotlist': {
                name: 'Discord Bot List',
                cooldown: 24 * 60 * 60 * 1000, // 24 heures
                emoji: '⭐',
                color: '#4267B2'
            },
            'discordboats': {
                name: 'Discord Boats',
                cooldown: 12 * 60 * 60 * 1000, // 12 heures
                emoji: '🚢',
                color: '#36393f'
            },
            'discordbots': {
                name: 'Discord Bots',
                cooldown: 24 * 60 * 60 * 1000, // 24 heures
                emoji: '🤖',
                color: '#7289da'
            },
            'disboard': {
                name: 'Disboard',
                cooldown: 2 * 60 * 60 * 1000, // 2 heures
                emoji: '📢',
                color: '#2f3136'
            }
        };
    }

    /**
     * Initialise la base de données pour le système de bump
     */
    async initializeDatabase() {
        try {
            if (!this.dataManager.db) {
                console.log('❌ Database not connected');
                return false;
            }

            // Créer la collection pour les configurations de bump
            const bumpConfigsCollection = this.dataManager.db.collection('bumpConfigs');
            await bumpConfigsCollection.createIndex({ guildId: 1 }, { unique: true });

            // Créer la collection pour les cooldowns de bump
            const bumpCooldownsCollection = this.dataManager.db.collection('bumpCooldowns');
            await bumpCooldownsCollection.createIndex({ guildId: 1, platform: 1 }, { unique: true });

            console.log('✅ Bump database initialized');
            return true;
        } catch (error) {
            console.error('❌ Error initializing bump database:', error);
            return false;
        }
    }

    /**
     * Récupère la configuration de bump pour un serveur
     */
    async getBumpConfig(guildId) {
        try {
            const config = await this.dataManager.db.collection('bumpConfigs').findOne({ guildId });
            if (!config) {
                // Configuration par défaut
                return {
                    guildId,
                    enabledPlatforms: [],
                    bumpChannelId: null,
                    autoReminder: true,
                    customMessage: null
                };
            }
            return config;
        } catch (error) {
            console.error('❌ Error getting bump config:', error);
            return null;
        }
    }

    /**
     * Met à jour la configuration de bump pour un serveur
     */
    async updateBumpConfig(guildId, config) {
        try {
            await this.dataManager.db.collection('bumpConfigs').updateOne(
                { guildId },
                { $set: { ...config, guildId, updatedAt: new Date() } },
                { upsert: true }
            );
            return true;
        } catch (error) {
            console.error('❌ Error updating bump config:', error);
            return false;
        }
    }

    /**
     * Vérifie les cooldowns pour toutes les plateformes
     */
    async checkCooldowns(guildId, userId) {
        try {
            const config = await this.getBumpConfig(guildId);
            if (!config || !config.enabledPlatforms.length) {
                return { canBump: [], onCooldown: [] };
            }

            const cooldowns = await this.dataManager.db.collection('bumpCooldowns').find({
                guildId,
                platform: { $in: config.enabledPlatforms }
            }).toArray();

            const now = Date.now();
            const canBump = [];
            const onCooldown = [];

            for (const platform of config.enabledPlatforms) {
                const cooldownData = cooldowns.find(c => c.platform === platform);
                const platformInfo = this.platforms[platform];

                if (!cooldownData || (now - cooldownData.lastBump) >= platformInfo.cooldown) {
                    canBump.push(platform);
                } else {
                    const timeLeft = platformInfo.cooldown - (now - cooldownData.lastBump);
                    onCooldown.push({
                        platform,
                        timeLeft,
                        nextBump: new Date(cooldownData.lastBump + platformInfo.cooldown)
                    });
                }
            }

            return { canBump, onCooldown };
        } catch (error) {
            console.error('❌ Error checking cooldowns:', error);
            return { canBump: [], onCooldown: [] };
        }
    }

    /**
     * Effectue le bump sur les plateformes sélectionnées
     */
    async performBump(guildId, userId, platforms) {
        try {
            const results = [];
            const now = Date.now();

            for (const platform of platforms) {
                // Simuler l'API call (à remplacer par de vraies APIs)
                const success = await this.callPlatformAPI(platform, guildId);
                
                if (success) {
                    // Mettre à jour le cooldown
                    await this.dataManager.db.collection('bumpCooldowns').updateOne(
                        { guildId, platform },
                        { 
                            $set: { 
                                lastBump: now,
                                userId,
                                updatedAt: new Date()
                            }
                        },
                        { upsert: true }
                    );

                    results.push({ platform, success: true });
                } else {
                    results.push({ platform, success: false, error: 'API Error' });
                }
            }

            return results;
        } catch (error) {
            console.error('❌ Error performing bump:', error);
            return [];
        }
    }

    /**
     * Appelle l'API d'une plateforme (simulation)
     */
    async callPlatformAPI(platform, guildId) {
        // Simulation d'appel API
        // Dans un vrai cas, ici on appellerait les vraies APIs
        return new Promise(resolve => {
            setTimeout(() => {
                // 90% de chance de succès
                resolve(Math.random() > 0.1);
            }, Math.random() * 2000 + 500);
        });
    }

    /**
     * Formate le temps restant
     */
    formatTimeLeft(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    /**
     * Crée l'embed de statut des bumps
     */
    createBumpStatusEmbed(guildId, cooldownInfo) {
        const embed = new EmbedBuilder()
            .setTitle('📢 Statut des Bumps')
            .setColor('#5865F2')
            .setTimestamp();

        if (cooldownInfo.canBump.length > 0) {
            const canBumpText = cooldownInfo.canBump
                .map(platform => `${this.platforms[platform].emoji} ${this.platforms[platform].name}`)
                .join('\n');
            embed.addFields({ name: '✅ Disponible maintenant', value: canBumpText, inline: true });
        }

        if (cooldownInfo.onCooldown.length > 0) {
            const cooldownText = cooldownInfo.onCooldown
                .map(cd => `${this.platforms[cd.platform].emoji} ${this.platforms[cd.platform].name}: ${this.formatTimeLeft(cd.timeLeft)}`)
                .join('\n');
            embed.addFields({ name: '⏰ En cooldown', value: cooldownText, inline: true });
        }

        if (cooldownInfo.canBump.length === 0 && cooldownInfo.onCooldown.length === 0) {
            embed.setDescription('Aucune plateforme configurée. Utilisez `/bump-config` pour configurer.');
        }

        return embed;
    }

    /**
     * Crée le menu de sélection des plateformes
     */
    createPlatformSelectMenu(availablePlatforms) {
        const options = availablePlatforms.map(platform => ({
            label: this.platforms[platform].name,
            value: platform,
            emoji: this.platforms[platform].emoji,
            description: `Cooldown: ${this.platforms[platform].cooldown / (1000 * 60 * 60)}h`
        }));

        return new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('bump_platform_select')
                    .setPlaceholder('Sélectionnez les plateformes à bump')
                    .setMinValues(1)
                    .setMaxValues(Math.min(options.length, 25))
                    .addOptions(options)
            );
    }

    /**
     * Crée les boutons d'action
     */
    createActionButtons(hasAvailablePlatforms) {
        const row = new ActionRowBuilder();

        if (hasAvailablePlatforms) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('bump_all')
                    .setLabel('Bump Tout')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🚀')
            );
        }

        row.addComponents(
            new ButtonBuilder()
                .setCustomId('bump_refresh')
                .setLabel('Actualiser')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔄'),
            new ButtonBuilder()
                .setCustomId('bump_config')
                .setLabel('Configuration')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⚙️')
        );

        return row;
    }
}

module.exports = BumpManager;