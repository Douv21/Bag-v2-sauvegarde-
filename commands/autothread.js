const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autothread')
        .setDescription('Configuration du système auto-thread global (Admin uniquement)')
        .setDefaultMemberPermissions('0'),

    async execute(interaction, dataManager) {
        try {
            await this.showAutoThreadConfig(interaction, dataManager);
        } catch (error) {
            console.error('❌ Erreur autothread:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de la configuration auto-thread.',
                flags: 64
            });
        }
    },

    async showAutoThreadConfig(interaction, dataManager) {
        const config = await dataManager.getData('config');
        const guildId = interaction.guild.id;
        const autoThreadConfig = config.autoThread?.[guildId] || {
            enabled: false,
            channels: [],
            threadName: 'Discussion - {user}',
            archiveTime: 60,
            slowMode: 0
        };

        // Afficher la vraie information des canaux configurés
        let channelsDisplay = '0';
        if (autoThreadConfig.channels && autoThreadConfig.channels.length > 0) {
            channelsDisplay = autoThreadConfig.channels.length.toString();
        }

        const embed = new EmbedBuilder()
            .setColor('#7289da')
            .setTitle('🧵 Configuration Auto-Thread Global')
            .setDescription('Configurez le système de création automatique de threads pour tous les messages')
            .addFields([
                {
                    name: '📊 Statut',
                    value: autoThreadConfig.enabled ? '🟢 Activé' : '🔴 Désactivé',
                    inline: true
                },
                {
                    name: '📱 Canaux Configurés',
                    value: channelsDisplay,
                    inline: true
                },
                {
                    name: '🏷️ Nom des Threads',
                    value: `\`${autoThreadConfig.threadName}\``,
                    inline: true
                },
                {
                    name: '📦 Archive Automatique',
                    value: `${autoThreadConfig.archiveTime} minutes`,
                    inline: true
                },
                {
                    name: '⏱️ Mode Lent',
                    value: autoThreadConfig.slowMode > 0 ? `${autoThreadConfig.slowMode} secondes` : 'Désactivé',
                    inline: true
                },
                {
                    name: '💡 Fonctionnement',
                    value: 'Un thread sera créé automatiquement pour chaque nouveau message dans les canaux configurés',
                    inline: false
                }
            ]);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('autothread_config')
            .setPlaceholder('🧵 Configurer l\'auto-thread')
            .addOptions([
                {
                    label: 'Activer/Désactiver',
                    description: 'Activer ou désactiver le système auto-thread',
                    value: 'toggle',
                    emoji: autoThreadConfig.enabled ? '🔴' : '🟢'
                },
                {
                    label: 'Gérer les Canaux',
                    description: 'Ajouter ou retirer des canaux',
                    value: 'channels',
                    emoji: '📱'
                },
                {
                    label: 'Nom des Threads',
                    description: 'Personnaliser le nom des threads créés',
                    value: 'name',
                    emoji: '🏷️'
                },
                {
                    label: 'Archive Automatique',
                    description: 'Définir le temps avant archivage',
                    value: 'archive',
                    emoji: '📦'
                },
                {
                    label: 'Mode Lent',
                    description: 'Configurer le délai entre messages',
                    value: 'slowmode',
                    emoji: '⏱️'
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
};