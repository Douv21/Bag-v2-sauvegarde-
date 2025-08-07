const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ajout-argent')
        .setDescription('💋 Ajouter du plaisir à un membre (Admin uniquement)')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre à qui donner de l\'argent')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Montant à ajouter (1-999999€)')
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
            // Charger ou créer l'utilisateur dans users.json
            const userData = await dataManager.getUser(userId, guildId);

            const oldBalance = userData.balance || 0;
            const newBalance = oldBalance + amount;

            // Sauvegarder via updateUser (users.json)
            await dataManager.updateUser(userId, guildId, { balance: newBalance });

            // Créer l'embed de confirmation
            const embed = new EmbedBuilder()
                .setColor('#FF1493')
                .setTitle('💋 Plaisir Ajouté')
                .setDescription(`**${amount}💋** ajouté(s) au compte de ${targetMember}`)
                .addFields([
                    {
                        name: '👤 Membre',
                        value: `${targetMember}`,
                        inline: true
                    },
                    {
                        name: '💋 Ancien Plaisir',
                        value: `${oldBalance}💋`,
                        inline: true
                    },
                    {
                        name: '💋 Nouveau Plaisir',
                        value: `${newBalance}💋`,
                        inline: true
                    },
                    {
                        name: '📈 Plaisir Ajouté',
                        value: `+${amount}💋`,
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
            console.error('❌ Erreur ajout-argent:', error);
            await interaction.reply({
                content: '❌ Erreur lors de l\'ajout d\'argent.',
                flags: 64
            });
        }
    }
};