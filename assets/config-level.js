const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const levelManager = require('../utils/levelManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-level')
        .setDescription('Configuration du système de niveaux (Admin uniquement)'),

    async execute(interaction) {
        try {
            // Vérifier les permissions
            if (!interaction.member.permissions.has('Administrator')) {
                return await interaction.reply({
                    content: '❌ Vous devez être administrateur pour utiliser cette commande.',
                    flags: 64
                });
            }

            await interaction.deferReply({ flags: 64 });
            
            const config = levelManager.loadConfig();
            const stats = levelManager.getGuildStats(interaction.guild.id);
            
            const embed = new EmbedBuilder()
                .setTitle('⚙️ Configuration du Système de Niveaux')
                .setDescription('Configurez tous les aspects du système de niveaux de votre serveur')
                .addFields(
                    {
                        name: '📊 Statistiques Actuelles',
                        value: `👥 **${stats.totalUsers}** utilisateurs actifs\n📈 **${Math.round(stats.avgLevel)}** niveau moyen\n💬 **${stats.totalMessages.toLocaleString()}** messages total\n⚡ **${stats.totalXP.toLocaleString()}** XP total`,
                        inline: false
                    },
                    {
                        name: '💬 XP par Messages',
                        value: `Min: **${config.textXP.min}** XP\nMax: **${config.textXP.max}** XP\nCooldown: **${config.xpCooldown / 1000}**s`,
                        inline: true
                    },
                    {
                        name: '🎤 XP Vocal',
                        value: `Gain: **${config.voiceXP.amount}** XP\nIntervalle: **${config.voiceXP.interval / 1000}**s`,
                        inline: true
                    },
                    {
                        name: '🔔 Notifications',
                        value: `État: ${config.notifications.enabled ? '✅ Activées' : '❌ Désactivées'}\nCanal: ${config.notifications.channel ? `<#${config.notifications.channel}>` : '❌ Non défini'}\nStyle: **${config.notifications.cardStyle}**`,
                        inline: true
                    },
                    {
                        name: '🎁 Récompenses de Rôle',
                        value: Object.keys(config.roleRewards).length > 0 
                            ? `**${Object.keys(config.roleRewards).length}** niveaux configurés`
                            : '❌ Aucune récompense configurée',
                        inline: true
                    }
                )
                .setColor('#5865F2')
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('level_config_menu')
                        .setPlaceholder('Choisissez une section à configurer')
                        .addOptions([
                            {
                                label: 'XP Messages',
                                description: 'Configurer le gain XP par messages',
                                value: 'text_xp',
                                emoji: '💬'
                            },
                            {
                                label: 'XP Vocal',
                                description: 'Configurer le gain XP vocal',
                                value: 'voice_xp',
                                emoji: '🎤'
                            },
                            {
                                label: 'Notifications',
                                description: 'Canal et style des notifications de niveau',
                                value: 'notifications',
                                emoji: '🔔'
                            },
                            {
                                label: 'Récompenses de Rôle',
                                description: 'Gérer les rôles par niveau',
                                value: 'role_rewards',
                                emoji: '🎁'
                            },
                            {
                                label: 'Formule de Niveau',
                                description: 'Ajuster la difficulté de progression',
                                value: 'level_formula',
                                emoji: '📐'
                            },
                            {
                                label: 'Classement',
                                description: 'Voir le top des utilisateurs',
                                value: 'leaderboard',
                                emoji: '🏆'
                            }
                        ])
                );

            await interaction.editReply({ embeds: [embed], components: [row] });
            
        } catch (error) {
            console.error('Erreur commande config-level:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de l\'affichage de la configuration.',
                embeds: [],
                components: []
            });
        }
    }
};