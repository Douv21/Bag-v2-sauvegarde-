const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('retrait-argent')
        .setDescription('💸 Retirer de l\'argent à un membre (Admin uniquement)')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre à qui retirer de l\'argent')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Montant à retirer (1-999999€)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(999999)),

    async execute(interaction, dataManager) {
        // Vérifier les permissions administrateur
        if (!interaction.member.permissions.has('Administrator')) {
            return await interaction.reply({
                content: '❌ Cette commande est réservée aux administrateurs.',
                flags: 64
            });
        }

        const targetMember = interaction.options.getUser('membre');
        const amount = interaction.options.getInteger('montant');
        const guildId = interaction.guild.id;
        const userId = targetMember.id;

        try {
            // Charger les données économiques
            const economy = await dataManager.getData('economy');
            
            // Vérifier si l'utilisateur existe
            if (!economy[guildId] || !economy[guildId][userId]) {
                return await interaction.reply({
                    content: `❌ ${targetMember} n'a pas de compte économique.`,
                    flags: 64
                });
            }

            const oldBalance = economy[guildId][userId].balance;
            
            // Vérifier si l'utilisateur a assez d'argent
            if (oldBalance < amount) {
                return await interaction.reply({
                    content: `❌ ${targetMember} n'a que ${oldBalance}€, impossible de retirer ${amount}€.`,
                    flags: 64
                });
            }

            // Retirer l'argent
            economy[guildId][userId].balance -= amount;
            const newBalance = economy[guildId][userId].balance;

            // Sauvegarder
            await dataManager.saveData('economy', economy);

            // Créer l'embed de confirmation
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('💸 Argent Retiré')
                .setDescription(`**${amount}€** retiré(s) du compte de ${targetMember}`)
                .addFields([
                    {
                        name: '👤 Membre',
                        value: `${targetMember}`,
                        inline: true
                    },
                    {
                        name: '💰 Ancien Solde',
                        value: `${oldBalance}€`,
                        inline: true
                    },
                    {
                        name: '💰 Nouveau Solde',
                        value: `${newBalance}€`,
                        inline: true
                    },
                    {
                        name: '📉 Montant Retiré',
                        value: `-${amount}€`,
                        inline: true
                    },
                    {
                        name: '🛠️ Administrateur',
                        value: `${interaction.user}`,
                        inline: true
                    }
                ])
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                flags: 64
            });

        } catch (error) {
            console.error('❌ Erreur retrait-argent:', error);
            await interaction.reply({
                content: '❌ Erreur lors du retrait d\'argent.',
                flags: 64
            });
        }
    }
};