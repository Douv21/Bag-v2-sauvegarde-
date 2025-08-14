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
		const directoriesToScan = [
			path.join(__dirname, '../commands'),
			path.join(__dirname, '../assets')
		];
		
		try {
			let total = 0;
			for (const dirPath of directoriesToScan) {
				try {
					const files = await fs.readdir(dirPath);
					const jsFiles = files.filter(file => file.endsWith('.js'));
					console.log(`📂 Chargement depuis ${path.basename(dirPath)}: ${jsFiles.length} fichiers`);
					for (const file of jsFiles) {
						try {
							const filePath = path.join(dirPath, file);
							delete require.cache[require.resolve(filePath)];
							const command = require(filePath);
							if (command.data && command.execute && command.data?.name) {
								const name = command.data.name;
								if (this.commands.has(name) && dirPath.endsWith(path.sep + 'assets')) {
									// Éviter doublons: priorité au dossier commands
									continue;
								}
								this.commands.set(name, command);
								this.client.commands.set(name, command);
								total++;
								console.log(`✅ ${name}`);
							} else {
								console.log(`⚠️ ${file}: Structure invalide (data/execute manquants)`);
							}
						} catch (error) {
							console.error(`❌ Erreur chargement ${file}:`, error.message);
						}
					}
				} catch (dirErr) {
					// Dossier manquant ou non pertinent: ignorer
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
                    const needsClient = ['bump', 'bump-config', 'config-bump', 'bump-reminder'].includes(interaction.commandName);
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