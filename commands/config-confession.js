const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-confession')
        .setDescription('🛠️ Configuration avancée du système de confessions'),

    async execute(interaction) {
        // Vérifier les permissions
        if (!interaction.member.permissions.has('Administrator')) {
            return await interaction.reply({
                content: '❌ Vous devez être administrateur pour utiliser cette commande.',
                flags: 64
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle('🛠️ Configuration Confessions Avancée')
            .setDescription('Configurez tous les paramètres du système de confessions')
            .addFields(
                { name: '📝 Canaux', value: 'Gérer les canaux de confession', inline: true },
                { name: '📊 Logs Admin', value: 'Configuration des logs détaillés', inline: true },
                { name: '🧵 Auto-Thread', value: 'Gestion des fils automatiques', inline: true }
            );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('config_main_menu')
            .setPlaceholder('🛠️ Choisir une section à configurer')
            .addOptions([
                {
                    label: 'Canaux de Confession',
                    description: 'Ajouter/retirer des canaux',
                    value: 'channels',
                    emoji: '📝'
                },
                {
                    label: 'Logs Administrateur',
                    description: 'Configuration des logs détaillés',
                    value: 'logs',
                    emoji: '📊'
                },
                {
                    label: 'Auto-Thread Confessions',
                    description: 'Fils automatiques pour confessions',
                    value: 'autothread',
                    emoji: '🧵'
                }
            ]);

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        await interaction.reply({
            embeds: [embed],
            components: components,
            flags: 64
        });
    }
};