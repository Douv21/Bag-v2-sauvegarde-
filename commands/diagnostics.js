const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { errorHandler, ErrorLevels } = require('../utils/errorHandler');
const { modalHandler } = require('../utils/modalHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('diagnostics')
        .setDescription('Affiche les diagnostics système du bot')
        .addSubcommand(subcommand =>
            subcommand
                .setName('erreurs')
                .setDescription('Affiche les statistiques d\'erreurs récentes')
                .addIntegerOption(option =>
                    option.setName('heures')
                        .setDescription('Nombre d\'heures à analyser (défaut: 24)')
                        .setMinValue(1)
                        .setMaxValue(168)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('modals')
                .setDescription('Affiche l\'état des modals (implémentées vs planifiées)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('system')
                .setDescription('Affiche les informations système générales'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction, dataManager) {
        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'erreurs':
                    await this.handleErrorStats(interaction);
                    break;
                case 'modals':
                    await this.handleModalStatus(interaction);
                    break;
                case 'system':
                    await this.handleSystemInfo(interaction);
                    break;
                default:
                    await interaction.reply({
                        content: '❌ Sous-commande non reconnue.',
                        ephemeral: true
                    });
            }
        } catch (error) {
            await errorHandler.handleCriticalError(error, {
                context: 'Commande diagnostics',
                subcommand: interaction.options.getSubcommand()
            }, interaction);
        }
    },

    async handleErrorStats(interaction) {
        try {
            const hours = interaction.options.getInteger('heures') || 24;
            const { stats, recentLogs } = await errorHandler.getErrorStats(hours);

            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('📊 Statistiques d\'Erreurs')
                .setDescription(`Analyse des dernières **${hours}** heures`)
                .addFields([
                    {
                        name: '📈 Résumé Global',
                        value: `**Total :** ${stats.total} événements\n` +
                               `🔥 **Critiques :** ${stats.critical}\n` +
                               `❌ **Erreurs :** ${stats.error}\n` +
                               `⚠️ **Avertissements :** ${stats.warning}\n` +
                               `ℹ️ **Informations :** ${stats.info}`,
                        inline: true
                    },
                    {
                        name: '🎯 Indicateurs de Santé',
                        value: this.getHealthIndicators(stats),
                        inline: true
                    }
                ])
                .setTimestamp();

            // Ajouter les erreurs récentes les plus critiques
            if (stats.critical > 0) {
                const criticalErrors = recentLogs
                    .filter(log => log.level === ErrorLevels.CRITICAL)
                    .slice(-3)
                    .map(log => {
                        const time = new Date(log.timestamp).toLocaleTimeString('fr-FR');
                        return `\`${time}\` ${log.message}`;
                    })
                    .join('\n');

                embed.addFields({
                    name: '🔥 Erreurs Critiques Récentes',
                    value: criticalErrors || 'Aucune erreur critique récente',
                    inline: false
                });
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            await errorHandler.logError(ErrorLevels.ERROR, 'Erreur affichage stats erreurs', error);
            await interaction.reply({
                content: '❌ Erreur lors de la récupération des statistiques.',
                ephemeral: true
            });
        }
    },

    async handleModalStatus(interaction) {
        try {
            const { implemented, planned } = modalHandler.getAvailableModals();

            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('🎛️ État des Modals')
                .setDescription('Vue d\'ensemble des fonctionnalités de formulaires')
                .addFields([
                    {
                        name: '✅ Modals Implémentées',
                        value: `**${implemented.length}** fonctionnalités disponibles :\n` +
                               implemented.map(modal => `• \`${modal}\``).join('\n') || 'Aucune',
                        inline: false
                    },
                    {
                        name: '🚧 Modals Planifiées',
                        value: `**${planned.length}** fonctionnalités en développement :\n` +
                               planned.map(modal => `• \`${modal}\``).join('\n') || 'Aucune',
                        inline: false
                    },
                    {
                        name: '📊 Statistiques',
                        value: `**Taux d'implémentation :** ${Math.round((implemented.length / (implemented.length + planned.length)) * 100)}%\n` +
                               `**Total prévu :** ${implemented.length + planned.length} modals\n` +
                               `**Restant à développer :** ${planned.length}`,
                        inline: false
                    }
                ])
                .setFooter({ text: 'Les modals non implémentées affichent un formulaire de feedback automatiquement' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            await errorHandler.logError(ErrorLevels.ERROR, 'Erreur affichage status modals', error);
            await interaction.reply({
                content: '❌ Erreur lors de la récupération du statut des modals.',
                ephemeral: true
            });
        }
    },

    async handleSystemInfo(interaction) {
        try {
            const uptime = process.uptime();
            const uptimeHours = Math.floor(uptime / 3600);
            const uptimeMinutes = Math.floor((uptime % 3600) / 60);
            
            const memoryUsage = process.memoryUsage();
            const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
            
            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('🔧 Informations Système')
                .setDescription('État actuel du bot et de ses composants')
                .addFields([
                    {
                        name: '⏱️ Temps de Fonctionnement',
                        value: `${uptimeHours}h ${uptimeMinutes}m`,
                        inline: true
                    },
                    {
                        name: '💾 Mémoire Utilisée',
                        value: `${memoryMB} MB`,
                        inline: true
                    },
                    {
                        name: '🚀 Version Node.js',
                        value: process.version,
                        inline: true
                    },
                    {
                        name: '📡 Statut Connexions',
                        value: `✅ Discord connecté\n✅ Gestionnaire d'erreurs actif\n✅ Gestionnaire de modals actif`,
                        inline: false
                    },
                    {
                        name: '🛠️ Composants Actifs',
                        value: `• Gestion d'erreurs centralisée\n• Système de logs avancé\n• Gestion automatique des modals\n• Sauvegarde automatique des données`,
                        inline: false
                    }
                ])
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            await errorHandler.logError(ErrorLevels.ERROR, 'Erreur affichage info système', error);
            await interaction.reply({
                content: '❌ Erreur lors de la récupération des informations système.',
                ephemeral: true
            });
        }
    },

    getHealthIndicators(stats) {
        const totalErrors = stats.critical + stats.error;
        const totalWarnings = stats.warning;
        
        let healthStatus = '🟢 Excellent';
        let healthColor = 'Vert';
        
        if (stats.critical > 0) {
            healthStatus = '🔴 Critique';
            healthColor = 'Rouge';
        } else if (totalErrors > 10) {
            healthStatus = '🟠 Attention';
            healthColor = 'Orange';
        } else if (totalWarnings > 20) {
            healthStatus = '🟡 Vigilance';
            healthColor = 'Jaune';
        }
        
        return `**État :** ${healthStatus}\n` +
               `**Niveau :** ${healthColor}\n` +
               `**Erreurs/h :** ${Math.round(totalErrors / 24 * 10) / 10}`;
    }
};