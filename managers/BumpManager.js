/**
 * BUMP MANAGER
 * Gestionnaire pour le système de bump multi-plateforme
 */

const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class BumpManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.platforms = {
            // Plateformes générales
            'topgg': {
                name: 'Top.gg',
                cooldown: 12 * 60 * 60 * 1000, // 12 heures
                emoji: '🔥',
                color: '#ff6b6b',
                category: 'general'
            },
            'discordbotlist': {
                name: 'Discord Bot List',
                cooldown: 24 * 60 * 60 * 1000, // 24 heures
                emoji: '⭐',
                color: '#4267B2',
                category: 'general'
            },
            'discordboats': {
                name: 'Discord Boats',
                cooldown: 12 * 60 * 60 * 1000, // 12 heures
                emoji: '🚢',
                color: '#36393f',
                category: 'general'
            },
            'discordbots': {
                name: 'Discord Bots',
                cooldown: 24 * 60 * 60 * 1000, // 24 heures
                emoji: '🤖',
                color: '#7289da',
                category: 'general'
            },
            'disboard': {
                name: 'Disboard',
                cooldown: 2 * 60 * 60 * 1000, // 2 heures
                emoji: '📢',
                color: '#2f3136',
                category: 'general'
            },
            // Plateformes NSFW
            'nsfwbot': {
                name: 'NSFW Bot List',
                cooldown: 24 * 60 * 60 * 1000, // 24 heures
                emoji: '🔞',
                color: '#e91e63',
                category: 'nsfw'
            },
            'adultdiscord': {
                name: 'Adult Discord Servers',
                cooldown: 12 * 60 * 60 * 1000, // 12 heures
                emoji: '💋',
                color: '#8e24aa',
                category: 'nsfw'
            },
            'nsfwlist': {
                name: 'NSFW Server List',
                cooldown: 6 * 60 * 60 * 1000, // 6 heures
                emoji: '🔥',
                color: '#d32f2f',
                category: 'nsfw'
            },
            'adultservers': {
                name: 'Adult Servers Hub',
                cooldown: 8 * 60 * 60 * 1000, // 8 heures
                emoji: '🌶️',
                color: '#ff5722',
                category: 'nsfw'
            }
        };
        
        // Planificateur pour bumps automatiques
        this.autoScheduler = new Map(); // guildId -> intervalId
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
            // Vérifier si MongoDB est disponible
            if (!this.dataManager.db) {
                console.log('⚠️ MongoDB non connecté - utilisation configuration par défaut');
                return this.getDefaultBumpConfig(guildId);
            }

            const config = await this.dataManager.db.collection('bumpConfigs').findOne({ guildId });
            if (!config) {
                // Configuration par défaut
                return this.getDefaultBumpConfig(guildId);
            }
            return config;
        } catch (error) {
            console.error('❌ Error getting bump config:', error);
            return this.getDefaultBumpConfig(guildId);
        }
    }

    /**
     * Retourne la configuration par défaut
     */
    getDefaultBumpConfig(guildId) {
        return {
            guildId,
            enabledPlatforms: [],
            enabledNSFWPlatforms: [],
            bumpChannelId: null,
            autoReminder: true,
            customMessage: null,
            autoBump: {
                enabled: false,
                interval: 24 * 60 * 60 * 1000, // 24 heures par défaut
                lastRun: null,
                platforms: 'all' // 'all', 'general', 'nsfw', ou array de plateformes
            }
        };
    }

    /**
     * Met à jour la configuration de bump pour un serveur
     */
    async updateBumpConfig(guildId, config) {
        try {
            if (!this.dataManager.db) {
                console.log('⚠️ MongoDB non connecté - impossible de sauvegarder la configuration');
                return false;
            }

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

            // Si MongoDB n'est pas connecté, considérer toutes les plateformes comme disponibles
            if (!this.dataManager.db) {
                console.log('⚠️ MongoDB non connecté - toutes les plateformes considérées disponibles');
                return { canBump: config.enabledPlatforms, onCooldown: [] };
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

    /**
     * Filtre les plateformes par catégorie
     */
    getPlatformsByCategory(category) {
        return Object.keys(this.platforms).filter(platform => 
            this.platforms[platform].category === category
        );
    }

    /**
     * Récupère toutes les plateformes activées (générales + NSFW si applicable)
     */
    getAllEnabledPlatforms(config, guildHasNSFWChannels = false) {
        let platforms = [...config.enabledPlatforms];
        
        if (guildHasNSFWChannels && config.enabledNSFWPlatforms) {
            platforms = platforms.concat(config.enabledNSFWPlatforms);
        }
        
        return platforms;
    }

    /**
     * Démarre le bump automatique pour un serveur
     */
    async startAutoBump(guildId, guild) {
        try {
            const config = await this.getBumpConfig(guildId);
            
            if (!config.autoBump.enabled) {
                return false;
            }

            // Arrêter l'ancien planificateur s'il existe
            this.stopAutoBump(guildId);

            const intervalId = setInterval(async () => {
                try {
                    await this.performAutoBump(guildId, guild);
                } catch (error) {
                    console.error(`❌ Erreur auto-bump pour ${guildId}:`, error);
                }
            }, config.autoBump.interval);

            this.autoScheduler.set(guildId, intervalId);
            console.log(`✅ Auto-bump démarré pour ${guild?.name || guildId} (interval: ${config.autoBump.interval / (1000 * 60 * 60)}h)`);
            return true;

        } catch (error) {
            console.error('❌ Erreur démarrage auto-bump:', error);
            return false;
        }
    }

    /**
     * Arrête le bump automatique pour un serveur
     */
    stopAutoBump(guildId) {
        const intervalId = this.autoScheduler.get(guildId);
        if (intervalId) {
            clearInterval(intervalId);
            this.autoScheduler.delete(guildId);
            console.log(`🛑 Auto-bump arrêté pour ${guildId}`);
            return true;
        }
        return false;
    }

    /**
     * Effectue un bump automatique
     */
    async performAutoBump(guildId, guild) {
        try {
            const config = await this.getBumpConfig(guildId);
            
            if (!config.autoBump.enabled) {
                this.stopAutoBump(guildId);
                return;
            }

            // Déterminer les plateformes à bump
            let platformsToBump = [];
            const hasNSFWChannels = guild?.channels?.cache?.some(channel => channel.nsfw) || false;
            
            if (config.autoBump.platforms === 'all') {
                platformsToBump = this.getAllEnabledPlatforms(config, hasNSFWChannels);
            } else if (config.autoBump.platforms === 'general') {
                platformsToBump = config.enabledPlatforms;
            } else if (config.autoBump.platforms === 'nsfw') {
                platformsToBump = hasNSFWChannels ? config.enabledNSFWPlatforms : [];
            } else if (Array.isArray(config.autoBump.platforms)) {
                platformsToBump = config.autoBump.platforms;
            }

            if (platformsToBump.length === 0) {
                return;
            }

            // Vérifier les cooldowns
            const cooldownInfo = await this.checkCooldowns(guildId, 'AUTO_BUMP');
            const availablePlatforms = platformsToBump.filter(platform => 
                cooldownInfo.canBump.includes(platform)
            );

            if (availablePlatforms.length === 0) {
                console.log(`⏰ Auto-bump ${guildId}: Toutes les plateformes en cooldown`);
                return;
            }

            // Effectuer le bump
            const results = await this.performBump(guildId, 'AUTO_BUMP', availablePlatforms);
            const successCount = results.filter(r => r.success).length;

            // Mettre à jour la date du dernier bump auto
            config.autoBump.lastRun = Date.now();
            await this.updateBumpConfig(guildId, config);

            console.log(`🚀 Auto-bump ${guild?.name || guildId}: ${successCount}/${availablePlatforms.length} plateformes bumpées`);

            // Envoyer notification dans le canal configuré si disponible
            if (config.bumpChannelId && guild) {
                await this.sendAutoBumpNotification(guild, config.bumpChannelId, results);
            }

        } catch (error) {
            console.error(`❌ Erreur lors du bump automatique pour ${guildId}:`, error);
        }
    }

    /**
     * Envoie une notification de bump automatique
     */
    async sendAutoBumpNotification(guild, channelId, results) {
        try {
            const channel = guild.channels.cache.get(channelId);
            if (!channel) return;

            const successPlatforms = results.filter(r => r.success);
            const failedPlatforms = results.filter(r => !r.success);

            const embed = new EmbedBuilder()
                .setTitle('🤖 Bump Automatique Effectué')
                .setColor(failedPlatforms.length === 0 ? '#00ff00' : '#ffcc00')
                .setTimestamp()
                .setFooter({ text: 'Bump automatique' });

            if (successPlatforms.length > 0) {
                const successText = successPlatforms
                    .map(r => `${this.platforms[r.platform].emoji} ${this.platforms[r.platform].name}`)
                    .join('\n');
                embed.addFields({ name: '✅ Succès', value: successText, inline: true });
            }

            if (failedPlatforms.length > 0) {
                const failedText = failedPlatforms
                    .map(r => `${this.platforms[r.platform].emoji} ${this.platforms[r.platform].name}`)
                    .join('\n');
                embed.addFields({ name: '❌ Échecs', value: failedText, inline: true });
            }

            await channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Erreur envoi notification auto-bump:', error);
        }
    }

    /**
     * Initialise les auto-bumps pour tous les serveurs au démarrage
     */
    async initializeAllAutoBumps(client) {
        try {
            if (!this.dataManager.db) {
                console.log('❌ Database not connected for auto-bump initialization');
                return;
            }

            const configs = await this.dataManager.db.collection('bumpConfigs').find({
                'autoBump.enabled': true
            }).toArray();

            for (const config of configs) {
                const guild = client.guilds.cache.get(config.guildId);
                if (guild) {
                    await this.startAutoBump(config.guildId, guild);
                }
            }

            console.log(`✅ ${configs.length} auto-bumps initialisés`);

        } catch (error) {
            console.error('❌ Erreur initialisation auto-bumps:', error);
        }
    }
}

module.exports = BumpManager;