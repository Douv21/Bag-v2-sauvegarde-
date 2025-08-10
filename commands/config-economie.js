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
                .setTitle('💋 Configuration du Jeu Coquin')
                .setDescription('Le jeu des boys & girls - Comptez ensemble et atteignez des sommets! 🔥')
                .addFields([
                    { name: '🎯 Actions Sexy', value: 'Configurer les actions standard (travailler, pecher, voler, crime, donner) et NSFW', inline: true },
                    { name: '🏪 Boutique Coquine', value: 'Objets personnalisés, rôles, remises karma', inline: true },
                    { name: '📅 Daily/Quotidien', value: 'Configuration des récompenses quotidiennes', inline: true },
                    { name: '💬 Messages', value: 'Configuration des gains par message', inline: true },
                    { name: '⚖️ Karma', value: 'Système karma et récompenses automatiques', inline: true }
                ]);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('economy_main_config')
                .setPlaceholder('🔧 Choisissez une section...')
                .addOptions([
                    {
                        label: '🎯 Actions Sexy',
                        value: 'actions',
                        description: 'Configurer travailler, pecher, voler, crime, donner et NSFW'
                    },
                    {
                        label: '🏪 Boutique Coquine',
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