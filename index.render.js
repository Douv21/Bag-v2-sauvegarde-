/**
 * BAG BOT V2 - RENDER.COM OPTIMIZED
 * Version simplifiée pour Render.com Web Service
 */

const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

// Import du système de gestion des modals et d'erreurs
const { modalHandler } = require('./utils/modalHandler');
const { errorHandler, ErrorLevels } = require('./utils/errorHandler');

// Configuration optimisée pour Render.com
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();

// Serveur Express pour Web Service
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static('public'));

// Routes de santé pour Render.com
app.get('/', (req, res) => {
    res.json({
        status: 'active',
        bot: client.user?.tag || 'connecting',
        commands: client.commands.size,
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        bot_ready: client.readyAt !== null
    });
});

// Chargement des commandes optimisé
async function loadCommands() {
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
                    client.commands.set(command.data.name, command);
                    console.log(`✅ ${command.data.name}`);
                } else {
                    console.log(`⚠️ ${file}: Structure invalide`);
                }
            } catch (error) {
                console.error(`❌ Erreur ${file}:`, error.message);
            }
        }
        
        console.log(`✅ ${client.commands.size} commandes chargées`);
        
    } catch (error) {
        console.error('❌ Erreur chargement commandes:', error);
    }
}

// Enregistrement des commandes
async function registerCommands() {
    const commands = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());
    
    if (commands.length === 0) {
        console.log('❌ Aucune commande à enregistrer');
        return;
    }

    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        
        console.log(`🔄 Enregistrement de ${commands.length} commandes...`);
        
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        
        console.log(`✅ ${commands.length} commandes enregistrées`);
        
    } catch (error) {
        console.error('❌ Erreur enregistrement:', error);
    }
}

// Gestionnaire d'interactions
client.on('interactionCreate', async (interaction) => {
    try {
        // Gestion spéciale des modals
        if (interaction.isModalSubmit()) {
            console.log(`🎯 Modal submit détecté: ${interaction.customId}`);
            
            // Vérifier si le modal est implémenté
            const modalImplemented = await modalHandler.handleModalSubmission(interaction);
            if (!modalImplemented) {
                return; // Modal non implémenté, déjà géré par modalHandler
            }
            
            // Si le modal est implémenté, il faut le traiter ici
            // Pour l'instant, on log juste qu'il est implémenté
            console.log(`✅ Modal ${interaction.customId} est implémenté mais pas encore traité dans ce fichier`);
            
            await errorHandler.respondWithError(
                interaction,
                ErrorLevels.WARNING,
                'Modal Implémenté',
                'Ce modal est implémenté mais le traitement complet nécessite une mise à jour du système.\n\n' +
                'Veuillez utiliser les commandes slash en attendant la mise à jour complète.'
            );
            return;
        }

        // Gestion des commandes slash
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        await command.execute(interaction);
        
    } catch (error) {
        await errorHandler.handleCriticalError(error, {
            context: 'interactionCreate event',
            interactionType: interaction.type,
            customId: interaction.customId,
            commandName: interaction.commandName
        }, interaction);
    }
});

// Événement ready
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} connecté`);
    await registerCommands();
    console.log('🚀 Bot prêt pour Render.com');
});

// Démarrage
async function start() {
    try {
        // Chargement des commandes
        await loadCommands();
        
        // Connexion Discord
        await client.login(process.env.DISCORD_TOKEN);
        
        // Démarrage serveur Web
        app.listen(port, '0.0.0.0', () => {
            console.log(`🌐 Serveur Web actif sur port ${port}`);
            console.log(`📊 Health check: http://localhost:${port}/health`);
        });
        
    } catch (error) {
        console.error('❌ Erreur démarrage:', error);
        process.exit(1);
    }
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

// Démarrage
start();