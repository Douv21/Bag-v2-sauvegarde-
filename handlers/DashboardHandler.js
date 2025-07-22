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
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('💭 Dashboard Confessions')
            .setDescription('Statistiques système des confessions (À développer)')
            .addFields([
                { name: '🚧 En développement', value: 'Cette section sera bientôt disponible', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('confessions_dashboard_options')
            .setPlaceholder('Actions disponibles...')
            .addOptions([
                { label: '🔄 Retour Dashboard', value: 'back_main_dashboard', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Dashboard comptage
     */
    async showCountingDashboard(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('🔢 Dashboard Comptage')
            .setDescription('Statistiques système de comptage (À développer)')
            .addFields([
                { name: '🚧 En développement', value: 'Cette section sera bientôt disponible', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('counting_dashboard_options')
            .setPlaceholder('Actions disponibles...')
            .addOptions([
                { label: '🔄 Retour Dashboard', value: 'back_main_dashboard', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Dashboard auto-thread
     */
    async showAutothreadDashboard(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('🧵 Dashboard Auto-Thread')
            .setDescription('Statistiques auto-thread (À développer)')
            .addFields([
                { name: '🚧 En développement', value: 'Cette section sera bientôt disponible', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('autothread_dashboard_options')
            .setPlaceholder('Actions disponibles...')
            .addOptions([
                { label: '🔄 Retour Dashboard', value: 'back_main_dashboard', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    /**
     * Dashboard boutique
     */
    async showShopDashboard(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle('🏪 Dashboard Boutique')
            .setDescription('Statistiques boutique (À développer)')
            .addFields([
                { name: '🚧 En développement', value: 'Cette section sera bientôt disponible', inline: false }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('shop_dashboard_options')
            .setPlaceholder('Actions disponibles...')
            .addOptions([
                { label: '🔄 Retour Dashboard', value: 'back_main_dashboard', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.update({ embeds: [embed], components: [row] });
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
        const economyUsers = Object.keys(economy);
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
}

module.exports = DashboardHandler;