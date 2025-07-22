// Script pour restaurer les handlers depuis les backups
const fs = require('fs');
const path = require('path');

const backedUpHandlers = [
    { src: '../bag-bot-v2-SOUS-MENUS-FINAL-COMPLET/handlers/CountingConfigHandler.js', dest: './handlers/CountingConfigHandler.js' },
    { src: '../bag-bot-v2-SOUS-MENUS-FINAL-COMPLET/handlers/ConfessionConfigHandler.js', dest: './handlers/ConfessionConfigHandler.js' },
    { src: '../bag-bot-v2-SOUS-MENUS-FINAL-COMPLET/handlers/AutoThreadConfigHandler.js', dest: './handlers/AutoThreadConfigHandler.js' },
    { src: '../bag-bot-v2-SOUS-MENUS-FINAL-COMPLET/handlers/EconomyConfigHandler.js', dest: './handlers/EconomyConfigHandler.js' }
];

// Extraire l'archive et copier les fichiers
const { exec } = require('child_process');

exec('cd .. && tar -xzf bag-bot-v2-SOUS-MENUS-FINAL-COMPLET.tar.gz -C /tmp/restore_handlers', (error) => {
    if (error) {
        console.log('Copie manuelle des handlers...');
        
        // Correction manuelle pour CountingConfigHandler
        const correctHandler = `/**
 * Handler dédié à la configuration du système de comptage
 */

const { EmbedBuilder, ChannelSelectMenuBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

class CountingConfigHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    async showMainConfigMenu(interaction) {
        const guildId = interaction.guild.id;
        const config = await this.dataManager.loadData('counting.json', {});
        const guildConfig = config[guildId] || { channels: [] };

        const activeChannels = guildConfig.channels?.filter(ch => ch.enabled) || [];

        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('🔢 Configuration du Comptage')
            .setDescription('Système de comptage mathématique avec calculs et records')
            .addFields([
                { 
                    name: '📊 Canaux actifs', 
                    value: \`\${activeChannels.length} canal(aux)\`, 
                    inline: true 
                },
                { 
                    name: '🏆 Records total', 
                    value: \`\${guildConfig.channels?.reduce((sum, ch) => sum + (ch.record || 0), 0) || 0}\`, 
                    inline: true 
                },
                { 
                    name: '🔢 Calculs supportés', 
                    value: 'Addition, soustraction, multiplication, division', 
                    inline: false 
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('counting_config_main')
            .setPlaceholder('Choisissez une option...')
            .addOptions([
                {
                    label: '📝 Gérer les Canaux',
                    value: 'manage_channels',
                    description: 'Ajouter/configurer canaux de comptage'
                },
                {
                    label: '⚙️ Paramètres Globaux',
                    value: 'global_settings',
                    description: 'Configuration générale du système'
                },
                {
                    label: '🏆 Gestion des Records',
                    value: 'records_management',
                    description: 'Voir et gérer les records'
                },
                {
                    label: '📊 Statistiques',
                    value: 'counting_stats',
                    description: 'Données et performances'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    }

    async handleMainMenu(interaction) {
        const value = interaction.values[0];
        switch (value) {
            case 'manage_channels':
                await this.showChannelsManagement(interaction);
                break;
            case 'global_settings':
                await this.showGlobalSettings(interaction);
                break;
            case 'records_management':
                await this.showRecordsManagement(interaction);
                break;
            case 'counting_stats':
                await this.showCountingStats(interaction);
                break;
            default:
                await interaction.reply({ content: '❌ Option non reconnue', flags: 64 });
        }
    }

    async handleGlobalOptions(interaction) {
        return await this.showGlobalSettings(interaction);
    }

    async showChannelsManagement(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('📝 Gestion des Canaux de Comptage')
            .setDescription('Configuration des canaux actifs')
            .addFields([{ name: '🚧 En développement', value: 'Cette section sera bientôt disponible', inline: false }]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('counting_channels_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔄 Retour Menu Principal', value: 'back_main', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showGlobalSettings(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('⚙️ Paramètres Globaux')
            .setDescription('Configuration générale du comptage')
            .addFields([{ name: '🚧 En développement', value: 'Cette section sera bientôt disponible', inline: false }]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('counting_global_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔄 Retour Menu Principal', value: 'back_main', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showRecordsManagement(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('🏆 Gestion des Records')
            .setDescription('Records et statistiques de comptage')
            .addFields([{ name: '🚧 En développement', value: 'Cette section sera bientôt disponible', inline: false }]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('counting_records_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔄 Retour Menu Principal', value: 'back_main', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }

    async showCountingStats(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('📊 Statistiques Comptage')
            .setDescription('Données de performance')
            .addFields([{ name: '🚧 En développement', value: 'Cette section sera bientôt disponible', inline: false }]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('counting_stats_back')
            .setPlaceholder('Actions...')
            .addOptions([
                { label: '🔄 Retour Menu Principal', value: 'back_main', description: 'Retour au menu principal' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }
}

module.exports = CountingConfigHandler;`;

        fs.writeFileSync('./handlers/CountingConfigHandler.js', correctHandler);
        console.log('✅ CountingConfigHandler restauré');
    }
});

console.log('Restauration des handlers...');