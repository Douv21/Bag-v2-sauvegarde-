const { Client, Collection, GatewayIntentBits, Routes, REST, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const deploymentManager = require('./utils/deploymentManager');
const mongoBackup = require('./utils/mongoBackupManager');
const levelManager = require('./utils/levelManager');

// Handlers pour reset karma
async function handleKarmaResetComplete(interaction) {
    try {
        const guildId = interaction.guild.id;
        const dataManager = require('./utils/simpleDataManager');
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

class RenderSolutionBot {
    constructor() {
        this.initializeWebServer();
    }

    async initializeWebServer() {
        const app = express();
        const PORT = process.env.PORT || 3000;

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

        app.listen(PORT, '0.0.0.0', () => {
            console.log('🌐 Serveur Web actif sur port', PORT);
            console.log('📊 Status: http://localhost:5000/commands-status');
            console.log('✅ Port 5000 ouvert pour Render.com');

            // 2. Lancer les systèmes après un court délai
            setTimeout(() => this.initializeSystemsAndDiscord(), 1000);
        });
    }

    async initializeSystemsAndDiscord() {
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

        // Initialiser Discord
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
                const customId = interaction.customId || '';
                const dataManager = require('./utils/simpleDataManager');

                // Ajout routage objets ici
                if (
                    customId === 'object_selection' ||
                    customId === 'object_action_menu' ||
                    customId.startsWith('object_offer_') ||
                    customId.startsWith('object_delete_') ||
                    customId.startsWith('object_custom_') ||
                    customId.startsWith('offer_user_select_') ||
                    customId.startsWith('confirm_delete_') ||
                    customId === 'cancel_delete' ||
                    (interaction.isModalSubmit() && customId.startsWith('custom_message_modal_'))
                ) {
                    const { handleObjectInteraction } = require('./handlers/ObjectHandler');
                    await handleObjectInteraction(interaction, dataManager);
                    return;
                }

                // Gestion commandes slash
                if (interaction.isChatInputCommand()) {
                    const command = this.commands.get(interaction.commandName);
                    if (!command) return;
                    console.log(`🔧 /${interaction.commandName} par ${interaction.user.tag}`);
                    await command.execute(interaction, dataManager);
                    return;
                }

                // Gestion modals (karma, daily, boutique, etc.)
                if (interaction.isModalSubmit()) {
                    const MainRouterHandler = require('./handlers/MainRouterHandler');
                    const router = new MainRouterHandler(dataManager);
                    const handled = await router.handleInteraction(interaction);
                    if (!handled && !interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Cette modal n\'est pas encore implémentée.',
                            ephemeral: true
                        });
                    }
                    return;
                }

                // Gestion menus et boutons
                if (
                    interaction.isStringSelectMenu() ||
                    interaction.isUserSelectMenu() ||
                    interaction.isRoleSelectMenu() ||
                    interaction.isButton()
                ) {
                    const MainRouterHandler = require('./handlers/MainRouterHandler');
                    const router = new MainRouterHandler(dataManager);
                    const handled = await router.handleInteraction(interaction);
                    if (!handled && !interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Interaction non gérée.',
                            ephemeral: true
                        });
                    }
                    return;
                }

            } catch (error) {
                console.error('❌ Erreur interactionCreate:', error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ Une erreur est survenue.',
                        ephemeral: true
                    });
                }
            }
        });

        this.client.on('messageCreate', async message => {
            if (message.author.bot) return;

            try {
                await this.incrementMessageCount(message);
                const countingHandled = await this.handleCounting(message);
                if (!countingHandled) {
                    await this.handleMessageReward(message);
                }
                await this.handleLevelXP(message);
                await this.handleAutoThread(message);
            } catch (error) {
                console.error('❌ Erreur messageCreate:', error);
            }
        });

        this.client.on('voiceStateUpdate', async (oldState, newState) => {
            await this.handleVoiceXP(oldState, newState);
        });
                            }
    async deployCommands() {
        try {
            for (const guild of this.client.guilds.cache.values()) {
                console.log(`🎯 Serveur: ${guild.name} (${guild.id})`);
                console.log(`🔄 Enregistrement des commandes...`);

                const commands = Array.from(this.commands.values()).map(command => command.data.toJSON());

                const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

                await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
                    { body: commands }
                );

                console.log(`✅ ${commands.length} commandes enregistrées sur ${guild.name}`);
            }
        } catch (error) {
            console.error('❌ Erreur déploiement commandes:', error);
        }
    }

    async incrementMessageCount(message) {
        try {
            const dataManager = require('./utils/simpleDataManager');
            const guildId = message.guild.id;
            const userId = message.author.id;
            const key = `${userId}_${guildId}`;
            const economyData = dataManager.loadData('economy.json', {});
            if (!economyData[key]) economyData[key] = {};
            if (!economyData[key].messageCount) economyData[key].messageCount = 0;
            economyData[key].messageCount += 1;
            dataManager.saveData('economy.json', economyData);
        } catch (err) {
            console.error('Erreur incrementMessageCount:', err);
        }
    }

    async handleCounting(message) {
        // Placeholder pour gérer un canal de comptage si besoin
        return false;
    }

    async handleMessageReward(message) {
        try {
            const dataManager = require('./utils/simpleDataManager');
            const config = dataManager.loadData('economy') || {};
            const rewardAmount = config.messageRewards?.amount || 1;
            const cooldown = config.messageRewards?.cooldown || 60;

            const key = `${message.author.id}_${message.guild.id}`;
            const now = Date.now();
            const economyData = dataManager.loadData('economy.json', {});
            const userData = economyData[key] || {};

            if (!userData.lastMessageReward || now - userData.lastMessageReward > cooldown * 1000) {
                userData.balance = (userData.balance || 0) + rewardAmount;
                userData.lastMessageReward = now;
                economyData[key] = userData;
                dataManager.saveData('economy.json', economyData);
            }
        } catch (error) {
            console.error('Erreur handleMessageReward:', error);
        }
    }

    async handleLevelXP(message) {
        try {
            const levelManager = require('./utils/levelManager');
            await levelManager.handleXP(message);
        } catch (error) {
            console.error('Erreur handleLevelXP:', error);
        }
    }

    async handleAutoThread(message) {
        // Gère l’auto-création de threads si tu veux
    }

    async handleVoiceXP(oldState, newState) {
        try {
            const levelManager = require('./utils/levelManager');
            await levelManager.handleVoiceXP(oldState, newState);
        } catch (error) {
            console.error('Erreur handleVoiceXP:', error);
        }
    }
}

module.exports = RenderSolutionBot;
// Fonction pour afficher le nom lisible du type d'objet
function getItemTypeLabel(type) {
    switch (type) {
        case 'custom': return 'Objet personnalisé';
        case 'temp_role': return 'Rôle temporaire';
        case 'perm_role': return 'Rôle permanent';
        default: return 'Inconnu';
    }
}
