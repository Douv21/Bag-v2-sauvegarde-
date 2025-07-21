
const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-confession')
        .setDescription('Configuration des confessions (Admin uniquement)')
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
};