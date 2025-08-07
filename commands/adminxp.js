const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const levelManager = require('../utils/levelManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adminxp')
        .setDescription('Gérer l\'XP et les niveaux des membres (Admin uniquement)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre à modifier')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Action à effectuer')
                .setRequired(true)
                .addChoices(
                    { name: '➕ Ajouter XP', value: 'add_xp' },
                    { name: '➖ Retirer XP', value: 'remove_xp' },
                    { name: '📈 Ajouter Niveaux', value: 'add_levels' },
                    { name: '📉 Retirer Niveaux', value: 'remove_levels' },
                    { name: '🎯 Définir XP', value: 'set_xp' },
                    { name: '🎯 Définir Niveau', value: 'set_level' }
                ))
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Montant d\'XP ou nombre de niveaux (optionnel)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(999999)),

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: 64 });

            const targetUser = interaction.options.getUser('membre');
            const action = interaction.options.getString('action');
            let amount = interaction.options.getInteger('montant');

            // Valeurs par défaut si pas de montant spécifié
            if (!amount) {
                switch (action) {
                    case 'add_xp':
                    case 'remove_xp':
                    case 'set_xp':
                        amount = 100; // XP par défaut
                        break;
                    case 'add_levels':
                    case 'remove_levels':
                    case 'set_level':
                        amount = 1; // Niveau par défaut
                        break;
                }
            }

            const guildId = interaction.guild.id;
            const currentLevel = levelManager.getUserLevel(targetUser.id, guildId);
            let newXP = currentLevel.xp || currentLevel.totalXP || 0;
            let newLevel = currentLevel.level;
            let actionText = '';

            switch (action) {
                case 'add_xp':
                    newXP += amount;
                    actionText = `➕ Ajouté ${amount.toLocaleString()} XP`;
                    break;
                case 'remove_xp':
                    newXP = Math.max(0, newXP - amount);
                    actionText = `➖ Retiré ${amount.toLocaleString()} XP`;
                    break;
                case 'set_xp':
                    newXP = amount;
                    actionText = `🎯 XP défini à ${amount.toLocaleString()}`;
                    break;
                case 'add_levels':
                    // Calculer l'XP nécessaire pour ajouter des niveaux
                    for (let i = 0; i < amount; i++) {
                        const nextLevelXP = levelManager.getXPForLevel(newLevel + 1);
                        newXP = nextLevelXP;
                        newLevel++;
                    }
                    actionText = `📈 Ajouté ${amount} niveau(x)`;
                    break;
                case 'remove_levels':
                    // Retirer des niveaux
                    newLevel = Math.max(1, newLevel - amount);
                    newXP = levelManager.getXPForLevel(newLevel);
                    actionText = `📉 Retiré ${amount} niveau(x)`;
                    break;
                case 'set_level':
                    newLevel = amount;
                    newXP = levelManager.getXPForLevel(newLevel);
                    actionText = `🎯 Niveau défini à ${amount}`;
                    break;
            }

            // Mettre à jour l'XP dans le système
            levelManager.setUserXP(targetUser.id, guildId, newXP);
            
            // Recalculer le niveau après modification
            const updatedLevel = levelManager.getUserLevel(targetUser.id, guildId);

            const embed = {
                title: '⚙️ Administration XP',
                color: 0x00ff00,
                fields: [
                    {
                        name: '👤 Membre',
                        value: `${targetUser.displayName} (${targetUser.tag})`,
                        inline: true
                    },
                    {
                        name: '🔧 Action',
                        value: actionText,
                        inline: true
                    },
                    {
                        name: '📊 Avant',
                        value: `Niveau ${currentLevel.level}\n${(currentLevel.xp || currentLevel.totalXP || 0).toLocaleString()} XP`,
                        inline: true
                    },
                    {
                        name: '📈 Après',
                        value: `Niveau ${updatedLevel.level}\n${(updatedLevel.xp || updatedLevel.totalXP || 0).toLocaleString()} XP`,
                        inline: true
                    },
                    {
                        name: '🎯 Progression',
                        value: `${(updatedLevel.currentXP || 0).toLocaleString()} / ${(updatedLevel.neededXP || 1000).toLocaleString()} XP`,
                        inline: true
                    }
                ],
                footer: {
                    text: `Admin: ${interaction.user.displayName}`,
                    icon_url: interaction.user.displayAvatarURL()
                },
                timestamp: new Date().toISOString()
            };

            await interaction.editReply({ embeds: [embed] });

            console.log(`⚙️ Admin XP: ${interaction.user.displayName} a ${actionText.toLowerCase()} à ${targetUser.displayName}`);

        } catch (error) {
            console.error('Erreur adminxp:', error);
            await interaction.editReply({
                content: '❌ **Erreur lors de la modification de l\'XP**\n\nVeuillez réessayer plus tard.'
            });
        }
    }
};