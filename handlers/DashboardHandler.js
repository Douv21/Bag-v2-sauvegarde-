/**
 * Handler dédié au système de dashboard/statistiques
 */

const { EmbedBuilder, ActionRowBuilder } = require('discord.js');

class DashboardHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    /**
     * Afficher le dashboard principal
     */
    async showMainDashboard(interaction) {
        const guildId = interaction.guild.id;
        
        // Charger toutes les données nécessaires
        const [economy, confessions, counting, autothread, shop] = await Promise.all([
            this.dataManager.loadData('economy.json', {}),
            this.dataManager.loadData('confessions.json', {}),
            this.dataManager.loadData('counting.json', {}),
            this.dataManager.loadData('autothread.json', {}),
            this.dataManager.loadData('shop.json', {})
        ]);

        const stats = this.calculateStats(guildId, { economy, confessions, counting, autothread, shop });

        const embed = new EmbedBuilder()
            .setColor('#2c3e50')
            .setTitle('📊 Dashboard du Serveur')
            .setDescription(`Statistiques complètes pour **${interaction.guild.name}**`)
            .addFields([
                { name: '👥 Utilisateurs actifs', value: stats.activeUsers.toString(), inline: true },
                { name: '💰 Économie', value: `${stats.totalBalance.toLocaleString()}€`, inline: true },
                { name: '💭 Confessions', value: stats.totalConfessions.toString(), inline: true },
                { name: '🔢 Comptage', value: `${stats.countingChannels} canaux`, inline: true },
                { name: '🧵 Auto-threads', value: stats.autothreadEnabled ? '✅ Actif' : '❌ Inactif', inline: true },
                { name: '🏪 Articles boutique', value: stats.shopItems.toString(), inline: true }
            ])
            .setFooter({ text: `Dernière mise à jour: ${new Date().toLocaleString('fr-FR')}` })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'dashboard_sections',
                    placeholder: 'Explorer les sections...',
                    options: [
                        {
                            label: '💰 Dashboard Économie',
                            value: 'economy_dashboard',
                            description: 'Statistiques économiques détaillées'
                        },
                        {
                            label: '💭 Dashboard Confessions',
                            value: 'confessions_dashboard',
                            description: 'Analyse des confessions'
                        },
                        {
                            label: '🔢 Dashboard Comptage',
                            value: 'counting_dashboard',
                            description: 'Performance du comptage'
                        },
                        {
                            label: '🧵 Dashboard Auto-Thread',
                            value: 'autothread_dashboard',
                            description: 'Statistiques des threads'
                        },
                        {
                            label: '🏪 Dashboard Boutique',
                            value: 'shop_dashboard',
                            description: 'Analyse des ventes'
                        },
                        {
                            label: '⚙️ Panel d\'Administration',
                            value: 'admin_panel',
                            description: 'Outils d\'administration'
                        }
                    ]
                }
            ]);

        await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    }

    /**
     * Gérer les interactions du dashboard
     */
    async handleDashboardInteraction(interaction) {
        const value = interaction.values[0];

        switch (value) {
            case 'economy_dashboard':
                await this.showEconomyDashboard(interaction);
                break;
            case 'confessions_dashboard':
                await this.showConfessionsDashboard(interaction);
                break;
            case 'counting_dashboard':
                await this.showCountingDashboard(interaction);
                break;
            case 'autothread_dashboard':
                await this.showAutothreadDashboard(interaction);
                break;
            case 'shop_dashboard':
                await this.showShopDashboard(interaction);
                break;
            case 'admin_panel':
                await this.showAdminPanel(interaction);
                break;
            default:
                await interaction.reply({ content: '❌ Section non reconnue', flags: 64 });
        }
    }

    /**
     * Dashboard économie
     */
    async showEconomyDashboard(interaction) {
        const guildId = interaction.guild.id;
        const economy = await this.dataManager.loadData('economy.json', {});
        
        const guildUsers = Object.entries(economy).filter(([key]) => key.endsWith(`_${guildId}`));
        
        const totalBalance = guildUsers.reduce((sum, [, user]) => sum + (user.balance || 0), 0);
        const totalGoodKarma = guildUsers.reduce((sum, [, user]) => sum + (user.goodKarma || 0), 0);
        const totalBadKarma = guildUsers.reduce((sum, [, user]) => sum + (user.badKarma || 0), 0);
        
        // Top 5 plus riches
        const richest = guildUsers
            .sort(([, a], [, b]) => (b.balance || 0) - (a.balance || 0))
            .slice(0, 5)
            .map(([key, user], i) => {
                const userId = key.split('_')[0];
                const member = interaction.guild.members.cache.get(userId);
                return `${i + 1}. ${member?.displayName || 'Utilisateur inconnu'}: ${user.balance?.toLocaleString() || 0}€`;
            });

        const embed = new EmbedBuilder()
            .setColor('#27ae60')
            .setTitle('💰 Dashboard Économique')
            .setDescription('Analyse complète de l\'économie du serveur')
            .addFields([
                { name: '👥 Utilisateurs actifs', value: guildUsers.length.toString(), inline: true },
                { name: '💰 Argent total', value: `${totalBalance.toLocaleString()}€`, inline: true },
                { name: '📊 Moyenne par utilisateur', value: `${Math.round(totalBalance / Math.max(guildUsers.length, 1)).toLocaleString()}€`, inline: true },
                { name: '😇 Karma positif total', value: totalGoodKarma.toString(), inline: true },
                { name: '😈 Karma négatif total', value: totalBadKarma.toString(), inline: true },
                { name: '⚖️ Balance karma', value: (totalGoodKarma - totalBadKarma).toString(), inline: true },
                {
                    name: '🏆 Top 5 Plus Riches',
                    value: richest.length > 0 ? richest.join('\n') : 'Aucune donnée',
                    inline: false
                }
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'economy_dashboard_options',
                    placeholder: 'Options économiques...',
                    options: [
                        {
                            label: '📈 Graphiques Détaillés',
                            value: 'economy_charts',
                            description: 'Visualisations avancées'
                        },
                        {
                            label: '💸 Actions Populaires',
                            value: 'popular_actions',
                            description: 'Analyse des commandes utilisées'
                        },
                        {
                            label: '⚖️ Distribution Karma',
                            value: 'karma_distribution',
                            description: 'Répartition du karma'
                        },
                        {
                            label: '🔙 Retour Dashboard',
                            value: 'back_main_dashboard',
                            description: 'Retour au menu principal'
                        }
                    ]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Dashboard confessions
     */
    async showConfessionsDashboard(interaction) {
        const guildId = interaction.guild.id;
        const confessions = await this.dataManager.loadData('confessions.json', {});
        const logs = await this.dataManager.loadData('confession_logs.json', {});
        
        const guildConfig = confessions[guildId] || {};
        const guildLogs = logs[guildId] || [];

        const embed = new EmbedBuilder()
            .setColor('#8e44ad')
            .setTitle('💭 Dashboard Confessions')
            .setDescription('Analyse du système de confessions anonymes')
            .addFields([
                { name: '📝 Canaux configurés', value: (guildConfig.channels?.length || 0).toString(), inline: true },
                { name: '💭 Confessions totales', value: guildLogs.length.toString(), inline: true },
                { name: '📊 Moyenne par jour', value: Math.round(guildLogs.length / Math.max(1, this.getDaysSinceFirstConfession(guildLogs))).toString(), inline: true },
                { name: '🖼️ Avec images', value: guildLogs.filter(log => log.hasImage).length.toString(), inline: true },
                { name: '📝 Texte seulement', value: guildLogs.filter(log => !log.hasImage).length.toString(), inline: true },
                { name: '📅 Dernière confession', value: guildLogs.length > 0 ? new Date(guildLogs[guildLogs.length - 1].timestamp).toLocaleDateString('fr-FR') : 'Jamais', inline: true }
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'confessions_dashboard_options',
                    placeholder: 'Options confessions...',
                    options: [
                        {
                            label: '📊 Tendances Temporelles',
                            value: 'confession_trends',
                            description: 'Analyse par période'
                        },
                        {
                            label: '📋 Logs Récents',
                            value: 'recent_logs',
                            description: '10 dernières confessions'
                        },
                        {
                            label: '🧵 Performance Threads',
                            value: 'threads_performance',
                            description: 'Statistiques des threads'
                        },
                        {
                            label: '🔙 Retour Dashboard',
                            value: 'back_main_dashboard',
                            description: 'Retour au menu principal'
                        }
                    ]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Dashboard comptage
     */
    async showCountingDashboard(interaction) {
        const guildId = interaction.guild.id;
        const counting = await this.dataManager.loadData('counting.json', {});
        const guildConfig = counting[guildId] || { channels: [] };

        const totalChannels = guildConfig.channels.length;
        const activeChannels = guildConfig.channels.filter(ch => ch.enabled).length;
        const totalCounts = guildConfig.channels.reduce((sum, ch) => sum + (ch.totalCounts || 0), 0);
        const maxRecord = Math.max(...guildConfig.channels.map(ch => ch.record || 0), 0);

        // Top 3 canaux par record
        const topChannels = guildConfig.channels
            .sort((a, b) => (b.record || 0) - (a.record || 0))
            .slice(0, 3)
            .map((ch, i) => {
                const channel = interaction.guild.channels.cache.get(ch.channelId);
                const medal = ['🥇', '🥈', '🥉'][i];
                return `${medal} <#${ch.channelId}>: ${ch.record || 0}`;
            });

        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('🔢 Dashboard Comptage')
            .setDescription('Performance du système de comptage mathématique')
            .addFields([
                { name: '📝 Canaux total', value: totalChannels.toString(), inline: true },
                { name: '✅ Canaux actifs', value: activeChannels.toString(), inline: true },
                { name: '🔢 Comptes total', value: totalCounts.toString(), inline: true },
                { name: '🏆 Record maximum', value: maxRecord.toString(), inline: true },
                { name: '📈 Moyenne par canal', value: Math.round(totalCounts / Math.max(totalChannels, 1)).toString(), inline: true },
                { name: '🎯 Canaux fonctionnels', value: `${activeChannels}/${totalChannels}`, inline: true },
                {
                    name: '🏆 Top 3 Records',
                    value: topChannels.length > 0 ? topChannels.join('\n') : 'Aucun record',
                    inline: false
                }
            ]);

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'counting_dashboard_options',
                    placeholder: 'Options comptage...',
                    options: [
                        {
                            label: '📊 Performance Détaillée',
                            value: 'counting_performance',
                            description: 'Analyse par canal'
                        },
                        {
                            label: '🧮 Types de Calculs',
                            value: 'calculation_types',
                            description: 'Répartition des opérations'
                        },
                        {
                            label: '⏰ Historique Records',
                            value: 'records_history',
                            description: 'Évolution des records'
                        },
                        {
                            label: '🔙 Retour Dashboard',
                            value: 'back_main_dashboard',
                            description: 'Retour au menu principal'
                        }
                    ]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Panel d'administration
     */
    async showAdminPanel(interaction) {
        if (!interaction.member.permissions.has('ADMINISTRATOR') && !interaction.member.permissions.has('MANAGE_GUILD')) {
            await interaction.update({ 
                content: '❌ Accès refusé. Permissions administrateur requises.', 
                embeds: [], 
                components: [] 
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('⚙️ Panel d\'Administration')
            .setDescription('Outils d\'administration avancés')
            .addFields([
                { name: '💾 Sauvegardes', value: 'Gestion des sauvegardes système', inline: true },
                { name: '🔄 Maintenance', value: 'Outils de maintenance', inline: true },
                { name: '📊 Monitoring', value: 'Surveillance système', inline: true },
                { name: '🧹 Nettoyage', value: 'Suppression de données obsolètes', inline: true },
                { name: '📤 Export/Import', value: 'Gestion des données', inline: true },
                { name: '🔧 Configuration', value: 'Paramètres système', inline: true }
            ])
            .setFooter({ text: '⚠️ Actions réservées aux administrateurs' });

        const row = new ActionRowBuilder()
            .addComponents([
                {
                    type: 3,
                    customId: 'admin_panel_options',
                    placeholder: 'Outils d\'administration...',
                    options: [
                        {
                            label: '💾 Créer Sauvegarde',
                            value: 'create_backup',
                            description: 'Sauvegarder toutes les données'
                        },
                        {
                            label: '🔄 Maintenance Système',
                            value: 'system_maintenance',
                            description: 'Nettoyage et optimisation'
                        },
                        {
                            label: '📊 Monitoring Santé',
                            value: 'health_monitoring',
                            description: 'État des systèmes'
                        },
                        {
                            label: '🧹 Nettoyage Données',
                            value: 'data_cleanup',
                            description: 'Supprimer données obsolètes'
                        },
                        {
                            label: '📤 Export Complet',
                            value: 'full_export',
                            description: 'Exporter toutes les données'
                        },
                        {
                            label: '🔙 Retour Dashboard',
                            value: 'back_main_dashboard',
                            description: 'Retour au menu principal'
                        }
                    ]
                }
            ]);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Calculer les statistiques principales
     */
    calculateStats(guildId, data) {
        const { economy, confessions, counting, autothread, shop } = data;

        // Utilisateurs actifs (ayant de l'économie)
        const guildUsers = Object.entries(economy).filter(([key]) => key.endsWith(`_${guildId}`));
        const activeUsers = guildUsers.length;

        // Balance totale
        const totalBalance = guildUsers.reduce((sum, [, user]) => sum + (user.balance || 0), 0);

        // Confessions
        const confessionLogs = confessions[guildId]?.logs || [];
        const totalConfessions = confessionLogs.length;

        // Comptage
        const countingChannels = counting[guildId]?.channels?.length || 0;

        // Auto-thread
        const autothreadEnabled = autothread[guildId]?.enabled || false;

        // Boutique
        const shopItems = shop[guildId]?.length || 0;

        return {
            activeUsers,
            totalBalance,
            totalConfessions,
            countingChannels,
            autothreadEnabled,
            shopItems
        };
    }

    /**
     * Calculer le nombre de jours depuis la première confession
     */
    getDaysSinceFirstConfession(logs) {
        if (logs.length === 0) return 1;
        
        const firstLog = logs[0];
        const firstDate = new Date(firstLog.timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - firstDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return Math.max(diffDays, 1);
    }
}

module.exports = DashboardHandler;