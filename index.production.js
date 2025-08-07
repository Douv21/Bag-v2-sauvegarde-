/**
 * BAG BOT V2 - PRODUCTION RENDER.COM
 * Solution finale pour déploiement Render.com
 */

const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

class ProductionBot {
    constructor() {
        // Client Discord optimisé
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ],
            presence: {
                status: 'online',
                activities: [{
                    name: '18 commandes | /arc-en-ciel',
                    type: 0
                }]
            }
        });

        this.client.commands = new Collection();
        this.commandsRegistered = false;
        this.registrationAttempts = 0;
        this.maxRegistrationAttempts = 10;

        // Serveur Express
        this.app = express();
        this.port = process.env.PORT || 5000;
        
        this.setupExpress();
        this.init();
    }

    setupExpress() {
        this.app.use(express.json());
        this.app.use(express.static('public'));

        // Routes de santé
        this.app.get('/', (req, res) => {
            res.json({
                status: 'active',
                bot: this.client.user?.tag || 'connecting',
                commands: this.client.commands.size,
                registered: this.commandsRegistered,
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            });
        });

        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                bot_ready: this.client.readyAt !== null,
                commands_loaded: this.client.commands.size,
                commands_registered: this.commandsRegistered,
                memory: process.memoryUsage(),
                uptime: process.uptime()
            });
        });

        // Route pour forcer re-registration
        this.app.post('/force-register', async (req, res) => {
            try {
                await this.registerCommands();
                res.json({ success: true, message: 'Commands re-registered' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    async init() {
        try {
            // Chargement des commandes
            await this.loadCommands();
            
            // Configuration des événements Discord
            this.setupDiscordEvents();
            
            // Connexion Discord
            await this.client.login(process.env.DISCORD_TOKEN);
            
            // Démarrage serveur Web
            this.startWebServer();
            
        } catch (error) {
            console.error('❌ Erreur démarrage:', error);
            process.exit(1);
        }
    }

    async loadCommands() {
        try {
            const commandsPath = path.join(__dirname, 'commands');
            const commandFiles = await fs.readdir(commandsPath);
            const jsFiles = commandFiles.filter(file => file.endsWith('.js'));
            
            console.log(`📂 Chargement de ${jsFiles.length} commandes...`);
            
            for (const file of jsFiles) {
                try {
                    const filePath = path.join(commandsPath, file);
                    delete require.cache[require.resolve(filePath)];
                    const command = require(filePath);
                    
                    if (command.data && command.execute) {
                        this.client.commands.set(command.data.name, command);
                        console.log(`✅ ${command.data.name}`);
                        
                        // Log spécial pour arc-en-ciel
                        if (command.data.name === 'arc-en-ciel') {
                            console.log('   🌈 Commande arc-en-ciel avec permissions admin chargée');
                        }
                    } else {
                        console.log(`⚠️ ${file}: Structure invalide`);
                    }
                } catch (error) {
                    console.error(`❌ Erreur ${file}:`, error.message);
                }
            }
            
            console.log(`✅ ${this.client.commands.size} commandes chargées`);
            
        } catch (error) {
            console.error('❌ Erreur chargement commandes:', error);
        }
    }

    async registerCommands() {
        if (this.registrationAttempts >= this.maxRegistrationAttempts) {
            console.log('⚠️ Nombre maximum de tentatives d\'enregistrement atteint');
            return;
        }

        this.registrationAttempts++;
        console.log(`🔄 Tentative d'enregistrement ${this.registrationAttempts}/${this.maxRegistrationAttempts}...`);

        const commands = Array.from(this.client.commands.values()).map(cmd => cmd.data.toJSON());
        
        if (commands.length === 0) {
            console.log('❌ Aucune commande à enregistrer');
            return;
        }

        try {
            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
            
            // Enregistrement avec timeout plus long
            const registerPromise = rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );

            // Timeout de 30 secondes
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout registration')), 30000)
            );

            await Promise.race([registerPromise, timeoutPromise]);
            
            console.log(`✅ ${commands.length} commandes enregistrées avec succès`);
            this.commandsRegistered = true;
            
            // Vérification après délai
            setTimeout(async () => {
                try {
                    const registeredCommands = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID));
                    console.log(`📊 Vérification: ${registeredCommands.length} commandes sur Discord`);
                    
                    const arcEnCiel = registeredCommands.find(c => c.name === 'arc-en-ciel');
                    if (arcEnCiel) {
                        console.log('🌈 /arc-en-ciel confirmée sur Discord');
                    }
                } catch (verifyError) {
                    console.log('⚠️ Vérification impossible:', verifyError.message);
                }
            }, 10000);
            
        } catch (error) {
            console.error(`❌ Erreur enregistrement (tentative ${this.registrationAttempts}):`, error.message);
            
            if (error.status === 429) {
                // Rate limited - attendre plus longtemps
                console.log('⏳ Rate limit détecté, attente de 60 secondes...');
                setTimeout(() => this.registerCommands(), 60000);
            } else if (this.registrationAttempts < this.maxRegistrationAttempts) {
                // Retry avec délai exponentiel
                const delay = Math.min(1000 * Math.pow(2, this.registrationAttempts), 30000);
                console.log(`⏳ Retry dans ${delay/1000}s...`);
                setTimeout(() => this.registerCommands(), delay);
            } else {
                console.log('❌ Échec définitif de l\'enregistrement des commandes');
            }
        }
    }

    setupDiscordEvents() {
        this.client.once('ready', async () => {
            console.log(`✅ ${this.client.user.tag} connecté`);
            console.log(`🏰 ${this.client.guilds.cache.size} serveur(s) connecté(s)`);
            
            // Suites privées (production léger): scan existant
            try {
                const { scanAndRepairSuites, ensurePrivateSuiteShopItems } = require('./utils/privateSuiteManager');
                await scanAndRepairSuites(this.client);
                for (const guild of this.client.guilds.cache.values()) {
                    await ensurePrivateSuiteShopItems(guild);
                }
                console.log('🔒 Suites privées prêtes (production)');
            } catch (e) {
                console.warn('⚠️ Suites privées init (production):', e?.message || e);
            }
            
            // Enregistrement des commandes avec délai
            setTimeout(() => this.registerCommands(), 3000);
        });

        // Gestionnaire d'interactions
        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            const command = this.client.commands.get(interaction.commandName);
            if (!command) {
                console.log(`❌ Commande inconnue: ${interaction.commandName}`);
                return;
            }

            try {
                console.log(`🔧 Exécution: /${interaction.commandName} par ${interaction.user.tag}`);
                await command.execute(interaction);
                
            } catch (error) {
                console.error(`❌ Erreur commande ${interaction.commandName}:`, error);
                
                const errorMessage = {
                    content: 'Une erreur est survenue lors de l\'exécution de cette commande.',
                    flags: 64
                };

                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp(errorMessage);
                    } else {
                        await interaction.reply(errorMessage);
                    }
                } catch (followupError) {
                    console.error('❌ Impossible de répondre à l\'interaction:', followupError);
                }
            }
        });

        // Gestion des erreurs de connexion
        this.client.on('error', (error) => {
            console.error('❌ Erreur client Discord:', error);
        });

        this.client.on('disconnect', () => {
            console.log('⚠️ Bot déconnecté');
        });

        this.client.on('reconnecting', () => {
            console.log('🔄 Reconnexion...');
        });
    }

    startWebServer() {
        this.app.listen(this.port, '0.0.0.0', () => {
            console.log(`🌐 Serveur Web actif sur port ${this.port}`);
            console.log(`📊 Health check: http://localhost:${this.port}/health`);
            console.log(`🔧 Force register: POST http://localhost:${this.port}/force-register`);
            console.log('🚀 Bot prêt pour production Render.com');
        });
    }
}

// Gestion globale des erreurs
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
});

// Démarrage
new ProductionBot();