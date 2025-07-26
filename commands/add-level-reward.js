const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const levelManager = require('../utils/levelManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-level-reward')
        .setDescription('Ajouter une récompense de rôle pour un niveau (Admin uniquement)')
        .addIntegerOption(option =>
            option.setName('niveau')
                .setDescription('Niveau pour lequel attribuer la récompense')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Rôle à attribuer quand ce niveau est atteint')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: 64 }); // Ephemeral
            
            const level = interaction.options.getInteger('niveau');
            const role = interaction.options.getRole('role');
            
            const config = levelManager.loadConfig();
            
            // Initialiser roleRewards si inexistant
            if (!config.roleRewards) {
                config.roleRewards = [];
            }
            
            // Vérifier si une récompense existe déjà pour ce niveau
            const existingRewardIndex = config.roleRewards.findIndex(reward => reward.level === level);
            
            if (existingRewardIndex !== -1) {
                // Remplacer la récompense existante
                config.roleRewards[existingRewardIndex] = {
                    level: level,
                    roleId: role.id
                };
            } else {
                // Ajouter nouvelle récompense
                config.roleRewards.push({
                    level: level,
                    roleId: role.id
                });
            }
            
            // Trier par niveau croissant
            config.roleRewards.sort((a, b) => a.level - b.level);
            
            // Sauvegarder
            if (levelManager.saveConfig(config)) {
                await interaction.editReply({
                    content: `✅ Récompense ajoutée !\n🎁 **Niveau ${level}** → ${role.name}\n\nLes utilisateurs qui atteignent le niveau ${level} recevront automatiquement le rôle ${role.name}.`
                });
            } else {
                await interaction.editReply({
                    content: '❌ Erreur lors de la sauvegarde de la configuration.'
                });
            }
            
        } catch (error) {
            console.error('Erreur ajout récompense niveau:', error);
            await interaction.editReply({
                content: '❌ Erreur lors de l\'ajout de la récompense.'
            });
        }
    },
};