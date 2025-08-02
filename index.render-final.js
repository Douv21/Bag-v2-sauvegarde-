const { Client, Collection, GatewayIntentBits, Routes, REST, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const deploymentManager = require('./utils/deploymentManager');
const mongoBackup = require('./utils/mongoBackupManager');
const levelManager = require('./utils/levelManager');

// Handlers pour les nouvelles fonctionnalités karma
async function handleKarmaResetComplete(interaction) {
    try {
        const guildId = interaction.guild.id;
        const dataManager = require('./utils/simpleDataManager');

        // Reset karma complet (bon et mauvais)
        const economyData = dataManager.loadData('economy.json', {});
        let resetCount = 0;

        Object.keys(economyData).forEach(key => {
            if (key.includes('_') && key.includes(guildId)) {
                if (economyData[key].goodKarma !== undefined || economyData[key].badKarma !== undefined) {
                    economyData[key].goodKarma = 0;
                    economyData[key].badKarma = 0;
                    resetCount++;
                }
            }
        });

        dataManager.saveData('economy.json', economyData);

        await interaction.update({
            content: `✅ **Reset karma complet terminé !**\n\n🧹 ${resetCount} membre(s) affecté(s)\n⚖️ Karma bon et mauvais remis à zéro`,
            embeds: [],
            components: []
        });
    } catch (error) {
        console.error('Erreur reset karma complet:', error);
        await interaction.update({
            content: '❌ Erreur lors du reset karma complet.',
            embeds: [],
            components: []
        });
    }
}

async function handleKarmaResetGood(interaction) {
    try {
        const guildId = interaction.guild.id;
        const dataManager = require('./utils/simpleDataManager');

        // Reset karma positif uniquement
        const economyData = dataManager.loadData('economy.json', {});
        let resetCount = 0;

        Object.keys(economyData).forEach(key => {
            if (key.includes('_') && key.includes(guildId)) {
                if (economyData[key].goodKarma !== undefined && economyData[key].goodKarma > 0) {
                    economyData[key].goodKarma = 0;
                    resetCount++;
                }
            }
        });

        dataManager.saveData('economy.json', economyData);

        await interaction.update({
            content: `✅ **Reset karma positif terminé !**\n\n😇 ${resetCount} membre(s) affecté(s)\n⚖️ Karma positif remis à zéro\n🔒 Karma négatif préservé`,
            embeds: [],
            components: []
        });
    } catch (error) {
        console.error('Erreur reset karma bon:', error);
        await interaction.update({
            content: '❌ Erreur lors du reset karma positif.',
            embeds: [],
            components: []
        });
    }
}

async function handleKarmaResetBad(interaction) {
    try {
        const guildId = interaction.guild.id;
        const dataManager = require('./utils/simpleDataManager');

        // Reset karma négatif uniquement
        const economyData = dataManager.loadData('economy.json', {});
        let resetCount = 0;

        Object.keys(economyData).forEach(key => {
            if (key.includes('_') && key.includes(guildId)) {
                if (economyData[key].badKarma !== undefined && economyData[key].badKarma < 0) {
                    economyData[key].badKarma = 0;
                    resetCount++;
                }
            }
        });

        dataManager.saveData('economy.json', economyData);

        await interaction.update({
            content: `✅ **Reset karma négatif terminé !**\n\n😈 ${resetCount} membre(s) affecté(s)\n⚖️ Karma négatif remis à zéro\n🔒 Karma positif préservé`,
            embeds: [],
            components: []
        });
    } catch (error) {
        console.error('Erreur reset karma mauvais:', error);
        await interaction.update({
            content: '❌ Erreur lors du reset karma négatif.',
            embeds: [],
            components: []
        });
    }
}

async function handleKarmaWeeklyDaySelection(interaction, dayValue) {
    try {
        const dataManager = require('./utils/simpleDataManager');
        const guildId = interaction.guild.id;

        const dayNames = {
            '0': 'Dimanche',
            '1': 'Lundi',
            '2': 'Mardi',
            '3': 'Mercredi',
            '4': 'Jeudi',
            '5': 'Vendredi',
            '6': 'Samedi',
            'disable': 'Désactivé'
        };

        if (dayValue === 'disable') {
            // Désactiver le reset automatique
            const karmaConfig = dataManager.loadData('karma_config.json', {});
            karmaConfig.weeklyReset = { enabled: false };
            dataManager.saveData('karma_config.json', karmaConfig);

            await interaction.update({
                content: `✅ **Reset hebdomadaire désactivé**\n\n❌ Aucun reset automatique\n⚙️ Le karma ne sera plus remis à zéro automatiquement`,
                embeds: [],
                components: []
            });
        } else {
            // Configurer jour de reset
            const dayNum = parseInt(dayValue);
            const karmaConfig = dataManager.loadData('karma_config.json', {});
            karmaConfig.weeklyReset = {
                enabled: true,
                dayOfWeek: dayNum,
                lastReset: null
            };
            dataManager.saveData('karma_config.json', karmaConfig);

            await interaction.update({
                content: `✅ **Jour de reset configuré !**\n\n📅 Jour: **${dayNames[dayValue]}**\n⏰ Heure: **00:00 (minuit)**\n🎁 Les récompenses seront distribuées avant le reset\n🔄 Reset automatique du karma chaque semaine`,
                embeds: [],
                components: []
            });
        }
    } catch (error) {
        console.error('Erreur sélection jour reset:', error);
        await interaction.update({
            content: '❌ Erreur lors de la configuration du jour de reset.',
            embeds: [],
            components: []
        });
    }
}

class RenderSolutionBot {
    constructor() {
        this.initializeWebServer();
    }

    async initializeWebServer() {
        // 1. Serveur web d'abord (port 5000 pour Render.com)
        const app = express();
        const PORT = process.env.PORT || 5000;

        app.use(express.json());

        app.get('/', (req, res) => {
            res.json({
                status: 'running',
                version: '3.0',
                deployment: 'render.com',
                message: 'BAG v2 Discord Bot - Serveur Web Actif'
            });
        });

        app.get('/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        });

        app.get('/commands-status', async (req, res) => {
            try {
                const commandsDir = path.join(__dirname, 'commands');
                const commandFiles = await fs.readdir(commandsDir);
                const commands = commandFiles.filter(file => file.endsWith('.js')).map(file => file.replace('.js', ''));

                res.json({
                    status: 'success',
                    commands: commands,
                    count: commands.length
                });
            } catch (error) {
                res.json({ status: 'error', message: error.message });
            }
        });

        // Endpoint status système de sauvegarde
        app.get('/backup-status', async (req, res) => {
            try {
                const status = await deploymentManager.getSystemStatus();
                const integrity = await mongoBackup.verifyBackupIntegrity();

                res.json({
                    deployment: status,
                    backup: {
                        mongoConnected: status.mongoConnected,
                        integrityCheck: integrity
                    },
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.json({ status: 'error', message: error.message });
            }
        });

        // Endpoint sauvegarde manuelle
        app.post('/force-backup', async (req, res) => {
            try {
                const success = await deploymentManager.emergencyBackup();
                res.json({
                    success: success,
                    message: success ? 'Sauvegarde réussie' : 'Échec de la sauvegarde',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.json({ status: 'error', message: error.message });
            }
        });

        // Démarrer le serveur web AVANT Discord
        app.listen(PORT, '0.0.0.0', () => {
            console.log('🌐 Serveur Web actif sur port', PORT);
            console.log('📊 Status: http://localhost:5000/commands-status');
            console.log('✅ Port 5000 ouvert pour Render.com');

            // 2. Initialiser Discord après le serveur web
            setTimeout(() => this.initializeSystemsAndDiscord(), 1000);
        });
    }

    async initializeSystemsAndDiscord() {
        // 1. Initialiser le système de sauvegarde et restauration
        console.log('🛡️ Initialisation du système de sauvegarde MongoDB...');
        try {
            const isNewDeployment = await deploymentManager.initializeDeployment();
            if (isNewDeployment) {
                console.log('📥 Premier déploiement - données restaurées depuis MongoDB');
            } else {
                console.log('🔄 Redémarrage - données vérifiées');
            }
        } catch (error) {
            console.error('⚠️ Erreur système de sauvegarde:', error.message);
            console.log('📁 Continuation avec fichiers locaux uniquement');
        }

        // 2. Initialiser Discord
        await this.initializeDiscord();
    }

    async initializeDiscord() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates
            ]
        });

        this.commands = new Collection();
        await this.loadCommands();
        await this.setupEventHandlers();

        try {
            await this.client.login(process.env.DISCORD_TOKEN);
        } catch (error) {
            console.error('❌ Erreur connexion Discord:', error);
            process.exit(1);
        }
    }

    async loadCommands() {
        try {
            console.log('📂 Chargement des commandes...');
            const commandsPath = path.join(__dirname, 'commands');
            const commandFiles = await fs.readdir(commandsPath);

            for (const file of commandFiles.filter(file => file.endsWith('.js'))) {
                try {
                    const filePath = path.join(commandsPath, file);
                    delete require.cache[require.resolve(filePath)];
                    const command = require(filePath);

                    if ('data' in command && 'execute' in command) {
                        this.commands.set(command.data.name, command);
                        console.log(`✅ ${command.data.name}`);
                    } else {
                        console.log(`❌ ${file} manque data ou execute`);
                    }
                } catch (error) {
                    console.error(`❌ Erreur ${file}:`, error.message);
                }
            }

            console.log(`✅ ${this.commands.size} commandes chargées`);
        } catch (error) {
            console.error('❌ Erreur chargement commandes:', error);
        }
    }

    async setupEventHandlers() {
        this.client.once('ready', async () => {
            console.log(`✅ ${this.client.user.tag} connecté`);
            console.log(`🏰 ${this.client.guilds.cache.size} serveur(s)`);
            console.log(`📋 Commandes disponibles: ${this.commands.size}`);

            this.commands.forEach(command => {
                console.log(`  - ${command.data.name}`);
            });

            await this.deployCommands();
        });

        this.client.on('interactionCreate', async interaction => {
            try {
                // Traitement spécial pour les modals d'actions économiques AVANT handleInteraction
                if (interaction.isModalSubmit()) {
                    const customId = interaction.customId;
                    console.log(`🎯 Modal submit détecté: ${customId}`);

                    if (customId.includes('_amounts_modal_') || customId.includes('_cooldown_modal_') || customId.includes('_karma_modal_')) {
                        console.log('🎯 Modal action économique → handleActionModal');
                        const dataManager = require('./utils/simpleDataManager'); // AJOUT: dataManager requis ici
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const handler = new EconomyConfigHandler(dataManager);
                        await handler.handleActionModal(interaction);
                        return; // IMPORTANT: arrêter ici pour éviter le double traitement
                    }
                }

                await this.handleInteraction(interaction);
            } catch (error) {
                console.error('❌ Erreur interactionCreate:', error);
            }
        });

        this.client.on('messageCreate', async message => {
            if (message.author.bot) return;

            try {
                // TOUJOURS incrémenter le compteur de messages d'abord
                await this.incrementMessageCount(message);

                const countingHandled = await this.handleCounting(message);

                if (!countingHandled) {
                    await this.handleMessageReward(message);
                }

                // Ajouter de l'XP pour les messages
                await this.handleLevelXP(message);

                await this.handleAutoThread(message);

            } catch (error) {
                console.error('❌ Erreur messageCreate:', error);
            }
        });

        this.client.on('voiceStateUpdate', async (oldState, newState) => {
            await this.handleVoiceXP(oldState, newState);
        });

        this.client.on('error', error => {
            console.error('❌ Erreur Discord:', error);
        });
    }

    async deployCommands() {
        try {
            for (const guild of this.client.guilds.cache.values()) {
                console.log(`🎯 Serveur: ${guild.name} (${guild.id})`);
                console.log(`🔄 Enregistrement serveur spécifique: ${guild.id}...`);

                const commands = Array.from(this.commands.values()).map(command => command.data.toJSON());
                console.log(`📝 Préparation de ${commands.length} commandes pour enregistrement`);

                commands.forEach(cmd => {
                    console.log(`   • ${cmd.name} (${cmd.description})`);
                });

                const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

                await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
                    { body: commands }
                );

                console.log(`✅ ${commands.length} commandes enregistrées sur serveur ${guild.id}`);
            }
        } catch (error) {
            console.error('❌ Erreur déploiement commandes:', error);
        }
    }

    async handleInteraction(interaction) {
        // Initialiser dataManager au début pour toutes les sections
        const dataManager = require('./utils/simpleDataManager');

        try {
            const MainRouterHandler = require('./handlers/MainRouterHandler');
            const router = new MainRouterHandler(dataManager);

            if (interaction.isChatInputCommand()) {
                const command = this.commands.get(interaction.commandName);
                if (!command) {
                    console.error(`❌ Commande non trouvée: ${interaction.commandName}`);
                    return;
                }

                console.log(`🔧 /${interaction.commandName} par ${interaction.user.tag}`);
                await command.execute(interaction, dataManager);
            }
            else if (interaction.isModalSubmit()) {
                console.log(`📝 Modal: ${interaction.customId}`);

                try {
                    // === MODALS ÉCONOMIQUES NOUVEAUX ===
                    if (interaction.customId.startsWith('action_config_modal_')) {
                        console.log('🎯 Modal configuration action:', interaction.customId);
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleActionConfigModal(interaction);
                        return;
                    }

                    if (interaction.customId === 'objet_perso_modal') {
                        console.log('🎯 Modal objet personnalisé');
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleObjetPersoModal(interaction);
                        return;
                    }

                    // Modals Daily
                    if (interaction.customId === 'daily_amount_modal') {
                        console.log('🎯 Modal daily amount');
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleDailyAmountModal(interaction);
                        return;
                    }

                    if (interaction.customId === 'daily_streak_modal') {
                        console.log('🎯 Modal daily streak');
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleDailyStreakModal(interaction);
                        return;
                    }

                    // Modals Messages
                    if (interaction.customId === 'message_amount_modal') {
                        console.log('🎯 Modal message amount');
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleMessageAmountModal(interaction);
                        return;
                    }

                    if (interaction.customId === 'message_cooldown_modal') {
                        console.log('🎯 Modal message cooldown');
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleMessageCooldownModal(interaction);
                        return;
                    }

                    // Modals Karma
                    if (interaction.customId === 'karma_levels_modal') {
                        console.log('🎯 Modal karma levels');
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleKarmaLevelsModal(interaction);
                        return;
                    }

                    if (interaction.customId === 'remise_karma_modal') {
                        console.log('🎯 Modal remise karma');
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleRemiseModal(interaction);
                        return;
                    }

                    if (interaction.customId.startsWith('role_config_modal_')) {
                        console.log('🎯 Modal config rôle:', interaction.customId);
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.handleRoleConfigModal(interaction);
                        return;
                    }

                    // Gestion des modals de configuration level
                    if (interaction.customId === 'text_xp_modal') {
                        const LevelConfigHandler = require('./handlers/LevelConfigHandler');
                        const levelHandler = new LevelConfigHandler();
                        await levelHandler.handleTextXPModal(interaction);
                        return;
                    }

                    if (interaction.customId === 'voice_xp_modal') {
                        const LevelConfigHandler = require('./handlers/LevelConfigHandler');
                        const levelHandler = new LevelConfigHandler();
                        await levelHandler.handleVoiceXPModal(interaction);
                        return;
                    }

                    // Gestion des nouveaux modals de configuration niveau
                    if (interaction.customId === 'add_role_reward_modal' ||
                        interaction.customId === 'base_xp_modal' ||
                        interaction.customId === 'multiplier_modal' ||
                        interaction.customId.startsWith('level_for_role_')) {

                        console.log('🎯 Modal niveau:', interaction.customId);
                        const levelManager = require('./utils/levelManager');

                        if (interaction.customId === 'add_role_reward_modal') {
                            const level = parseInt(interaction.fields.getTextInputValue('level'));
                            const roleId = interaction.fields.getTextInputValue('role_id');

                            if (isNaN(level) || level < 1) {
                                await interaction.reply({
                                    content: '❌ Le niveau doit être un nombre entier positif.',
                                    flags: 64
                                });
                                return;
                            }

                            const config = levelManager.loadConfig();
                            if (!config.roleRewards) config.roleRewards = {};
                            config.roleRewards[level] = roleId;
                            levelManager.saveConfig(config);

                            await interaction.reply({
                                content: `✅ Récompense ajoutée: Niveau ${level} → <@&${roleId}>`,
                                flags: 64
                            });

                        } else if (interaction.customId === 'base_xp_modal') {
                            const baseXP = parseInt(interaction.fields.getTextInputValue('base_xp'));

                            if (isNaN(baseXP) || baseXP < 1) {
                                await interaction.reply({
                                    content: '❌ L\'XP de base doit être un nombre entier positif.',
                                    flags: 64
                                });
                                return;
                            }

                            const config = levelManager.loadConfig();
                            config.levelFormula.baseXP = baseXP;
                            levelManager.saveConfig(config);

                            await interaction.reply({
                                content: `✅ XP de base défini à ${baseXP} XP.`,
                                flags: 64
                            });

                        } else if (interaction.customId === 'multiplier_modal') {
                            const multiplier = parseFloat(interaction.fields.getTextInputValue('multiplier'));

                            if (isNaN(multiplier) || multiplier <= 1) {
                                await interaction.reply({
                                    content: '❌ Le multiplicateur doit être un nombre supérieur à 1.',
                                    flags: 64
                                });
                                return;
                            }

                            const config = levelManager.loadConfig();
                            config.levelFormula.multiplier = multiplier;
                            levelManager.saveConfig(config);

                            await interaction.reply({
                                content: `✅ Multiplicateur défini à ${multiplier}.`,
                                flags: 64
                            });

                        } else if (interaction.customId.startsWith('level_for_role_')) {
                            // Modal pour définir le niveau requis pour un rôle
                            const roleId = interaction.customId.replace('level_for_role_', '');
                            const level = parseInt(interaction.fields.getTextInputValue('level_required'));

                            if (isNaN(level) || level < 1 || level > 999) {
                                await interaction.reply({
                                    content: '❌ Le niveau doit être un nombre entre 1 et 999.',
                                    flags: 64
                                });
                                return;
                            }

                            const config = levelManager.loadConfig();
                            if (!config.roleRewards) config.roleRewards = {};
                            config.roleRewards[level] = roleId;
                            levelManager.saveConfig(config);

                            await interaction.reply({
                                content: `✅ Récompense configurée: Niveau **${level}** → <@&${roleId}>`,
                                flags: 64
                            });
                        }

                        return;
                    }

                    // Handler pour les modals d'actions économiques
                    if (interaction.customId.startsWith('action_config_modal_')) {
                        console.log('🎯 Modal action config submission détecté:', interaction.customId);
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const handler = new EconomyConfigHandler(dataManager);
                        await handler.handleActionModal(interaction);
                        return;
                    }

                    // Gestion des autres modals d'économie
                    if (interaction.customId === 'economy_daily_amount_modal') {
                        const amount = parseInt(interaction.fields.getTextInputValue('daily_amount'));
                        if (amount >= 1 && amount <= 1000) {
                            const economyData = dataManager.loadData('economy') || {};
                            if (!economyData.daily) economyData.daily = {};
                            economyData.daily.amount = amount;
                            dataManager.saveData('economy', economyData);
                            await interaction.reply({ content: `✅ Montant daily configuré à ${amount}€`, flags: 64 });
                        } else {
                            await interaction.reply({ content: '❌ Montant invalide (1-1000€)', flags: 64 });
                        }
                        return;
                    }

                    if (interaction.customId === 'economy_messages_amount_modal') {
                        const amount = parseInt(interaction.fields.getTextInputValue('messages_amount'));
                        if (amount >= 1 && amount <= 50) {
                            const economyData = dataManager.loadData('economy') || {};
                            if (!economyData.messageRewards) economyData.messageRewards = {};
                            economyData.messageRewards.amount = amount;
                            dataManager.saveData('economy', economyData);
                            await interaction.reply({ content: `✅ Montant par message configuré à ${amount}€`, flags: 64 });
                        } else {
                            await interaction.reply({ content: '❌ Montant invalide (1-50€)', flags: 64 });
                        }
                        return;
                    }

                    if (interaction.customId === 'economy_messages_cooldown_modal') {
                        const cooldown = parseInt(interaction.fields.getTextInputValue('messages_cooldown'));
                        if (cooldown >= 30 && cooldown <= 300) {
                            const economyData = dataManager.loadData('economy') || {};
                            if (!economyData.messageRewards) economyData.messageRewards = {};
                            economyData.messageRewards.cooldown = cooldown;
                            dataManager.saveData('economy', economyData);
                            await interaction.reply({ content: `✅ Cooldown messages configuré à ${cooldown}s`, flags: 64 });
                        } else {
                            await interaction.reply({ content: '❌ Cooldown invalide (30-300s)', flags: 64 });
                        }
                        return;
                    }

                    if (interaction.customId === 'economy_daily_amount_modal') {
                        const amount = parseInt(interaction.fields.getTextInputValue('daily_amount'));
                        if (amount >= 1 && amount <= 1000) {
                            const economyData = dataManager.loadData('economy') || {};
                            if (!economyData.daily) economyData.daily = {};
                            economyData.daily.baseAmount = amount;
                            dataManager.saveData('economy', economyData);
                            await interaction.reply({ content: `✅ Montant daily configuré à ${amount}€`, flags: 64 });
                        } else {
                            await interaction.reply({ content: '❌ Montant invalide (1-1000€)', flags: 64 });
                        }
                        return;
                    }

                    if (interaction.customId === 'shop_karma_discount_modal') {
                        const name = interaction.fields.getTextInputValue('discount_name');
                        const karma = parseInt(interaction.fields.getTextInputValue('karma_required'));
                        const percent = parseInt(interaction.fields.getTextInputValue('percentage'));

                        // Validation
                        if (isNaN(karma) || karma < -999 || karma > 999) {
                            await interaction.reply({
                                content: '❌ Le karma requis doit être un nombre entre -999 et 999.',
                                flags: 64
                            });
                            return;
                        }

                        if (isNaN(percent) || percent < 1 || percent > 99) {
                            await interaction.reply({
                                content: '❌ Le pourcentage doit être un nombre entre 1 et 99.',
                                flags: 64
                            });
                            return;
                        }

                        // Sauvegarder dans karma_discounts.json
                        const guildId = interaction.guild.id;
                        const fs = require('fs');
                        const path = require('path');

                        const discountsPath = path.join(__dirname, 'data', 'karma_discounts.json');
                        let allDiscounts = {};

                        if (fs.existsSync(discountsPath)) {
                            allDiscounts = JSON.parse(fs.readFileSync(discountsPath, 'utf8'));
                        }

                        if (!allDiscounts[guildId]) allDiscounts[guildId] = [];

                        allDiscounts[guildId].push({
                            id: Date.now(),
                            name: name,
                            karmaRequired: karma,
                            percentage: percent,
                            createdAt: new Date().toISOString()
                        });

                        fs.writeFileSync(discountsPath, JSON.stringify(allDiscounts, null, 2));

                        await interaction.reply({
                            content: `✅ Remise **${name}** créée avec succès (${karma} karma → ${percent}% de remise).`,
                            flags: 64
                        });
                        return;
                    }

                    // Handler pour modal d'édition remise karma
                    if (interaction.customId.startsWith('edit_karma_discount_modal_')) {
                        const discountId = interaction.customId.replace('edit_karma_discount_modal_', '');
                        const name = interaction.fields.getTextInputValue('discount_name');
                        const karma = parseInt(interaction.fields.getTextInputValue('karma_required'));
                        const percent = parseInt(interaction.fields.getTextInputValue('percentage'));

                        // Validation
                        if (isNaN(karma) || karma < -999 || karma > 999) {
                            await interaction.reply({
                                content: '❌ Le karma requis doit être un nombre entre -999 et 999.',
                                flags: 64
                            });
                            return;
                        }

                        if (isNaN(percent) || percent < 1 || percent > 99) {
                            await interaction.reply({
                                content: '❌ Le pourcentage doit être un nombre entre 1 et 99.',
                                flags: 64
                            });
                            return;
                        }

                        // Modifier dans karma_discounts.json
                        const guildId = interaction.guild.id;
                        const fs = require('fs');
                        const path = require('path');

                        const discountsPath = path.join(__dirname, 'data', 'karma_discounts.json');
                        let allDiscounts = {};

                        if (fs.existsSync(discountsPath)) {
                            allDiscounts = JSON.parse(fs.readFileSync(discountsPath, 'utf8'));
                        }

                        if (allDiscounts[guildId]) {
                            const discountIndex = allDiscounts[guildId].findIndex(d => d.id.toString() === discountId);
                            if (discountIndex !== -1) {
                                allDiscounts[guildId][discountIndex] = {
                                    ...allDiscounts[guildId][discountIndex],
                                    name: name,
                                    karmaRequired: karma,
                                    percentage: percent,
                                    updatedAt: new Date().toISOString()
                                };

                                fs.writeFileSync(discountsPath, JSON.stringify(allDiscounts, null, 2));

                                await interaction.reply({
                                    content: `✅ Remise **${name}** modifiée avec succès (${karma} karma → ${percent}% de remise).`,
                                    flags: 64
                                });
                            } else {
                                await interaction.reply({
                                    content: '❌ Remise introuvable.',
                                    flags: 64
                                });
                            }
                        } else {
                            await interaction.reply({
                                content: '❌ Aucune remise configurée.',
                                flags: 64
                            });
                        }
                        return;
                    }

                    // Handlers pour modals boutique
                    if (interaction.customId === 'create_custom_object_modal') {
                        const name = interaction.fields.getTextInputValue('object_name');
                        const price = parseInt(interaction.fields.getTextInputValue('object_price'));
                        const description = interaction.fields.getTextInputValue('object_description') || 'Objet personnalisé';

                        if (isNaN(price) || price < 1 || price > 999999) {
                            await interaction.reply({
                                content: '❌ Le prix doit être un nombre entre 1 et 999999.',
                                flags: 64
                            });
                            return;
                        }

                        // Sauvegarder dans shop.json
                        const guildId = interaction.guild.id;
                        const fs = require('fs');
                        const path = require('path');
                        const shopPath = path.join(__dirname, 'data', 'shop.json');

                        let shopData = {};
                        try {
                            if (fs.existsSync(shopPath)) {
                                shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
                            }
                        } catch (error) {
                            shopData = {};
                        }

                        if (!shopData[guildId]) shopData[guildId] = [];

                        shopData[guildId].push({
                            id: Date.now(),
                            name: name,
                            price: price,
                            description: description,
                            type: 'custom',
                            createdAt: new Date().toISOString()
                        });

                        const dataDir = path.dirname(shopPath);
                        if (!fs.existsSync(dataDir)) {
                            fs.mkdirSync(dataDir, { recursive: true });
                        }

                        fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));

                        await interaction.reply({
                            content: `✅ Objet **${name}** créé avec succès (${price}€).`,
                            flags: 64
                        });
                        return;
                    }

                    if (interaction.customId === 'create_temp_role_modal') {
                        const roleId = interaction.fields.getTextInputValue('role_id');
                        const price = parseInt(interaction.fields.getTextInputValue('role_price'));
                        const duration = parseInt(interaction.fields.getTextInputValue('role_duration'));

                        if (isNaN(price) || price < 1 || price > 999999) {
                            await interaction.reply({
                                content: '❌ Le prix doit être un nombre entre 1 et 999999.',
                                flags: 64
                            });
                            return;
                        }

                        if (isNaN(duration) || duration < 1 || duration > 365) {
                            await interaction.reply({
                                content: '❌ La durée doit être un nombre entre 1 et 365 jours.',
                                flags: 64
                            });
                            return;
                        }

                        // Vérifier que le rôle existe
                        const role = interaction.guild.roles.cache.get(roleId);
                        if (!role) {
                            await interaction.reply({
                                content: '❌ Rôle introuvable. Vérifiez l\'ID du rôle.',
                                flags: 64
                            });
                            return;
                        }

                        // Sauvegarder dans shop.json
                        const guildId = interaction.guild.id;
                        const fs = require('fs');
                        const path = require('path');
                        const shopPath = path.join(__dirname, 'data', 'shop.json');

                        let shopData = {};
                        try {
                            if (fs.existsSync(shopPath)) {
                                shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
                            }
                        } catch (error) {
                            shopData = {};
                        }

                        if (!shopData[guildId]) shopData[guildId] = [];

                        shopData[guildId].push({
                            id: Date.now(),
                            name: role.name,
                            price: price,
                            description: `Rôle temporaire ${role.name} pour ${duration} jours`,
                            type: 'temp_role',
                            roleId: roleId,
                            duration: duration,
                            createdAt: new Date().toISOString()
                        });

                        const dataDir = path.dirname(shopPath);
                        if (!fs.existsSync(dataDir)) {
                            fs.mkdirSync(dataDir, { recursive: true });
                        }

                        fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));

                        await interaction.reply({
                            content: `✅ Rôle temporaire **${role.name}** ajouté (${price}€, ${duration} jours).`,
                            flags: 64
                        });
                        return;
                    }

                    if (interaction.customId === 'create_perm_role_modal') {
                        const roleId = interaction.fields.getTextInputValue('role_id');
                        const price = parseInt(interaction.fields.getTextInputValue('role_price'));

                        if (isNaN(price) || price < 1 || price > 999999) {
                            await interaction.reply({
                                content: '❌ Le prix doit être un nombre entre 1 et 999999.',
                                flags: 64
                            });
                            return;
                        }

                        // Vérifier que le rôle existe
                        const role = interaction.guild.roles.cache.get(roleId);
                        if (!role) {
                            await interaction.reply({
                                content: '❌ Rôle introuvable. Vérifiez l\'ID du rôle.',
                                flags: 64
                            });
                            return;
                        }

                        // Sauvegarder dans shop.json
                        const guildId = interaction.guild.id;
                        const fs = require('fs');
                        const path = require('path');
                        const shopPath = path.join(__dirname, 'data', 'shop.json');

                        let shopData = {};
                        try {
                            if (fs.existsSync(shopPath)) {
                                shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
                            }
                        } catch (error) {
                            shopData = {};
                        }

                        if (!shopData[guildId]) shopData[guildId] = [];

                        shopData[guildId].push({
                            id: Date.now(),
                            name: role.name,
                            price: price,
                            description: `Rôle permanent ${role.name}`,
                            type: 'perm_role',
                            roleId: roleId,
                            createdAt: new Date().toISOString()
                        });

                        const dataDir = path.dirname(shopPath);
                        if (!fs.existsSync(dataDir)) {
                            fs.mkdirSync(dataDir, { recursive: true });
                        }

                        fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));

                        await interaction.reply({
                            content: `✅ Rôle permanent **${role.name}** ajouté (${price}€).`,
                            flags: 64
                        });
                        return;
                    }

                    // Handler pour modal création niveau karma
                    if (interaction.customId === 'create_karma_level_modal') {
                        const name = interaction.fields.getTextInputValue('level_name');
                        const karmaNet = parseInt(interaction.fields.getTextInputValue('karma_net'));
                        const reward = parseInt(interaction.fields.getTextInputValue('reward_amount'));

                        // Validation
                        if (isNaN(karmaNet) || karmaNet < -999 || karmaNet > 999) {
                            await interaction.reply({
                                content: '❌ Le karma net doit être un nombre entre -999 et 999.',
                                flags: 64
                            });
                            return;
                        }

                        if (isNaN(reward) || reward < -999999 || reward > 999999) {
                            await interaction.reply({
                                content: '❌ La récompense doit être un nombre entre -999999 et 999999.',
                                flags: 64
                            });
                            return;
                        }

                        // Sauvegarder dans economy.json
                        const economyData = dataManager.loadData('economy') || {};
                        if (!economyData.karmaLevels) economyData.karmaLevels = [];

                        economyData.karmaLevels.push({
                            id: Date.now(),
                            name: name,
                            karmaNet: karmaNet,
                            reward: reward,
                            createdAt: new Date().toISOString()
                        });

                        dataManager.saveData('economy', economyData);

                        await interaction.reply({
                            content: `✅ Niveau karma **${name}** créé avec succès (${karmaNet} karma net → ${reward}€).`,
                            flags: 64
                        });
                        return;
                    }

                    if (interaction.customId.startsWith('edit_item_modal_')) {
                        const itemId = interaction.customId.replace('edit_item_modal_', '');
                        const fs = require('fs');
                        const path = require('path');

                        try {
                            const shopPath = path.join(__dirname, 'data', 'shop.json');
                            let shop = {};
                            if (fs.existsSync(shopPath)) {
                                shop = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
                            }

                            const guildId = interaction.guild.id;
                            const items = shop[guildId] || [];
                            const itemIndex = items.findIndex(i => i.id === itemId);
                            const item = items[itemIndex];

                            if (item) {
                                const price = parseInt(interaction.fields.getTextInputValue('item_price'));

                                if (price >= 1 && price <= 999999) {
                                    item.price = price;

                                    if (item.type === 'custom') {
                                        item.name = interaction.fields.getTextInputValue('item_name');
                                        item.description = interaction.fields.getTextInputValue('item_description') || '';
                                    } else if (item.type === 'temp_role') {
                                        const duration = parseInt(interaction.fields.getTextInputValue('item_duration'));
                                        if (duration >= 1 && duration <= 365) {
                                            item.duration = duration;
                                        }
                                    }

                                    items[itemIndex] = item;
                                    shop[guildId] = items;
                                    fs.writeFileSync(shopPath, JSON.stringify(shop, null, 2));

                                    await interaction.reply({
                                        content: `✅ **Article modifié !**\n\n✏️ **${item.name}**\n💰 Nouveau prix: ${price}€`,
                                        flags: 64
                                    });
                                } else {
                                    await interaction.reply({ content: '❌ Prix invalide (1-999,999€)', flags: 64 });
                                }
                            } else {
                                await interaction.reply({ content: '❌ Article non trouvé', flags: 64 });
                            }
                        } catch (error) {
                            console.error('Erreur modification article:', error);
                            await interaction.reply({ content: '❌ Erreur lors de la modification', flags: 64 });
                        }
                        return;
                    }


                    if (interaction.customId === 'temp_role_price_modal') {
                        const price = parseInt(interaction.fields.getTextInputValue('role_price'));
                        const duration = parseInt(interaction.fields.getTextInputValue('role_duration'));
                        const roleId = interaction.fields.getTextInputValue('role_id');

                        if (price >= 1 && price <= 999999 && duration >= 1 && duration <= 365) {
                            const fs = require('fs');
                            const path = require('path');

                            const dataDir = path.join(__dirname, 'data');
                            if (!fs.existsSync(dataDir)) {
                                fs.mkdirSync(dataDir, { recursive: true });
                            }

                            const shopPath = path.join(dataDir, 'shop.json');
                            let shopData = {};
                            try {
                                if (fs.existsSync(shopPath)) {
                                    shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
                                }
                            } catch (error) {
                                shopData = {};
                            }

                            const guildId = interaction.guild.id;
                            if (!shopData[guildId]) shopData[guildId] = [];

                            const role = interaction.guild.roles.cache.get(roleId);
                            const newItem = {
                                id: Date.now().toString(),
                                name: `Rôle: ${role?.name || 'Rôle'}`,
                                price: price,
                                duration: duration,
                                roleId: roleId,
                                type: 'temp_role',
                                createdAt: new Date().toISOString(),
                                createdBy: interaction.user.id
                            };

                            shopData[guildId].push(newItem);
                            fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));

                            await interaction.reply({
                                content: `✅ **Rôle temporaire ajouté !**\n\n⏰ **${role?.name}**\n💰 Prix: ${price}€\n📅 Durée: ${duration} jour(s)`,
                                flags: 64
                            });
                        } else {
                            await interaction.reply({ content: '❌ Valeurs invalides (prix: 1-999,999€, durée: 1-365 jours)', flags: 64 });
                        }
                        return;
                    }

                    if (interaction.customId === 'perm_role_price_modal') {
                        const price = parseInt(interaction.fields.getTextInputValue('role_price'));
                        const roleId = interaction.fields.getTextInputValue('role_id');

                        if (price >= 1 && price <= 999999) {
                            const fs = require('fs');
                            const path = require('path');

                            const dataDir = path.join(__dirname, 'data');
                            if (!fs.existsSync(dataDir)) {
                                fs.mkdirSync(dataDir, { recursive: true });
                            }

                            const shopPath = path.join(dataDir, 'shop.json');
                            let shopData = {};
                            try {
                                if (fs.existsSync(shopPath)) {
                                    shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
                                }
                            } catch (error) {
                                shopData = {};
                            }

                            const guildId = interaction.guild.id;
                            if (!shopData[guildId]) shopData[guildId] = [];

                            const role = interaction.guild.roles.cache.get(roleId);
                            const newItem = {
                                id: Date.now().toString(),
                                name: `Rôle: ${role?.name || 'Rôle'}`,
                                price: price,
                                roleId: roleId,
                                type: 'perm_role',
                                createdAt: new Date().toISOString(),
                                createdBy: interaction.user.id
                            };

                            shopData[guildId].push(newItem);
                            fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));

                            await interaction.reply({
                                content: `✅ **Rôle permanent ajouté !**\n\n⭐ **${role?.name}**\n💰 Prix: ${price}€\n🔒 Permanent`,
                                flags: 64
                            });
                        } else {
                            await interaction.reply({ content: '❌ Prix invalide (1-999,999€)', flags: 64 });
                        }
                        return;
                    }

                    // Modal pour créer un objet personnalisé
                    if (interaction.customId === 'shop_custom_object_modal') {
                        const name = interaction.fields.getTextInputValue('object_name');
                        const price = parseInt(interaction.fields.getTextInputValue('object_price'));
                        const description = interaction.fields.getTextInputValue('object_description') || 'Objet unique';

                        if (price >= 1 && price <= 999999) {
                            const fs = require('fs');
                            const path = require('path');

                            // Assurer que le dossier data existe
                            const dataDir = path.join(__dirname, 'data');
                            if (!fs.existsSync(dataDir)) {
                                fs.mkdirSync(dataDir, { recursive: true });
                            }

                            const shopPath = path.join(dataDir, 'shop.json');
                            let shopData = {};
                            try {
                                if (fs.existsSync(shopPath)) {
                                    shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
                                }
                            } catch (error) {
                                console.log('Erreur lecture shop.json:', error);
                                shopData = {};
                            }

                            const guildId = interaction.guild.id;
                            if (!shopData[guildId]) shopData[guildId] = [];

                            const newItem = {
                                id: Date.now().toString(),
                                name: name,
                                price: price,
                                description: description,
                                type: 'custom',
                                createdAt: new Date().toISOString(),
                                createdBy: interaction.user.id
                            };

                            shopData[guildId].push(newItem);
                            fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));

                            await interaction.reply({
                                content: `✅ **Objet créé avec succès !**\n\n🎨 **${name}** - ${price}€\n📝 ${description}`,
                                flags: 64
                            });
                        } else {
                            await interaction.reply({ content: '❌ Prix invalide (1-999,999€)', flags: 64 });
                        }
                        return;
                    }

                    // Autres modals...
                    const MainRouterHandler = require('./handlers/MainRouterHandler');
                    const router = new MainRouterHandler(dataManager);

                    const handled = await router.handleInteraction(interaction);

                    if (!handled && !interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Cette modal n\'est pas encore implémentée.',
                            flags: 64
                        });
                    }

                } catch (error) {
                    console.error(`❌ Erreur modal ${interaction.customId}:`, error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Erreur lors du traitement du formulaire.',
                            flags: 64
                        });
                    }
                }
            }

            else if (interaction.isStringSelectMenu() || interaction.isUserSelectMenu() || interaction.isChannelSelectMenu() || interaction.isRoleSelectMenu() || interaction.isButton()) {
                const customId = interaction.customId;
                console.log(`🔄 MainRouter traite: ${customId}`);



                // Routage level config menu - priorité haute
                if (customId === 'level_config_menu') {
                    console.log('🎯 Menu level_config_menu détecté, valeur:', interaction.values[0]);
                    const LevelConfigHandler = require('./handlers/LevelConfigHandler');
                    const levelHandler = new LevelConfigHandler();
                    const selectedValue = interaction.values[0];

                    try {
                        if (selectedValue === 'text_xp') {
                            console.log('🔧 Appel handleTextXPConfig...');
                            await levelHandler.handleTextXPConfig(interaction);
                        } else if (selectedValue === 'voice_xp') {
                            console.log('🔧 Appel handleVoiceXPConfig...');
                            await levelHandler.handleVoiceXPConfig(interaction);
                        } else if (selectedValue === 'notifications') {
                            console.log('🔧 Appel handleNotificationsConfig...');
                            await levelHandler.handleNotificationsConfig(interaction);
                        } else if (selectedValue === 'role_rewards') {
                            console.log('🔧 Appel handleRoleRewardsConfig...');
                            await levelHandler.handleRoleRewardsConfig(interaction);
                        } else if (selectedValue === 'level_formula') {
                            console.log('🔧 Appel handleLevelFormulaConfig...');
                            await levelHandler.handleLevelFormulaConfig(interaction);
                        } else if (selectedValue === 'leaderboard') {
                            console.log('🔧 Appel handleLeaderboardActions...');
                            await levelHandler.handleLeaderboardActions(interaction);
                        } else {
                            console.log('❌ Valeur non reconnue:', selectedValue);
                            await interaction.reply({
                                content: `❌ Option non reconnue: ${selectedValue}`,
                                flags: 64
                            });
                        }
                    } catch (error) {
                        console.error('❌ Erreur level config menu:', error);
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({
                                content: '❌ Erreur lors du traitement de la configuration.',
                                flags: 64
                            });
                        }
                    }
                    return;
                }

                // Routage pour les sous-menus de configuration des niveaux
                if (customId === 'notifications_config_menu' ||
                    customId === 'role_rewards_config_menu' ||
                    customId === 'level_formula_config_menu' ||
                    customId === 'level_notification_channel' ||
                    customId === 'level_card_style' ||
                    customId === 'remove_role_reward' ||
                    customId === 'add_role_reward_select') {

                    console.log('🎯 Routage sous-menu niveau:', customId);
                    const LevelConfigHandler = require('./handlers/LevelConfigHandler');
                    const levelHandler = new LevelConfigHandler();

                    try {
                        if (customId === 'level_notification_channel') {
                            const channelId = interaction.values[0];
                            const levelManager = require('./utils/levelManager');
                            const config = levelManager.loadConfig();

                            // Mettre à jour les deux propriétés pour assurer la compatibilité
                            config.notifications.channel = channelId;
                            config.notifications.channelId = channelId;
                            levelManager.saveConfig(config);

                            const channel = await interaction.guild.channels.fetch(channelId);

                            await interaction.update({
                                content: `✅ Canal de notification défini sur ${channel.name}`,
                                embeds: [],
                                components: []
                            });

                            // Retour automatique au menu après 2 secondes
                            setTimeout(async () => {
                                try {
                                    const LevelConfigHandler = require('./handlers/LevelConfigHandler');
                                    const levelHandler = new LevelConfigHandler();
                                    await levelHandler.showNotificationsConfig(interaction);
                                } catch (error) {
                                    console.error('Erreur retour menu notifications:', error);
                                }
                            }, 2000);

                        } else if (customId === 'level_card_style') {
                            const style = interaction.values[0];
                            const levelManager = require('./utils/levelManager');
                            const config = levelManager.loadConfig();
                            config.notifications.cardStyle = style;
                            levelManager.saveConfig(config);

                            await interaction.update({
                                content: `✅ Style de carte changé en **${style}**.`,
                                embeds: [],
                                components: []
                            });
                            // Pas de setTimeout - retour au menu sera fait manuellement

                        } else if (customId === 'remove_role_reward') {
                            const level = interaction.values[0];
                            const levelManager = require('./utils/levelManager');
                            const config = levelManager.loadConfig();

                            if (config.roleRewards && config.roleRewards[level]) {
                                delete config.roleRewards[level];
                                levelManager.saveConfig(config);

                                await interaction.update({
                                    content: `✅ Récompense du niveau ${level} supprimée.`,
                                    embeds: [],
                                    components: []
                                });
                                // Pas de setTimeout - retour au menu sera fait manuellement
                            } else {
                                await interaction.update({
                                    content: '❌ Récompense introuvable.',
                                    embeds: [],
                                    components: []
                                });
                            }

                        } else if (customId === 'add_role_reward_select') {
                            // Sélection de rôle pour récompense
                            const roleId = interaction.values[0];
                            console.log('🎯 Rôle sélectionné pour récompense:', roleId);

                            // Créer modal pour saisir le niveau
                            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
                            const modal = new ModalBuilder()
                                .setCustomId(`level_for_role_${roleId}`)
                                .setTitle('Niveau requis pour ce rôle');

                            const levelInput = new TextInputBuilder()
                                .setCustomId('level_required')
                                .setLabel('Niveau requis')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('Ex: 5, 10, 20...')
                                .setMinLength(1)
                                .setMaxLength(3)
                                .setRequired(true);

                            modal.addComponents(new ActionRowBuilder().addComponents(levelInput));
                            await interaction.showModal(modal);

                        } else {
                            const selectedValue = interaction.values[0];

                            if (selectedValue === 'back_main') {
                                await levelHandler.handleLevelConfigMenu(interaction);
                            } else if (customId === 'notifications_config_menu') {
                                await this.handleNotificationConfigAction(interaction, selectedValue, levelHandler);
                            } else if (customId === 'role_rewards_config_menu') {
                                await this.handleRoleRewardsConfigAction(interaction, selectedValue, levelHandler);
                            } else if (customId === 'level_formula_config_menu') {
                                await this.handleLevelFormulaConfigAction(interaction, selectedValue, levelHandler);
                            }
                        }
                    } catch (error) {
                        console.error('❌ Erreur sous-menu niveau:', error);
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({
                                content: '❌ Erreur lors du traitement de la configuration.',
                                flags: 64
                            });
                        }
                    }
                    return;
                }

                // === NOUVELLE CONFIGURATION ÉCONOMIQUE ===
                if (customId === 'economy_main_config') {
                    console.log('🎯 Menu économie principal');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleMainSelect(interaction);
                    return;
                }

                if (customId === 'economy_actions_select') {
                    console.log('🎯 Sélection action économique');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleActionSelect(interaction);
                    return;
                }

                if (customId.startsWith('economy_action_config_')) {
                    console.log('🎯 Config paramètre action');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleActionConfigSelect(interaction);
                    return;
                }

                if (customId === 'economy_boutique_select') {
                    console.log('🎯 Sélection boutique');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleBoutiqueSelect(interaction);
                    return;
                }

                // Routage pour achats boutique avec remises automatiques
                if (customId === 'shop_purchase') {
                    console.log('🎯 Routage achat boutique avec remises karma: shop_purchase');
                    await handleShopPurchase(interaction, dataManager);
                    return;
                }

                // Routage pour la commande /objet
                if (customId === 'object_selection' ||
                    customId === 'object_action_menu' ||
                    customId.startsWith('object_offer_') ||
                    customId.startsWith('object_delete_') ||
                    customId.startsWith('object_custom_') ||
                    customId.startsWith('offer_user_select_') ||
                    customId.startsWith('custom_message_modal_') ||
                    customId.startsWith('confirm_delete_') ||
                    customId === 'cancel_delete') {
                    console.log('🎯 Routage objet:', customId);
                    await this.handleObjectInteraction(interaction, dataManager);
                    return;
                }

                // Routage spécial pour les sélecteurs de canal comptage
                if (interaction.isChannelSelectMenu() && customId === 'counting_add_channel') {
                    console.log('🎯 Routage sélection canal comptage:', customId);
                    const countingHandler = router.handlers.counting;
                    await countingHandler.handleAddChannel(interaction);
                    return;
                }

                // Gestion des modals d'actions économiques (nouvelles versions séparées)
                if (customId.includes('_amounts_modal_') || customId.includes('_cooldown_modal_') || customId.includes('_karma_modal_')) {
                    console.log('🎯 Modal action config détecté:', customId);
                    console.log('🔍 Type interaction:', interaction.type, interaction.isModalSubmit());

                    if (interaction.isModalSubmit()) {
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const handler = new EconomyConfigHandler(dataManager);
                        await handler.handleActionModal(interaction);
                    } else {
                        console.log('⚠️ Modal détecté mais pas de soumission');
                    }
                    return;
                }

                // Gestion des sélecteurs d'actions économiques (nouvelle méthode)
                if (interaction.isStringSelectMenu() && customId.includes('action_config_')) {
                    try {
                        console.log('🎯 Sélecteur action économique détecté:', customId);
                        const actionName = customId.replace('action_config_', '');
                        const selectedValue = interaction.values[0];

                        if (selectedValue.endsWith('_modal_config')) {
                            const action = selectedValue.replace('_modal_config', '');
                            const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                            const handler = new EconomyConfigHandler(dataManager);
                            await handler.showActionModal(interaction, action);
                            return;
                        } else if (selectedValue === 'back_to_actions') {
                            const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                            const handler = new EconomyConfigHandler(dataManager);
                            await handler.showActionsMainMenu(interaction);
                            return;
                        }
                    } catch (error) {
                        console.error('❌ Erreur sélecteur action:', error);
                        if (!interaction.replied) {
                            await interaction.reply({
                                content: '❌ Erreur lors du traitement de la sélection.',
                                flags: 64
                            });
                        }
                    }
                    return;
                }

                // Gestion de la navigation spécifique d'actions
                if (interaction.isStringSelectMenu() && customId === 'action_select') {
                    try {
                        console.log('🎯 Sélection d\'action détectée:', interaction.values[0]);
                        const actionName = interaction.values[0];

                        if (actionName.startsWith('action_config_')) {
                            const action = actionName.replace('action_config_', '');
                            const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                            const handler = new EconomyConfigHandler(dataManager);
                            await handler.showActionSpecificConfig(interaction, action);
                            return;
                        }
                    } catch (error) {
                        console.error('❌ Erreur sélection action:', error);
                        if (!interaction.replied) {
                            await interaction.reply({
                                content: '❌ Erreur lors du traitement de la sélection d\'action.',
                                flags: 64
                            });
                        }
                    }
                    return;
                }

                // Ce routage est géré plus haut dans le code - supprimé pour éviter la duplication

                // Ajouter handlers pour nouvelles fonctionnalités boutique
                if (customId === 'objets_existants_select') {
                    console.log('🎯 Sélection objet à modifier');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleObjetModification(interaction);
                    return;
                }

                if (customId === 'delete_articles_select') {
                    console.log('🎯 Sélection article à supprimer');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleArticleDelete(interaction);
                    return;
                }

                // Handlers pour nouvelles sections Daily et Messages
                if (customId === 'economy_daily_select') {
                    console.log('🎯 Sélection daily config');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleDailySelect(interaction);
                    return;
                }

                if (customId === 'economy_messages_select') {
                    console.log('🎯 Sélection messages config');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleMessagesSelect(interaction);
                    return;
                }

                if (customId === 'economy_karma_select') {
                    console.log('🎯 Sélection karma config');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleKarmaSelect(interaction);
                    return;
                }

                // Handlers pour les confirmations de reset karma
                if (customId === 'karma_reset_confirm' || customId === 'karma_reset_good_confirm' || customId === 'karma_reset_bad_confirm') {
                    console.log('🎯 Confirmation reset karma:', customId);
                    const value = interaction.values[0];

                    if (value === 'cancel_reset') {
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.showKarmaMenu(interaction);
                        return;
                    } else if (value === 'confirm_reset') {
                        await handleKarmaResetComplete(interaction);
                        return;
                    } else if (value === 'confirm_reset_good') {
                        await handleKarmaResetGood(interaction);
                        return;
                    } else if (value === 'confirm_reset_bad') {
                        await handleKarmaResetBad(interaction);
                        return;
                    }
                }

                // Handler pour sélection jour reset hebdomadaire
                if (customId === 'karma_weekly_day_select') {
                    console.log('🎯 Sélection jour reset hebdomadaire');
                    const value = interaction.values[0];

                    if (value === 'back_karma') {
                        const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                        const economyHandler = new EconomyConfigHandler(dataManager);
                        await economyHandler.showKarmaMenu(interaction);
                        return;
                    } else {
                        await handleKarmaWeeklyDaySelection(interaction, value);
                        return;
                    }
                }

                if (customId === 'karma_rewards_select') {
                    console.log('🎯 Sélection karma rewards');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);
                    await economyHandler.handleKarmaRewardsSelect(interaction);
                    return;
                }

                if (customId === 'manage_objects_select' || customId === 'delete_objects_select' || customId === 'modify_rewards_select') {
                    console.log('🎯 Sélection boutique/karma navigation');
                    const EconomyConfigHandler = require('./handlers/EconomyConfigHandler');
                    const economyHandler = new EconomyConfigHandler(dataManager);

                    if (interaction.values[0] === 'back_boutique') {
                        await economyHandler.showBoutiqueMenu(interaction);
                    } else if (interaction.values[0] === 'back_karma') {
                        await economyHandler.showKarmaMenu(interaction);
                    }
                    return;
                }

                // Routage via MainRouter pour le reste - UNIQUEMENT si pas déjà traité
                if (!interaction.replied && !interaction.deferred) {
                    // Vérifier si l'interaction a été traitée par le nouveau handler économique
                    const economyHandled = customId === 'economy_main_config' ||
                                         customId === 'economy_actions_select' ||
                                         customId.startsWith('economy_action_config_') ||
                                         customId === 'economy_boutique_select' ||
                                         customId === 'economy_daily_select' ||
                                         customId === 'economy_messages_select' ||
                                         customId === 'remises_karma_select' ||
                                         customId === 'role_temp_select' ||
                                         customId === 'role_perm_select' ||
                                         customId === 'objets_existants_select' ||
                                         customId === 'delete_articles_select';

                    if (!economyHandled) {
                        console.log('🔄 Routage vers MainRouter pour:', customId);
                        const handled = await router.handleInteraction(interaction);

                        if (!handled && !interaction.replied && !interaction.deferred) {
                            await interaction.reply({
                                content: '❌ Cette interaction n\'est pas encore implémentée.',
                                flags: 64
                            });
                        }
                    } else {
                        console.log('✅ Interaction économique déjà traitée, ignorée par MainRouter');
                    }
                }
            }

        } catch (error) {
            console.error('❌ Erreur interaction:', error);
            if (!interaction.replied && !interaction.deferred) {
                try {
                    await interaction.reply({
                        content: '❌ Erreur lors du traitement de l\'interaction.',
                        flags: 64
                    });
                } catch (replyError) {
                    console.error('❌ Erreur envoi réponse:', replyError);
                }
            }
        }
    }

    async incrementMessageCount(message) {
        try {
            const dataManager = require('./utils/simpleDataManager');
            const userId = message.author.id;
            const guildId = message.guild.id;

            // Incrémenter dans economy.json (format principal)
            const economyData = await dataManager.loadData('economy.json', {});
            const userKey = `${userId}_${guildId}`;

            if (!economyData[userKey]) {
                economyData[userKey] = {
                    balance: 0,
                    goodKarma: 0,
                    badKarma: 0,
                    dailyStreak: 0,
                    lastDaily: 0,
                    messageCount: 0
                };
            }

            economyData[userKey].messageCount = (economyData[userKey].messageCount || 0) + 1;
            await dataManager.saveData('economy.json', economyData);

            // Aussi incrémenter dans level_users.json pour cohérence
            const levelData = await dataManager.loadData('level_users.json', {});
            const levelKey = `${guildId}_${userId}`;

            if (!levelData[levelKey]) {
                levelData[levelKey] = {
                    userId: userId,
                    guildId: guildId,
                    xp: 0,
                    level: 1,
                    totalMessages: 0,
                    totalVoiceTime: 0,
                    lastMessageTime: 0,
                    lastVoiceTime: 0
                };
            }

            levelData[levelKey].totalMessages = (levelData[levelKey].totalMessages || 0) + 1;
            levelData[levelKey].lastMessageTime = Date.now();
            await dataManager.saveData('level_users.json', levelData);

            console.log(`📊 ${message.author.tag} - Messages: ${economyData[userKey].messageCount} (Economy), ${levelData[levelKey].totalMessages} (Level)`);

        } catch (error) {
            console.error('❌ Erreur comptage messages:', error);
        }
    }

    async handleMessageReward(message) {
        try {
            const dataManager = require('./utils/simpleDataManager');
            const messageRewards = dataManager.getData('message_rewards.json');
            const cooldowns = dataManager.getData('message_cooldowns.json');

            const guildConfig = messageRewards[message.guild.id];
            if (!guildConfig || !guildConfig.enabled) return;

            const userId = message.author.id;
            const guildId = message.guild.id;
            const cooldownKey = `${userId}_${guildId}`;
            const now = Date.now();

            if (cooldowns[cooldownKey] && (now - cooldowns[cooldownKey]) < (guildConfig.cooldown * 1000)) {
                return;
            }

            cooldowns[cooldownKey] = now;
            dataManager.setData('message_cooldowns.json', cooldowns);

            const user = await dataManager.getUser(userId, guildId);
            user.balance = (user.balance || 1000) + guildConfig.amount;
            user.messageCount = (user.messageCount || 0) + 1;

            await dataManager.updateUser(userId, guildId, user);

            console.log(`💰 ${message.author.tag} a gagné ${guildConfig.amount}€ en envoyant un message`);

        } catch (error) {
            console.error('❌ Erreur récompense message:', error);
        }
    }

    async handleAutoThread(message) {
        try {
            const dataManager = require('./utils/simpleDataManager');
            const config = await dataManager.loadData('autothread.json', {});
            const guildId = message.guild.id;
            const channelId = message.channel.id;

            const autoThreadConfig = config[guildId];
            if (!autoThreadConfig || !autoThreadConfig.enabled) return;

            const isChannelConfigured = autoThreadConfig.channels?.some(c =>
                (typeof c === 'string' ? c : c.channelId) === channelId
            );
            if (!isChannelConfigured) return;

            if (message.channel.isThread() || message.channel.type !== 0) return;

            let threadName = autoThreadConfig.threadName || 'Discussion - {user}';
            threadName = threadName
                .replace('{user}', message.author.displayName || message.author.username)
                .replace('{channel}', message.channel.name)
                .replace('{date}', new Date().toLocaleDateString('fr-FR'))
                .replace('{time}', new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));

            threadName = threadName.substring(0, 100);

            const thread = await message.startThread({
                name: threadName,
                autoArchiveDuration: parseInt(autoThreadConfig.archiveTime) || 60,
                reason: `Auto-thread créé par ${message.author.tag}`
            });

            if (autoThreadConfig.slowMode && autoThreadConfig.slowMode > 0) {
                await thread.setRateLimitPerUser(parseInt(autoThreadConfig.slowMode));
            }

            if (!config[guildId].stats) {
                config[guildId].stats = { threadsCreated: 0, lastCreated: null };
            }
            config[guildId].stats.threadsCreated += 1;
            config[guildId].stats.lastCreated = new Date().toISOString();

            await dataManager.saveData('autothread.json', config);

            console.log(`🧵 Thread créé: "${threadName}" dans #${message.channel.name} par ${message.author.tag}`);

        } catch (error) {
            console.error('❌ Erreur création auto-thread:', error);
        }
    }

    async handleCounting(message) {
        try {
            // Utiliser le CountingManager complet au lieu de la logique simplifiée
            const countingManager = require('./utils/countingManager');

            const guildConfig = countingManager.getCountingConfig(message.guild.id);
            if (!guildConfig || !guildConfig.channels || guildConfig.channels.length === 0) {
                return false;
            }

            const channelConfig = guildConfig.channels.find(c => c.channelId === message.channel.id);
            if (!channelConfig || !channelConfig.enabled) {
                return false;
            }

            console.log(`🔍 Traitement comptage: "${message.content}" dans canal ${message.channel.id}`);
            console.log(`📊 État actuel: currentNumber=${channelConfig.currentNumber}, attendu=${channelConfig.currentNumber + 1}`);

            // Utiliser la validation complète du CountingManager
            const validationResult = await countingManager.validateCountingMessage(message);

            console.log(`✅ Résultat validation complet:`, validationResult);

            if (validationResult.valid) {
                // Message valide - traiter avec CountingManager
                await countingManager.processCountingMessage(message, validationResult);
                console.log(`🎯 ${message.author.tag} a compté correctement: ${validationResult.number} (prochain: ${validationResult.number + 1})`);
                return true;
            } else {
                // Message invalide - RESET IMMÉDIAT SILENCIEUX
                if (!validationResult.ignore && validationResult.shouldReset) {
                    // Reset immédiat SANS embed
                    const config = countingManager.getCountingConfig(message.guild.id);
                    const channelConfig = config.channels.find(c => c.channelId === message.channel.id);

                    if (channelConfig) {
                        channelConfig.currentNumber = 0;
                        channelConfig.lastUserId = null;
                        channelConfig.lastMessageId = null;
                        channelConfig.lastTimestamp = new Date().toISOString();
                        countingManager.saveCountingConfig(message.guild.id, config);
                        console.log(`🔄 Reset silencieux effectué - ${message.author.tag}`);
                    }

                    await countingManager.processInvalidMessage(message, validationResult);
                }
                console.log(`❌ ${message.author.tag} a échoué silencieusement: "${message.content}" - ${validationResult.reason || 'Invalide'}`);
                return true; // Toujours retourner true car c'est un canal de comptage actif
            }

        } catch (error) {
            console.error('❌ Erreur handleCounting:', error);
            return false;
        }
    }

    async handleLevelXP(message) {
        try {
            // Ajouter de l'XP pour les messages
            const result = await levelManager.addTextXP(message.author.id, message.guild.id, {
                user: message.author,
                guild: message.guild,
                channel: message.channel
            });

            if (result && result.leveledUp) {
                console.log(`🎉 ${message.author.tag} a atteint le niveau ${result.newLevel} !`);
            }

        } catch (error) {
            console.error('❌ Erreur XP message:', error);
        }
    }

    async handleVoiceXP(oldState, newState) {
        try {
            const userId = newState.id;
            const guild = newState.guild;

            // Utilisateur rejoint un canal vocal (n'était pas en vocal avant)
            if (!oldState.channel && newState.channel) {
                this.startVoiceXPTracking(userId, guild);
            }
            // Utilisateur quitte le vocal (était en vocal, plus maintenant)
            else if (oldState.channel && !newState.channel) {
                this.stopVoiceXPTracking(userId);
            }

        } catch (error) {
            console.error('❌ Erreur voice state update:', error);
        }
    }

    startVoiceXPTracking(userId, guild) {
        if (!this.voiceIntervals) {
            this.voiceIntervals = new Map();
        }

        // Si déjà en cours, arrêter l'ancien
        if (this.voiceIntervals.has(userId)) {
            clearInterval(this.voiceIntervals.get(userId));
        }

        const config = levelManager.loadConfig();
        const interval = setInterval(async () => {
            try {
                const result = await levelManager.addVoiceXP(userId, guild.id, {
                    user: { username: `User${userId}` },
                    guild: guild
                });

                if (result && result.leveledUp) {
                    console.log(`🎉 ${userId} a atteint le niveau ${result.newLevel} en vocal !`);
                }
            } catch (error) {
                console.error('❌ Erreur XP vocal interval:', error);
            }
        }, config.voiceXP.interval);

        this.voiceIntervals.set(userId, interval);
        console.log(`🎤 Suivi XP vocal démarré pour ${userId}`);
    }

    stopVoiceXPTracking(userId) {
        if (this.voiceIntervals && this.voiceIntervals.has(userId)) {
            clearInterval(this.voiceIntervals.get(userId));
            this.voiceIntervals.delete(userId);
            console.log(`🎤 Suivi XP vocal arrêté pour ${userId}`);
        }
    }

    async handleNotificationConfigAction(interaction, selectedValue, levelHandler) {
        const { ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder } = require('discord.js');
        const levelManager = require('./utils/levelManager');
        const config = levelManager.loadConfig();

        switch (selectedValue) {
            case 'toggle_notifications':
                config.notifications.enabled = !config.notifications.enabled;
                levelManager.saveConfig(config);
                await interaction.update({
                    content: `✅ Notifications ${config.notifications.enabled ? 'activées' : 'désactivées'}.`,
                    embeds: [],
                    components: []
                });
                // Retour automatique au menu après 2 secondes
                setTimeout(async () => {
                    try {
                        await levelHandler.showNotificationsConfig({
                            ...interaction,
                            update: (options) => interaction.editReply(options)
                        });
                    } catch (error) {
                        console.log('Timeout notification config - interaction expirée');
                    }
                }, 2000);
                break;

            case 'notification_channel':
                const channelRow = new ActionRowBuilder()
                    .addComponents(
                        new ChannelSelectMenuBuilder()
                            .setCustomId('level_notification_channel')
                            .setPlaceholder('Sélectionnez un canal pour les notifications')
                            .addChannelTypes([0]) // Text channels only
                    );

                await interaction.update({
                    content: 'Sélectionnez le canal pour les notifications de niveau:',
                    embeds: [],
                    components: [channelRow]
                });
                break;

            case 'card_style':
                const styleRow = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('level_card_style')
                            .setPlaceholder('Choisissez un style de carte...')
                            .addOptions([
                                { label: '🚀 Futuristic', value: 'futuristic' },
                                { label: '✨ Elegant', value: 'elegant' },
                                { label: '🎮 Gaming', value: 'gaming' },
                                { label: '🎯 Minimal', value: 'minimal' },
                                { label: '🌈 Holographic', value: 'holographic' },
                                { label: '🎮 Gamer Néon', value: 'gamer' },
                                { label: '💖 Amour', value: 'amour' },
                                { label: '✨ Sensuel', value: 'sensuel' }
                            ])
                    );

                await interaction.update({
                    content: 'Choisissez le style des cartes de niveau:',
                    embeds: [],
                    components: [styleRow]
                });
                break;

            default:
                await interaction.reply({
                    content: '❌ Action non reconnue.',
                    flags: 64
                });
        }
    }

    async handleRoleRewardsConfigAction(interaction, selectedValue, levelHandler) {
        const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, RoleSelectMenuBuilder } = require('discord.js');
        const levelManager = require('./utils/levelManager');
        const config = levelManager.loadConfig();

        switch (selectedValue) {
            case 'add_role_reward':
                // Nouveau système: sélecteur de rôle d'abord
                const roleRow = new ActionRowBuilder()
                    .addComponents(
                        new RoleSelectMenuBuilder()
                            .setCustomId('add_role_reward_select')
                            .setPlaceholder('Choisissez le rôle à attribuer comme récompense...')
                            .setMaxValues(1)
                    );

                await interaction.update({
                    content: '🎁 **Étape 1/2**: Sélectionnez le rôle que vous voulez attribuer en récompense:',
                    embeds: [],
                    components: [roleRow]
                });
                break;

            case 'list_rewards':
                const rewards = config.roleRewards || {};
                const rewardsList = Object.keys(rewards).length > 0
                    ? Object.entries(rewards).map(([level, roleId]) =>
                        `Niveau ${level}: <@&${roleId}>`).join('\n')
                    : 'Aucune récompense configurée';

                await interaction.update({
                    content: `📋 **Récompenses configurées:**\n\n${rewardsList}`,
                    embeds: [],
                    components: []
                });
                // Retour automatique au menu après 5 secondes
                setTimeout(async () => {
                    try {
                        await levelHandler.showRoleRewardsConfig({
                            ...interaction,
                            update: (options) => interaction.editReply(options)
                        });
                    } catch (error) {
                        console.log('Timeout role rewards config - interaction expirée');
                    }
                }, 5000);
                break;

            case 'remove_reward':
                const rewardsToRemove = config.roleRewards || {};
                if (Object.keys(rewardsToRemove).length === 0) {
                    await interaction.update({
                        content: '❌ Aucune récompense à supprimer.',
                        embeds: [],
                        components: []
                    });
                    setTimeout(() => levelHandler.showRoleRewardsConfig(interaction), 3000);
                    return;
                }

                const removeRow = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('remove_role_reward')
                            .setPlaceholder('Choisissez une récompense à supprimer...')
                            .addOptions(
                                Object.entries(rewardsToRemove).map(([level, roleId]) => ({
                                    label: `Niveau ${level}`,
                                    description: `Supprime la récompense du niveau ${level}`,
                                    value: level
                                }))
                            )
                    );

                await interaction.update({
                    content: 'Sélectionnez la récompense à supprimer:',
                    embeds: [],
                    components: [removeRow]
                });
                break;

            default:
                await interaction.reply({
                    content: '❌ Action non reconnue.',
                    flags: 64
                });
        }
    }

    async handleLevelFormulaConfigAction(interaction, selectedValue, levelHandler) {
        const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
        const levelManager = require('./utils/levelManager');
        const config = levelManager.loadConfig();

        switch (selectedValue) {
            case 'base_xp':
                const baseXPModal = new ModalBuilder()
                    .setCustomId('base_xp_modal')
                    .setTitle('Modifier l\'XP de base');

                const baseXPInput = new TextInputBuilder()
                    .setCustomId('base_xp')
                    .setLabel('XP requis pour le niveau 1')
                    .setStyle(TextInputStyle.Short)
                    .setValue(config.levelFormula.baseXP.toString())
                    .setPlaceholder('Ex: 100')
                    .setRequired(true);

                baseXPModal.addComponents(new ActionRowBuilder().addComponents(baseXPInput));
                await interaction.showModal(baseXPModal);
                break;

            case 'multiplier':
                const multiplierModal = new ModalBuilder()
                    .setCustomId('multiplier_modal')
                    .setTitle('Modifier le multiplicateur');

                const multiplierInput = new TextInputBuilder()
                    .setCustomId('multiplier')
                    .setLabel('Multiplicateur de difficulté')
                    .setStyle(TextInputStyle.Short)
                    .setValue(config.levelFormula.multiplier.toString())
                    .setPlaceholder('Ex: 1.5')
                    .setRequired(true);

                multiplierModal.addComponents(new ActionRowBuilder().addComponents(multiplierInput));
                await interaction.showModal(multiplierModal);
                break;

            case 'reset_formula':
                config.levelFormula = { baseXP: 100, multiplier: 1.5 };
                levelManager.saveConfig(config);
                await interaction.update({
                    content: '✅ Formule réinitialisée aux valeurs par défaut (Base: 100 XP, Multiplicateur: 1.5).',
                    embeds: [],
                    components: []
                });
                // Retour automatique au menu après 3 secondes
                setTimeout(async () => {
                    try {
                        await levelHandler.showLevelFormulaConfig({
                            ...interaction,
                            update: (options) => interaction.editReply(options)
                        });
                    } catch (error) {
                        console.log('Timeout level formula config - interaction expirée');
                    }
                }, 3000);
                break;

            default:
                await interaction.reply({
                    content: '❌ Action non reconnue.',
                    flags: 64
                });
        }
    }

async handleObjectInteraction(interaction, dataManager) {
    const customId = interaction.customId;
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    try {
        const economyData = await dataManager.loadData('economy.json', {});
        const userKey = `${userId}_${guildId}`;
        const userData = economyData[userKey] || { inventory: [] };
        const customObjects = userData.inventory ? userData.inventory.filter(item => item.type === 'custom') : [];

        // Sélection de l'objet
        if (customId === 'object_selection') {
            if (customObjects.length === 0) {
                return await interaction.update({
                    content: '❌ Aucun objet dans votre inventaire.',
                    components: []
                });
            }
            const objectIndex = parseInt(interaction.values[0].replace('object_', ''));
            const selectedObject = customObjects[objectIndex];
            if (!selectedObject) {
                return await interaction.update({
                    content: '❌ Objet introuvable dans votre inventaire.',
                    components: []
                });
            }
            const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setTitle(`🎯 ${selectedObject.name}`)
                .setDescription(selectedObject.description || 'Objet de boutique')
                .addFields([
                    {
                        name: '📦 Type',
                        value: getItemTypeLabel(selectedObject.type),
                        inline: true
                    },
                    {
                        name: '💰 Prix d\'Achat',
                        value: `${selectedObject.price || 'N/A'}€`,
                        inline: true
                    },
                    {
                        name: '⚡ Choisissez une Action',
                        value: '🎁 **Offrir** - Donner à un membre\n🗑️ **Supprimer** - Retirer de l\'inventaire\n💬 **Interaction** - Message personnalisé',
                        inline: false
                    }
                ]);
            const actionMenu = new StringSelectMenuBuilder()
                .setCustomId('object_action_menu')
                .setPlaceholder('Sélectionnez une action')
                .addOptions([
                    {
                        label: 'Offrir à un membre',
                        value: `object_offer_${objectIndex}`,
                        description: 'Donner cet objet à un autre membre',
                        emoji: '🎁'
                    },
                    {
                        label: 'Supprimer l\'objet',
                        value: `object_delete_${objectIndex}`,
                        description: 'Retirer cet objet de votre inventaire',
                        emoji: '🗑️'
                    },
                    {
                        label: 'Interaction personnalisée',
                        value: `object_custom_${objectIndex}`,
                        description: 'Utiliser avec un message personnalisé',
                        emoji: '💬'
                    }
                ]);
            const row = new ActionRowBuilder().addComponents(actionMenu);
            return await interaction.update({
                embeds: [embed],
                components: [row]
            });
        }

        // Action menu (offrir, supprimer, interaction personnalisée)
        if (customId === 'object_action_menu') {
            const actionValue = interaction.values[0];
            if (actionValue.startsWith('object_offer_')) {
                const objectIndex = parseInt(actionValue.replace('object_offer_', ''));
                const selectedObject = customObjects[objectIndex];
                if (!selectedObject) {
                    return await interaction.update({
                        content: '❌ Objet introuvable.',
                        components: []
                    });
                }
                const guild = await interaction.guild.fetch();
                const members = await guild.members.fetch();
                const options = members
                    .filter(m => !m.user.bot && m.id !== userId)
                    .map(m => ({
                        label: m.user.username,
                        value: `offer_user_select_${objectIndex}_${m.id}`
                    }))
                    .slice(0, 25);
                if (options.length === 0) {
                    return await interaction.update({
                        content: '❌ Aucun membre à qui offrir cet objet.',
                        components: []
                    });
                }
                const memberSelect = new (require('discord.js').StringSelectMenuBuilder)()
                    .setCustomId('offer_user_select')
                    .setPlaceholder('Choisissez le membre à qui offrir')
                    .addOptions(options);
                const row = new (require('discord.js').ActionRowBuilder)().addComponents(memberSelect);
                return await interaction.update({
                    content: `Sélectionnez le membre à qui offrir **${selectedObject.name}** :`,
                    components: [row],
                    embeds: []
                });
            }
            if (actionValue.startsWith('object_delete_')) {
                const objectIndex = parseInt(actionValue.replace('object_delete_', ''));
                const selectedObject = customObjects[objectIndex];
                if (!selectedObject) {
                    return await interaction.update({
                        content: '❌ Objet introuvable.',
                        components: []
                    });
                }
                const confirmRow = new (require('discord.js').ActionRowBuilder)().addComponents(
                    new (require('discord.js').StringSelectMenuBuilder)()
                        .setCustomId('confirm_delete')
                        .setPlaceholder('Confirmer la suppression')
                        .addOptions([
                            { label: 'Oui, supprimer', value: `confirm_delete_${objectIndex}`, emoji: '✅' },
                            { label: 'Annuler', value: 'cancel_delete', emoji: '❌' }
                        ])
                );
                return await interaction.update({
                    content: `Êtes-vous sûr de vouloir supprimer **${selectedObject.name}** ?`,
                    components: [confirmRow],
                    embeds: []
                });
            }
            if (actionValue.startsWith('object_custom_')) {
                const objectIndex = parseInt(actionValue.replace('object_custom_', ''));
                const selectedObject = customObjects[objectIndex];
                if (!selectedObject) {
                    return await interaction.update({
                        content: '❌ Objet introuvable.',
                        components: []
                    });
                }
                // Modal Discord pour message personnalisé
                const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
                const modal = new ModalBuilder()
                    .setCustomId(`custom_message_modal_${objectIndex}`)
                    .setTitle('Interaction personnalisée')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('custom_message')
                                .setLabel('Votre message/interaction')
                                .setStyle(TextInputStyle.Paragraph)
                                .setPlaceholder('Décrivez ce que vous faites avec l\'objet...')
                                .setRequired(true)
                        )
                    );
                return await interaction.showModal(modal);
            }
        }

        // Offrir à un membre (sélection dans la liste)
        if (customId.startsWith('offer_user_select_')) {
            const parts = customId.split('_');
            const objectIndex = parseInt(parts[3]);
            const targetUserId = parts[4];
            const selectedObject = customObjects[objectIndex];
            if (!selectedObject) {
                return await interaction.update({
                    content: '❌ Objet introuvable.',
                    components: []
                });
            }
            // Retirer l'objet à l'utilisateur courant
            let found = false;
            userData.inventory = userData.inventory.filter((item, idx) => {
                if (item.type === 'custom' && idx === objectIndex && !found) {
                    found = true;
                    return false;
                }
                return true;
            });
            await dataManager.saveData('economy.json', economyData);
            // Ajouter l'objet à l'utilisateur cible
            const targetKey = `${targetUserId}_${guildId}`;
            if (!economyData[targetKey]) economyData[targetKey] = { inventory: [] };
            economyData[targetKey].inventory.push(selectedObject);
            await dataManager.saveData('economy.json', economyData);
            return await interaction.update({
                content: `🎁 Vous avez offert **${selectedObject.name}** à <@${targetUserId}> !`,
                components: [],
                embeds: []
            });
        }

        // Confirmation suppression
        if (customId.startsWith('confirm_delete_')) {
            const objectIndex = parseInt(customId.replace('confirm_delete_', ''));
            const selectedObject = customObjects[objectIndex];
            if (!selectedObject) {
                return await interaction.update({
                    content: '❌ Objet introuvable.',
                    components: []
                });
            }
            let found = false;
            userData.inventory = userData.inventory.filter((item, idx) => {
                if (item.type === 'custom' && idx === objectIndex && !found) {
                    found = true;
                    return false;
                }
                return true;
            });
            await dataManager.saveData('economy.json', economyData);
            return await interaction.update({
                content: `🗑️ **${selectedObject.name}** a été supprimé de votre inventaire.`,
                components: [],
                embeds: []
            });
        }
        if (customId === 'cancel_delete') {
            return await interaction.update({
                content: 'Suppression annulée.',
                components: [],
                embeds: []
            });
        }

        // Interaction personnalisée (réponse au modal)
        if (interaction.isModalSubmit() && customId.startsWith('custom_message_modal_')) {
            const objectIndex = parseInt(customId.replace('custom_message_modal_', ''));
            const selectedObject = customObjects[objectIndex];
            if (!selectedObject) {
                return await interaction.reply({
                    content: '❌ Objet introuvable.',
                    ephemeral: true
                });
            }
            const messageValue = interaction.fields.getTextInputValue('custom_message');
            return await interaction.reply({
                content: `💬 Vous utilisez **${selectedObject.name}** :\n> ${messageValue}`,
                ephemeral: true
            });
        }
    } catch (error) {
        console.error('Erreur dans handleObjectInteraction:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Erreur lors du traitement de la sélection.',
                ephemeral: true
            });
        }
    }
}

// Variables globales pour les cooldowns des messages
const cooldowns = {};

// Fonction pour gérer les achats avec remises karma automatiques
async function handleShopPurchase(interaction, dataManager) {
    try {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const itemId = interaction.values[0];

        // Charger les données
        const userData = await dataManager.getUser(userId, guildId);
        const shopData = await dataManager.loadData('shop.json', {});
        const economyConfig = await dataManager.loadData('economy.json', {});
        const shopItems = shopData[guildId] || [];

        // Trouver l'objet sélectionné
        const item = shopItems.find(i => (i.id || shopItems.indexOf(i)).toString() === itemId);
        if (!item) {
            return await interaction.reply({
                content: '❌ Objet introuvable dans la boutique.',
                flags: 64
            });
        }

        // Calculer le karma net et la remise (karma bon - karma mauvais)
        const userKarmaNet = (userData.goodKarma || 0) - Math.abs(userData.badKarma || 0);
        let discountPercent = 0;

        if (economyConfig.karmaDiscounts?.enabled && economyConfig.karmaDiscounts?.ranges) {
            const applicableRanges = economyConfig.karmaDiscounts.ranges.filter(range => userKarmaNet >= range.minKarma);
            const bestRange = applicableRanges.sort((a, b) => b.minKarma - a.minKarma)[0];
            discountPercent = bestRange ? bestRange.discount : 0;
        }

        // Calculer le prix final avec remise
        const originalPrice = item.price;
        const finalPrice = discountPercent > 0 ?
            Math.floor(originalPrice * (100 - discountPercent) / 100) : originalPrice;

        // Vérifier si l'utilisateur a assez d'argent
        if (userData.balance < finalPrice) {
            const missingAmount = finalPrice - userData.balance;
            return await interaction.reply({
                content: `❌ **Solde insuffisant !**\n\n💰 Prix: ${finalPrice}€ ${discountPercent > 0 ? `(remise ${discountPercent}% appliquée)` : ''}\n💳 Votre solde: ${userData.balance}€\n❌ Manque: ${missingAmount}€`,
                flags: 64
            });
        }

        // Déduire l'argent
        userData.balance -= finalPrice;

        // Ajouter l'objet à l'inventaire
        if (!userData.inventory) userData.inventory = [];

        const inventoryItem = {
            id: item.id || Date.now().toString(),
            name: item.name,
            description: item.description || 'Objet de la boutique',
            type: item.type || 'custom',
            price: finalPrice,
            purchaseDate: new Date().toISOString(),
            from: 'shop'
        };

        if (item.type === 'temporary_role' && item.roleId && item.duration) {
            inventoryItem.roleId = item.roleId;
            inventoryItem.duration = item.duration;
            inventoryItem.expiresAt = new Date(Date.now() + (item.duration * 24 * 60 * 60 * 1000)).toISOString();
        } else if (item.type === 'permanent_role' && item.roleId) {
            inventoryItem.roleId = item.roleId;
        }

        userData.inventory.push(inventoryItem);
        await dataManager.updateUser(userId, guildId, userData);

        let effectMessage = '';
        if (item.type === 'temporary_role' && item.roleId) {
            try {
                const role = await interaction.guild.roles.fetch(item.roleId);
                if (role) {
                    await interaction.member.roles.add(role);
                    effectMessage = `\n👤 Rôle **${role.name}** attribué pour ${item.duration} jour${item.duration > 1 ? 's' : ''} !`;

                    setTimeout(async () => {
                        try {
                            await interaction.member.roles.remove(role);
                        } catch (error) {
                            console.error('Erreur suppression rôle temporaire:', error);
                        }
                    }, item.duration * 24 * 60 * 60 * 1000);
                } else {
                    effectMessage = '\n⚠️ Rôle introuvable.';
                }
            } catch (error) {
                effectMessage = '\n⚠️ Erreur lors de l\'attribution du rôle.';
            }
        } else if (item.type === 'permanent_role' && item.roleId) {
            try {
                const role = await interaction.guild.roles.fetch(item.roleId);
                if (role) {
                    await interaction.member.roles.add(role);
                    effectMessage = `\n👤 Rôle **${role.name}** attribué de façon permanente !`;
                } else {
                    effectMessage = '\n⚠️ Rôle introuvable.';
                }
            } catch (error) {
                effectMessage = '\n⚠️ Erreur lors de l\'attribution du rôle.';
            }
        } else if (item.type === 'custom') {
            effectMessage = '\n🎁 Objet personnalisé acheté !';
        } else {
            effectMessage = '\n📦 Objet ajouté à votre inventaire !';
        }

        // Message de confirmation avec détails de la remise
        let confirmMessage = `✅ **Achat réussi !**\n\n🛒 **${item.name}**\n💰 Prix payé: **${finalPrice}€**`;

        if (discountPercent > 0) {
            const savedAmount = originalPrice - finalPrice;
            confirmMessage += `\n💸 Prix original: ~~${originalPrice}€~~\n🎯 Remise karma (${discountPercent}%): **-${savedAmount}€**\n⚖️ Votre karma net: ${userKarmaNet}`;
        }

        confirmMessage += `\n💳 Nouveau solde: **${userData.balance}€**${effectMessage}`;

        await interaction.reply({
            content: confirmMessage,
            flags: 64
        });

        console.log(`🛒 ${interaction.user.tag} a acheté "${item.name}" pour ${finalPrice}€ (remise: ${discountPercent}%)`);

    } catch (error) {
        console.error('❌ Erreur handleShopPurchase:', error);
        await interaction.reply({
            content: '❌ Erreur lors de l\'achat.',
            flags: 64
        });
    }
}

// Fonction utilitaire pour les types d'objets
function getItemTypeLabel(type) {
    switch (type) {
        case 'custom': return 'Objet personnalisé';
        case 'temp_role': return 'Rôle temporaire';
        case 'perm_role': return 'Rôle permanent';
        default: return 'Autre';
    }
}

const app = new RenderSolutionBot();

module.exports = { RenderSolutionBot, handleShopPurchase };