/**
 * BAG BOT V2 - RENDER.COM WEB SERVICE
 * Architecture simplifiée pour déploiement Web Service
 */

const { Client, Collection, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const express = require('express');
const path = require('path');
const fs = require('fs');

class BagBotRender {
    constructor() {
        // Configuration Discord
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ],
            partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
        });

        // Collections
        this.client.commands = new Collection();
        this.client.cooldowns = new Collection();

        // Serveur Express pour Web Service
        this.app = express();
        this.port = process.env.PORT || 5000;

        this.init();
    }

    async init() {
        try {
            console.log('🚀 BAG BOT V2 - Render.com Web Service démarré');
            
            // Setup web server
            this.setupWebServer();
            
            // Load commands
            await this.loadCommands();
            
            // Setup Discord client
            this.setupDiscord();
            
            // Start services
            await this.start();
            
        } catch (error) {
            console.error('❌ Erreur initialisation:', error);
            process.exit(1);
        }
    }

    setupWebServer() {
        this.app.use(express.json());
        
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.status(200).json({ 
                status: 'OK',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                bot: this.client.isReady() ? 'Connected' : 'Disconnected'
            });
        });

        // Root endpoint
        this.app.get('/', (req, res) => {
            res.status(200).json({
                name: 'BAG Bot V2 - Render Web Service',
                status: 'Active',
                version: '2.0.0'
            });
        });

        // Start server
        this.app.listen(this.port, '0.0.0.0', () => {
            console.log(`🌐 Serveur Web actif sur port ${this.port}`);
            console.log(`📊 Health check: http://localhost:${this.port}/health`);
        });
    }

    async loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        
        if (!fs.existsSync(commandsPath)) {
            console.log('📂 Aucun dossier commands trouvé');
            return;
        }

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        console.log(`📂 Chargement de ${commandFiles.length} commandes...`);
        
        for (const file of commandFiles) {
            try {
                const command = require(path.join(commandsPath, file));
                if (command.data && command.execute) {
                    this.client.commands.set(command.data.name, command);
                    console.log(`✅ ${command.data.name}`);
                }
            } catch (error) {
                console.error(`❌ Erreur chargement ${file}:`, error.message);
            }
        }
        
        console.log(`✅ ${this.client.commands.size} commandes chargées`);
    }

    setupDiscord() {
        // Event Ready
        this.client.once('ready', async () => {
            console.log(`✅ ${this.client.user.tag} connecté`);
            
            // Register commands
            await this.registerCommands();
        });

        // Event Interaction
        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            const command = this.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('Erreur commande:', error);
                
                const errorMessage = {
                    content: 'Une erreur est survenue lors de l\'exécution de cette commande.',
                    flags: 64
                };

                if (interaction.deferred) {
                    await interaction.editReply(errorMessage).catch(() => {});
                } else if (!interaction.replied) {
                    await interaction.reply(errorMessage).catch(() => {});
                }
            }
        });

        // Error handling
        this.client.on('error', (error) => {
            console.error('Discord Client Error:', error);
        });

        process.on('unhandledRejection', (error) => {
            console.error('Unhandled Rejection:', error);
        });
    }

    async registerCommands() {
        try {
            const commands = Array.from(this.client.commands.values()).map(command => command.data.toJSON());
            
            console.log(`🔄 Enregistrement de ${commands.length} commandes...`);
            
            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
            
            await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
                body: commands
            });
            
            console.log(`✅ ${commands.length} commandes enregistrées`);
        } catch (error) {
            console.error('❌ Erreur enregistrement commandes:', error);
        }
    }

    async start() {
        if (!process.env.DISCORD_TOKEN) {
            console.error('❌ DISCORD_TOKEN manquant');
            process.exit(1);
        }

        if (!process.env.CLIENT_ID) {
            console.error('❌ CLIENT_ID manquant');
            process.exit(1);
        }

        await this.client.login(process.env.DISCORD_TOKEN);
    }
}

// Démarrage
new BagBotRender();