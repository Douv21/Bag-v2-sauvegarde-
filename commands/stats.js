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
                        value: `${stats.totalUsers}`,
                        inline: true
                    },
                    {
                        name: '💭 Confessions',
                        value: `${stats.totalConfessions}`,
                        inline: true
                    },
                    {
                        name: '⚡ Uptime',
                        value: `${Math.floor(stats.uptime / 3600)}h ${Math.floor((stats.uptime % 3600) / 60)}m`,
                        inline: true
                    },
                    {
                        name: '🔧 Mémoire',
                        value: `${Math.round(stats.memory.used / 1024 / 1024)}MB`,
                        inline: true
                    },
                    {
                        name: '🌐 Serveurs',
                        value: `${interaction.client.guilds.cache.size}`,
                        inline: true
                    },
                    {
                        name: '⚙️ Commandes',
                        value: `${interaction.client.commands.size}`,
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
};
```

```javascript
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
                        value: `${stats.totalUsers}`,
                        inline: true
                    },
                    {
                        name: '💭 Confessions',
                        value: `${stats.totalConfessions}`,
                        inline: true
                    },
                    {
                        name: '⚡ Uptime',
                        value: `${Math.floor(stats.uptime / 3600)}h ${Math.floor((stats.uptime % 3600) / 60)}m`,
                        inline: true
                    },
                    {
                        name: '🔧 Mémoire',
                        value: `${Math.round(stats.memory.used / 1024 / 1024)}MB`,
                        inline: true
                    },
                    {
                        name: '🌐 Serveurs',
                        value: `${interaction.client.guilds.cache.size}`,
                        inline: true
                    },
                    {
                        name: '⚙️ Commandes',
                        value: `${interaction.client.commands.size}`,
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
};
```

```javascript
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Affiche les informations d\'un utilisateur')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('L\'utilisateur à afficher')
                .setRequired(true)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('target');

        // Utiliser le système unifié des données utilisateur
        const dataManager = require('../utils/dataManager.js');

        // Récupérer toutes les données utilisateur depuis le système unifié
        const userData = dataManager.getUser(targetUser.id, interaction.guild.id);

        const targetStats = {
            messageCount: userData.messageCount || 0,
            lastMessage: userData.lastMessage
        };

        const economyStats = {
            balance: userData.balance || 0,
            goodKarma: userData.goodKarma || 0,
            badKarma: userData.badKarma || 0,
            xp: userData.xp || 0
        };

        const embed = new EmbedBuilder()
            .setColor('#9C27B0')
            .setTitle(`👤 Informations de ${targetUser.username}`)
            .addFields([
                { name: 'Messages', value: `${targetStats.messageCount}`, inline: true },
                { name: 'Balance', value: `${economyStats.balance}`, inline: true },
                { name: 'Karma Positif', value: `${economyStats.goodKarma}`, inline: true },
                { name: 'Karma Négatif', value: `${economyStats.badKarma}`, inline: true },
                { name: 'XP', value: `${economyStats.xp}`, inline: true }
            ])
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            flags: 64
        });
    }
};