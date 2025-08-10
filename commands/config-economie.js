const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-economie')
        .setDescription('Configuration complète du système économique (Admin uniquement)')
        .setDefaultMemberPermissions('0'),

    async execute(interaction, dataManager) {
        // Vérifier les permissions
        if (!interaction.member.permissions.has('Administrator')) {
            return await interaction.reply({
                content: '❌ Vous devez être administrateur pour utiliser cette commande.',
                flags: 64
            });
        }

        try {
            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('💰 Configuration Économie')
                .setDescription('Paramétrez les actions, la boutique, le daily, les messages et le karma.')
                .addFields([
                    { name: '🎯 Actions', value: 'Configurer travailler, pêcher, voler, crime, donner, parier', inline: true },
                    { name: '🏪 Boutique', value: 'Objets personnalisés, rôles, remises karma', inline: true },
                    { name: '📅 Daily/Quotidien', value: 'Configuration des récompenses quotidiennes', inline: true },
                    { name: '💬 Messages', value: 'Configuration des gains par message', inline: true },
                    { name: '⚖️ Karma', value: 'Système karma et récompenses automatiques', inline: true }
                ]);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('economy_main_config')
                .setPlaceholder('🔧 Choisissez une section...')
                .addOptions([
                    {
                        label: '🎯 Actions',
                        value: 'actions',
                        description: 'Configurer travailler, pêcher, voler, crime, donner, parier'
                    },
                    {
                        label: '🏪 Boutique',
                        value: 'boutique',
                        description: 'Objets, rôles temporaires/permanents, remises karma'
                    },
                    {
                        label: '📅 Daily/Quotidien',
                        value: 'daily',
                        description: 'Configuration des récompenses quotidiennes'
                    },
                    {
                        label: '💬 Messages',
                        value: 'messages',
                        description: 'Configuration des gains par message'
                    },
                    {
                        label: '⚖️ Karma',
                        value: 'karma',
                        description: 'Système karma et récompenses automatiques'
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({ 
                embeds: [embed], 
                components: [row], 
                flags: 64 
            });
            
        } catch (error) {
            console.error('Erreur config-economie:', error);
            await interaction.reply({
                content: '❌ Erreur lors de l\'affichage de la configuration.',
                flags: 64
            });
        }
    }
};