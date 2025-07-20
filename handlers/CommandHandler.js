/**
 * GESTIONNAIRE DE COMMANDES
 * Chargement et gestion des commandes Discord
 */

const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

class CommandHandler {
    constructor(client, dataManager) {
        this.client = client;
        this.dataManager = dataManager;
        this.commandsPath = path.join(__dirname, '../commands');
    }

    async loadCommands() {
        try {
            // Créer le dossier commands s'il n'existe pas
            if (!fs.existsSync(this.commandsPath)) {
                fs.mkdirSync(this.commandsPath, { recursive: true });
                await this.createDefaultCommands();
            }

            const commandFiles = fs.readdirSync(this.commandsPath).filter(file => file.endsWith('.js'));
            
            console.log(`📂 Chargement de ${commandFiles.length} commandes...`);

            for (const file of commandFiles) {
                const filePath = path.join(this.commandsPath, file);
                
                try {
                    // Supprimer du cache pour rechargement à chaud
                    delete require.cache[require.resolve(filePath)];
                    
                    const command = require(filePath);
                    
                    if ('data' in command && 'execute' in command) {
                        // Injecter le dataManager dans chaque commande
                        command.dataManager = this.dataManager;
                        
                        this.client.commands.set(command.data.name, command);
                        console.log(`✅ ${command.data.name}`);
                    } else {
                        console.log(`⚠️ ${file} - Structure invalide`);
                    }
                } catch (error) {
                    console.error(`❌ Erreur chargement ${file}:`, error.message);
                }
            }

            console.log(`✅ ${this.client.commands.size} commandes chargées`);
        } catch (error) {
            console.error('❌ Erreur chargement commandes:', error);
        }
    }

    async createDefaultCommands() {
        // Créer les commandes essentielles pour Web Service

        // Commande confession
        await this.createConfessCommand();
        
        // Commande économie
        await this.createEconomieCommand();
        
        // Commande configuration
        await this.createConfigCommand();
        
        // Commande stats
        await this.createStatsCommand();
    }

    async createConfessCommand() {
        const confessCommand = `
const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('confess')
        .setDescription('Envoyer une confession anonyme')
        .addStringOption(option =>
            option.setName('texte')
                .setDescription('Votre confession (optionnel si image fournie)')
                .setMaxLength(4000)
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('Image à joindre (optionnel)')
                .setRequired(false)),

    async execute(interaction, dataManager) {
        try {
            const text = interaction.options.getString('texte');
            const image = interaction.options.getAttachment('image');

            // Vérifier qu'au moins un contenu est fourni
            if (!text && !image) {
                return await interaction.reply({
                    content: '❌ Vous devez fournir au moins un texte ou une image.',
                    flags: 64
                });
            }

            // Récupérer la configuration
            const config = await dataManager.getData('config');
            const guildConfig = config[interaction.guild.id] || {};
            
            if (!guildConfig.confessionChannels || guildConfig.confessionChannels.length === 0) {
                return await interaction.reply({
                    content: '❌ Aucun canal de confession configuré sur ce serveur.',
                    flags: 64
                });
            }

            // Prendre le premier canal configuré
            const channelId = guildConfig.confessionChannels[0];
            const channel = interaction.guild.channels.cache.get(channelId);

            if (!channel) {
                return await interaction.reply({
                    content: '❌ Canal de confession introuvable.',
                    flags: 64
                });
            }

            // Créer l'embed de confession
            const confessionEmbed = new EmbedBuilder()
                .setColor('#9932cc')
                .setTitle('💭 Confession Anonyme')
                .setTimestamp();

            if (text) {
                confessionEmbed.setDescription(text);
            }

            if (image) {
                confessionEmbed.setImage(image.url);
            }

            // Envoyer la confession
            const confessionMessage = await channel.send({ embeds: [confessionEmbed] });

            // Créer un thread si configuré
            if (guildConfig.autoThread) {
                await confessionMessage.startThread({
                    name: \`💭 Discussion - \${Date.now()}\`,
                    autoArchiveDuration: 60
                });
            }

            // Logger la confession
            await this.logConfession(interaction, text, image?.url, dataManager);

            // Confirmer à l'utilisateur
            await interaction.reply({
                content: '✅ Votre confession a été envoyée anonymement.',
                flags: 64
            });

        } catch (error) {
            console.error('❌ Erreur confession:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    },

    async logConfession(interaction, text, imageUrl, dataManager) {
        try {
            const confessions = await dataManager.getData('confessions');
            
            const logEntry = {
                id: Date.now(),
                userId: interaction.user.id,
                username: interaction.user.tag,
                guildId: interaction.guild.id,
                guildName: interaction.guild.name,
                content: text || 'Image uniquement',
                imageUrl: imageUrl || null,
                timestamp: Date.now()
            };

            confessions.push(logEntry);

            // Garder seulement les 1000 dernières confessions
            if (confessions.length > 1000) {
                confessions.splice(0, confessions.length - 1000);
            }

            await dataManager.saveData('confessions', confessions);

        } catch (error) {
            console.error('❌ Erreur log confession:', error);
        }
    }
};`;

        fs.writeFileSync(path.join(this.commandsPath, 'confess.js'), confessCommand);
    }

    async createEconomieCommand() {
        const economieCommand = `
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economie')
        .setDescription('Voir votre profil économique'),

    async execute(interaction, dataManager) {
        try {
            const user = await dataManager.getUser(interaction.user.id, interaction.guild.id);
            
            const level = Math.floor(user.xp / 1000);
            const nextLevelXP = (level + 1) * 1000;
            const xpProgress = user.xp - (level * 1000);

            // Calculer niveau de karma
            const karmaBalance = user.goodKarma - user.badKarma;
            let karmaLevel = 'Neutre';
            if (karmaBalance >= 50) karmaLevel = 'Saint 😇';
            else if (karmaBalance >= 20) karmaLevel = 'Bon 😊';
            else if (karmaBalance <= -50) karmaLevel = 'Diabolique 😈';
            else if (karmaBalance <= -20) karmaLevel = 'Mauvais 😠';

            const embed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle(\`💼 Profil Économique - \${interaction.user.displayName}\`)
                .setThumbnail(interaction.user.displayAvatarURL())
                .addFields([
                    {
                        name: '💰 Solde',
                        value: \`\${user.balance}€\`,
                        inline: true
                    },
                    {
                        name: '📊 Niveau',
                        value: \`Niveau \${level}\`,
                        inline: true
                    },
                    {
                        name: '⭐ XP',
                        value: \`\${xpProgress}/\${1000} (\${user.xp} total)\`,
                        inline: true
                    },
                    {
                        name: '😇 Karma Bon',
                        value: \`\${user.goodKarma}\`,
                        inline: true
                    },
                    {
                        name: '😈 Karma Mauvais',
                        value: \`\${user.badKarma}\`,
                        inline: true
                    },
                    {
                        name: '⚖️ Niveau Karma',
                        value: karmaLevel,
                        inline: true
                    },
                    {
                        name: '💬 Messages',
                        value: \`\${user.messageCount}\`,
                        inline: true
                    },
                    {
                        name: '🎁 Streak Daily',
                        value: \`\${user.dailyStreak} jours\`,
                        inline: true
                    }
                ])
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                flags: 64
            });

        } catch (error) {
            console.error('❌ Erreur économie:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};`;

        fs.writeFileSync(path.join(this.commandsPath, 'economie.js'), economieCommand);
    }

    async createConfigCommand() {
        const configCommand = `
const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configuration du serveur')
        .setDefaultMemberPermissions('0'),

    async execute(interaction, dataManager) {
        try {
            await this.showMainConfig(interaction, dataManager);
        } catch (error) {
            console.error('❌ Erreur config:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    },

    async showMainConfig(interaction, dataManager) {
        const embed = new EmbedBuilder()
            .setColor('#2196F3')
            .setTitle('⚙️ Configuration Serveur')
            .setDescription('Configurez les différents systèmes du bot');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('config_main_menu')
            .setPlaceholder('🎯 Sélectionner une section à configurer')
            .addOptions([
                {
                    label: 'Canaux Confessions',
                    description: 'Gérer les canaux de confessions',
                    value: 'channels',
                    emoji: '💭'
                },
                {
                    label: 'Auto-Thread',
                    description: 'Configuration des threads automatiques',
                    value: 'autothread',
                    emoji: '🧵'
                },
                {
                    label: 'Logs Admin',
                    description: 'Configuration des logs administrateur',
                    value: 'logs',
                    emoji: '📋'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        if (interaction.deferred) {
            await interaction.editReply({
                embeds: [embed],
                components: components
            });
        } else {
            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });
        }
    }
};`;

        fs.writeFileSync(path.join(this.commandsPath, 'config.js'), configCommand);
    }

    async createStatsCommand() {
        const statsCommand = `
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Statistiques du bot'),

    async execute(interaction, dataManager) {
        try {
            const stats = await dataManager.getStats();
            
            const embed = new EmbedBuilder()
                .setColor('#9C27B0')
                .setTitle('📊 Statistiques Bot')
                .addFields([
                    {
                        name: '👥 Utilisateurs',
                        value: \`\${stats.totalUsers}\`,
                        inline: true
                    },
                    {
                        name: '💭 Confessions',
                        value: \`\${stats.totalConfessions}\`,
                        inline: true
                    },
                    {
                        name: '⚡ Uptime',
                        value: \`\${Math.floor(stats.uptime / 3600)}h \${Math.floor((stats.uptime % 3600) / 60)}m\`,
                        inline: true
                    },
                    {
                        name: '🔧 Mémoire',
                        value: \`\${Math.round(stats.memory.used / 1024 / 1024)}MB\`,
                        inline: true
                    },
                    {
                        name: '🌐 Serveurs',
                        value: \`\${interaction.client.guilds.cache.size}\`,
                        inline: true
                    },
                    {
                        name: '⚙️ Commandes',
                        value: \`\${interaction.client.commands.size}\`,
                        inline: true
                    }
                ])
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                flags: 64
            });

        } catch (error) {
            console.error('❌ Erreur stats:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue.',
                flags: 64
            });
        }
    }
};`;

        fs.writeFileSync(path.join(this.commandsPath, 'stats.js'), statsCommand);
    }
}

module.exports = CommandHandler;