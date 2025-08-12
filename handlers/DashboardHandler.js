/**
 * Handler dédié au système de dashboard/statistiques
 */

const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

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

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('dashboard_sections')
            .setPlaceholder('Explorer les sections...')
            .addOptions([
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
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
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
        
        const guildUsers = Object.keys(economy).filter(userId => 
            interaction.guild.members.cache.has(userId)
        );

        const stats = this.calculateEconomyStats(guildUsers, economy);

        const embed = new EmbedBuilder()
            .setColor('#27ae60')
            .setTitle('💰 Dashboard Économie')
            .setDescription('Statistiques détaillées du système économique')
            .addFields([
                { name: '📊 Statistiques générales', value: `**${stats.totalUsers}** utilisateurs actifs\n**${stats.totalBalance.toLocaleString()}€** en circulation\n**${Math.round(stats.averageBalance)}€** moyenne par utilisateur`, inline: false },
                { name: '😇 Karma Positif', value: `**${stats.totalGoodKarma}** points\nMoyenne: **${Math.round(stats.avgGoodKarma)}**`, inline: true },
                { name: '😈 Karma Négatif', value: `**${stats.totalBadKarma}** points\nMoyenne: **${Math.round(stats.avgBadKarma)}**`, inline: true },
                { name: '🔥 Daily Streaks', value: `Streak max: **${stats.maxStreak}** jours\nStreak moyen: **${Math.round(stats.avgStreak)}** jours`, inline: true }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('economy_dashboard_options')
            .setPlaceholder('Actions disponibles...')
            .addOptions([
                { label: '📈 Top Richesse', value: 'top_balance', description: 'Classement par argent' },
                { label: '😇 Top Karma Positif', value: 'top_good_karma', description: 'Meilleurs karma positifs' },
                { label: '😈 Top Karma Négatif', value: 'top_bad_karma', description: 'Pires karma négatifs' },
                { label: '🔥 Top Streaks', value: 'top_streaks', description: 'Meilleures séries daily' },
                { label: '🔄 Retour Dashboard', value: 'back_main_dashboard', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Dashboard confessions
     */
    async showConfessionsDashboard(interaction) {
        try {
            const stats = this.calculateStats(interaction.guild.id, this.dataManager.data);
            const confessionStats = await this.getConfessionStats(interaction.guild.id);
            
            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('💭 Dashboard Confessions')
                .setDescription('Statistiques système des confessions')
                .addFields([
                    { 
                        name: '📊 Statistiques Générales', 
                        value: `💭 **${stats.totalConfessions}** confessions totales\n📈 **${confessionStats.avgConfessions || 0}** moy/jour\n📅 **${confessionStats.weekConfessions || 0}** cette semaine`, 
                        inline: true 
                    },
                    { 
                        name: '⚙️ Configuration', 
                        value: `📺 Canal: ${confessionStats.channelId ? `<#${confessionStats.channelId}>` : '❌ Non défini'}\n🛡️ Modération: ${confessionStats.moderationEnabled ? '✅ Activée' : '❌ Désactivée'}\n🗑️ Auto-suppression: ${confessionStats.autoDelete ? '✅ Activée' : '❌ Désactivée'}`, 
                        inline: true 
                    },
                    { 
                        name: '📝 Paramètres', 
                        value: `📏 Longueur min: **${confessionStats.minLength || 10}** caractères\n📏 Longueur max: **${confessionStats.maxLength || 2000}** caractères\n⏰ En attente: **${confessionStats.pendingCount || 0}** confessions`, 
                        inline: true 
                    }
                ]);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('confessions_dashboard_options')
                .setPlaceholder('Actions disponibles...')
                .addOptions([
                    { label: '⚙️ Configuration', value: 'confessions_config', description: 'Configurer le système' },
                    { label: '📊 Statistiques', value: 'confessions_stats', description: 'Voir les statistiques détaillées' },
                    { label: '🔄 Retour Dashboard', value: 'back_main_dashboard', description: 'Retour au menu principal' }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.update({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error('Erreur showConfessionsDashboard:', error);
            await interaction.update({
                content: '❌ Erreur lors du chargement des statistiques des confessions.',
                embeds: [],
                components: []
            });
        }
    }

    /**
     * Dashboard comptage
     */
    async showCountingDashboard(interaction) {
        try {
            const countingManager = require('../utils/countingManager');
            const countingStats = countingManager.getCountingStats(interaction.guild.id);
            
            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('🔢 Dashboard Comptage')
                .setDescription('Statistiques système de comptage')
                .addFields([
                    { 
                        name: '📊 Canaux Configurés', 
                        value: `🔢 **${countingStats.totalChannels}** canaux de comptage\n🧮 Math: ${countingStats.mathEnabled ? '✅ Activé' : '❌ Désactivé'}\n😀 Réactions: ${countingStats.reactionsEnabled ? '✅ Activées' : '❌ Désactivées'}`, 
                        inline: true 
                    },
                    { 
                        name: '📈 Statistiques Actives', 
                        value: countingStats.channels.length > 0 ? 
                            countingStats.channels.map(c => 
                                `📺 <#${c.channelId}>: **${c.currentNumber}** (dernier: <@${c.lastUserId}>)`
                            ).join('\n').substring(0, 1024) : 
                            'Aucun canal actif', 
                        inline: false 
                    }
                ]);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('counting_dashboard_options')
                .setPlaceholder('Actions disponibles...')
                .addOptions([
                    { label: '⚙️ Configuration', value: 'counting_config', description: 'Configurer le système' },
                    { label: '📊 Statistiques', value: 'counting_stats', description: 'Voir les statistiques détaillées' },
                    { label: '🔄 Retour Dashboard', value: 'back_main_dashboard', description: 'Retour au menu principal' }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.update({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error('Erreur showCountingDashboard:', error);
            await interaction.update({
                content: '❌ Erreur lors du chargement des statistiques de comptage.',
                embeds: [],
                components: []
            });
        }
    }

    /**
     * Dashboard auto-thread
     */
    async showAutothreadDashboard(interaction) {
        try {
            const autothreadStats = await this.getAutothreadStats(interaction.guild.id);
            
            const embed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setTitle('🧵 Dashboard Auto-Thread')
                .setDescription('Statistiques auto-thread')
                .addFields([
                    { 
                        name: '📊 Statistiques Générales', 
                        value: `🧵 **${autothreadStats.totalThreads || 0}** threads créés\n📈 **${autothreadStats.activeThreads || 0}** threads actifs\n📅 **${autothreadStats.weekThreads || 0}** cette semaine`, 
                        inline: true 
                    },
                    { 
                        name: '⚙️ Configuration', 
                        value: `📺 Canaux configurés: **${autothreadStats.configuredChannels || 0}**\n🔄 Auto-archivage: ${autothreadStats.autoArchive ? '✅ Activé' : '❌ Désactivé'}\n⏰ Délai: **${autothreadStats.archiveDelay || 60}** minutes`, 
                        inline: true 
                    }
                ]);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('autothread_dashboard_options')
                .setPlaceholder('Actions disponibles...')
                .addOptions([
                    { label: '⚙️ Configuration', value: 'autothread_config', description: 'Configurer le système' },
                    { label: '📊 Statistiques', value: 'autothread_stats', description: 'Voir les statistiques détaillées' },
                    { label: '🔄 Retour Dashboard', value: 'back_main_dashboard', description: 'Retour au menu principal' }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.update({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error('Erreur showAutothreadDashboard:', error);
            await interaction.update({
                content: '❌ Erreur lors du chargement des statistiques auto-thread.',
                embeds: [],
                components: []
            });
        }
    }

    /**
     * Dashboard boutique
     */
    async showShopDashboard(interaction) {
        try {
            const shopStats = await this.getShopStats(interaction.guild.id);
            
            const embed = new EmbedBuilder()
                .setColor('#e67e22')
                .setTitle('🏪 Dashboard Boutique')
                .setDescription('Statistiques boutique')
                .addFields([
                    { 
                        name: '📊 Statistiques Générales', 
                        value: `🛒 **${shopStats.totalItems || 0}** articles disponibles\n💰 **${shopStats.totalSales || 0}** ventes totales\n📈 **${shopStats.weekSales || 0}** ventes cette semaine`, 
                        inline: true 
                    },
                    { 
                        name: '💎 Articles Populaires', 
                        value: shopStats.popularItems && shopStats.popularItems.length > 0 ? 
                            shopStats.popularItems.slice(0, 3).map(item => 
                                `🏆 **${item.name}**: ${item.sales} ventes`
                            ).join('\n') : 
                            'Aucun article vendu', 
                        inline: true 
                    },
                    { 
                        name: '⚙️ Configuration', 
                        value: `📺 Canal boutique: ${shopStats.shopChannel ? `<#${shopStats.shopChannel}>` : '❌ Non défini'}\n💰 Devise: **${shopStats.currency || '💰'}**\n📊 Taxes: **${shopStats.taxRate || 0}%**`, 
                        inline: true 
                    }
                ]);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('shop_dashboard_options')
                .setPlaceholder('Actions disponibles...')
                .addOptions([
                    { label: '⚙️ Configuration', value: 'shop_config', description: 'Configurer la boutique' },
                    { label: '📊 Statistiques', value: 'shop_stats', description: 'Voir les statistiques détaillées' },
                    { label: '🔄 Retour Dashboard', value: 'back_main_dashboard', description: 'Retour au menu principal' }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.update({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error('Erreur showShopDashboard:', error);
            await interaction.update({
                content: '❌ Erreur lors du chargement des statistiques de la boutique.',
                embeds: [],
                components: []
            });
        }
    }

    /**
     * Panel admin
     */
    async showAdminPanel(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#34495e')
            .setTitle('⚙️ Panel d\'Administration')
            .setDescription('Outils d\'administration avancés')
            .addFields([
                { name: '🔧 Outils disponibles', value: 'Gestion centralisée du bot', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('admin_panel_options')
            .setPlaceholder('Outils admin...')
            .addOptions([
                { label: '💾 Sauvegarde Générale', value: 'backup_all', description: 'Sauvegarder toutes les données' },
                { label: '🔄 Reset Économie', value: 'reset_economy', description: 'DANGER: Tout remettre à zéro' },
                { label: '📊 Rapport Complet', value: 'full_report', description: 'Générer rapport détaillé' },
                { label: '🔄 Retour Dashboard', value: 'back_main_dashboard', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Calculer les statistiques principales
     */
    calculateStats(guildId, data) {
        const { economy, confessions, counting, autothread, shop } = data;
        
        // Statistiques économie
        const economyUsers = Object.keys(economy).filter(userId => 
            interaction.guild.members.cache.has(userId)
        );
        const totalBalance = economyUsers.reduce((sum, userId) => sum + (economy[userId]?.balance || 0), 0);
        
        // Statistiques confessions
        const guildConfessions = confessions[guildId] || {};
        const totalConfessions = guildConfessions.total || 0;
        
        // Statistiques comptage
        const guildCounting = counting[guildId] || {};
        const countingChannels = (guildCounting.channels || []).length;
        
        // Statistiques auto-thread
        const guildAutothread = autothread[guildId] || {};
        const autothreadEnabled = guildAutothread.enabled || false;
        
        // Statistiques boutique
        const guildShop = shop[guildId] || [];
        const shopItems = guildShop.length;

        return {
            activeUsers: economyUsers.length,
            totalBalance,
            totalConfessions,
            countingChannels,
            autothreadEnabled,
            shopItems
        };
    }

    /**
     * Calculer les statistiques économiques détaillées
     */
    calculateEconomyStats(guildUsers, economy) {
        const users = guildUsers.map(userId => economy[userId] || {});
        
        const totalUsers = users.length;
        const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);
        const averageBalance = totalBalance / Math.max(totalUsers, 1);
        
        const totalGoodKarma = users.reduce((sum, user) => sum + (user.goodKarma || 0), 0);
        const totalBadKarma = users.reduce((sum, user) => sum + (user.badKarma || 0), 0);
        const avgGoodKarma = totalGoodKarma / Math.max(totalUsers, 1);
        const avgBadKarma = totalBadKarma / Math.max(totalUsers, 1);
        
        const streaks = users.map(user => user.dailyStreak || 0);
        const maxStreak = Math.max(...streaks, 0);
        const avgStreak = streaks.reduce((sum, streak) => sum + streak, 0) / Math.max(totalUsers, 1);

        return {
            totalUsers,
            totalBalance,
            averageBalance,
            totalGoodKarma,
            totalBadKarma,
            avgGoodKarma,
            avgBadKarma,
            maxStreak,
            avgStreak
        };
    }

    // Méthodes utilitaires pour récupérer les statistiques
    async getConfessionStats(guildId) {
        try {
            // Récupérer les statistiques des confessions depuis le dataManager
            const guildData = this.dataManager.data[guildId];
            if (!guildData || !guildData.confessions) {
                return {
                    totalConfessions: 0,
                    avgConfessions: 0,
                    weekConfessions: 0,
                    channelId: null,
                    moderationEnabled: false,
                    autoDelete: false,
                    minLength: 10,
                    maxLength: 2000,
                    pendingCount: 0
                };
            }

            return {
                totalConfessions: guildData.confessions.length || 0,
                avgConfessions: guildData.confessions.length > 0 ? (guildData.confessions.length / 7).toFixed(1) : 0,
                weekConfessions: Math.floor(guildData.confessions.length * 0.1),
                channelId: guildData.confessionConfig?.channelId || null,
                moderationEnabled: guildData.confessionConfig?.moderationEnabled || false,
                autoDelete: guildData.confessionConfig?.autoDelete || false,
                minLength: guildData.confessionConfig?.minLength || 10,
                maxLength: guildData.confessionConfig?.maxLength || 2000,
                pendingCount: guildData.confessions.filter(c => c.status === 'pending').length || 0
            };
        } catch (error) {
            console.error('Erreur getConfessionStats:', error);
            return {
                totalConfessions: 0,
                avgConfessions: 0,
                weekConfessions: 0,
                channelId: null,
                moderationEnabled: false,
                autoDelete: false,
                minLength: 10,
                maxLength: 2000,
                pendingCount: 0
            };
        }
    }

    async getAutothreadStats(guildId) {
        try {
            // Statistiques auto-thread (à implémenter selon votre système)
            return {
                totalThreads: 0,
                activeThreads: 0,
                weekThreads: 0,
                configuredChannels: 0,
                autoArchive: false,
                archiveDelay: 60
            };
        } catch (error) {
            console.error('Erreur getAutothreadStats:', error);
            return {
                totalThreads: 0,
                activeThreads: 0,
                weekThreads: 0,
                configuredChannels: 0,
                autoArchive: false,
                archiveDelay: 60
            };
        }
    }

    async getShopStats(guildId) {
        try {
            // Statistiques boutique (à implémenter selon votre système)
            return {
                totalItems: 0,
                totalSales: 0,
                weekSales: 0,
                popularItems: [],
                shopChannel: null,
                currency: '💰',
                taxRate: 0
            };
        } catch (error) {
            console.error('Erreur getShopStats:', error);
            return {
                totalItems: 0,
                totalSales: 0,
                weekSales: 0,
                popularItems: [],
                shopChannel: null,
                currency: '💰',
                taxRate: 0
            };
        }
    }
}

module.exports = DashboardHandler;