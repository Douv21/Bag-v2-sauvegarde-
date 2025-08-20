const fs = require('fs').promises;
const path = require('path');
const { REST, Routes } = require('discord.js');

class CommandHandler {
    constructor(client, dataManager) {
        this.client = client;
        this.dataManager = dataManager;
        this.commands = new Map();
        
        this.init();
    }

    async init() {
        await this.loadCommands();
        await this.registerCommands();
        this.setupCommandListener();
    }

    async loadCommands() {
        const commandsPath = path.join(__dirname, '../commands');
        
        try {
            const commandFiles = await fs.readdir(commandsPath);
            const jsFiles = commandFiles.filter(file => file.endsWith('.js'));
            
            console.log(`📂 Chargement de ${jsFiles.length} commandes...`);
            
            for (const file of jsFiles) {
                try {
                    const filePath = path.join(commandsPath, file);
                    delete require.cache[require.resolve(filePath)];
                    const command = require(filePath);
                    
                    if (command.data && command.execute) {
                        this.commands.set(command.data.name, command);
                        this.client.commands.set(command.data.name, command);
                        console.log(`✅ ${command.data.name}`);
                    } else {
                        console.log(`⚠️ ${file}: Structure invalide (data/execute manquants)`);
                    }
                } catch (error) {
                    console.error(`❌ Erreur chargement ${file}:`, error.message);
                }
            }
            
            console.log(`✅ ${this.commands.size} commandes chargées`);
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des commandes:', error);
        }
    }

    async registerCommands() {
        const commands = Array.from(this.commands.values()).map(cmd => cmd.data.toJSON());
        
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
            console.error('❌ Erreur enregistrement commandes:', error);
        }
    }

    setupCommandListener() {
        this.client.on('interactionCreate', async (interaction) => {
            if (interaction.isChatInputCommand()) {
                const command = this.commands.get(interaction.commandName);
                if (!command) return;

                try {
                    await this.handleCooldown(interaction, command);
                    const needsClient = ['bump', 'bump-config', 'config-bump', 'quarantaine', 'test-verif'].includes(interaction.commandName);
                    if (needsClient) {
                        await command.execute(interaction, this.client);
                    } else {
                        await command.execute(interaction, this.dataManager);
                    }
                    // Compter la commande utilisée
                    try {
                        const guildId = interaction.guild?.id || null;
                        await this.dataManager.incrementCommandCount(guildId);
                    } catch {}
                } catch (error) {
                    console.error(`❌ Erreur commande ${interaction.commandName}:`, error);

                    const errorMessage = {
                        content: 'Une erreur est survenue lors de l\'exécution de cette commande.',
                        ephemeral: true
                    };

                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp(errorMessage).catch(() => {});
                    } else {
                        await interaction.reply(errorMessage).catch(() => {});
                    }
                }
            }
            // Note: Les autres interactions sont gérées par le routeur principal dans index.render-final.js
        });
    }

    async handleCooldown(interaction, command) {
        if (!command.cooldown) return;

        const { cooldowns } = this.client;
        const commandName = command.data.name;
        const userId = interaction.user.id;

        if (!cooldowns.has(commandName)) {
            cooldowns.set(commandName, new Map());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(commandName);
        const cooldownAmount = (command.cooldown || 3) * 1000;

        if (timestamps.has(userId)) {
            const expirationTime = timestamps.get(userId) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                await interaction.reply({
                    content: `⏰ Veuillez patienter ${timeLeft.toFixed(1)} secondes avant de réutiliser \`/${commandName}\`.`,
                    flags: 64
                });
                throw new Error('Cooldown actif');
            }
        }

        timestamps.set(userId, now);
        setTimeout(() => timestamps.delete(userId), cooldownAmount);
    }

    getCommandsList() {
        return Array.from(this.commands.keys());
    }

    getCommand(name) {
        return this.commands.get(name);
    }

    hasCommand(name) {
        return this.commands.has(name);
    }

    getCommandsCount() {
        return this.commands.size;
    }

    async reloadCommand(commandName) {
        try {
            const commandPath = path.join(__dirname, '../commands', `${commandName}.js`);
            delete require.cache[require.resolve(commandPath)];
            
            const newCommand = require(commandPath);
            
            if (newCommand.data && newCommand.execute) {
                this.commands.set(commandName, newCommand);
                this.client.commands.set(commandName, newCommand);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error(`❌ Erreur rechargement ${commandName}:`, error);
            return false;
        }
    }

    async reloadAllCommands() {
        this.commands.clear();
        this.client.commands.clear();
        
        await this.loadCommands();
        await this.registerCommands();
        
        return this.commands.size;
    }
}

module.exports = CommandHandler;