const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ajout-karma')
        .setDescription('⚖️ Ajouter du karma (positif ou négatif) à un membre (Admin uniquement)')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre à qui donner du karma')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type de karma à ajouter')
                .setRequired(true)
                .addChoices(
                    { name: '😇 Karma Positif', value: 'good' },
                    { name: '😈 Karma Négatif', value: 'bad' }
                ))
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Montant de karma à ajouter (1-999)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(999)),

    async execute(interaction, dataManager) {
        // Vérifier les permissions administrateur
        if (!interaction.member.permissions.has('Administrator')) {
            return await interaction.reply({
                content: '❌ Cette commande est réservée aux administrateurs.',
                flags: 64
            });
        }

        const targetMember = interaction.options.getUser('membre');
        const karmaType = interaction.options.getString('type');
        const amount = interaction.options.getInteger('montant');
        const guildId = interaction.guild.id;
        const userId = targetMember.id;

        try {
            // Charger les données économiques réelles (economy.json)
            const economy = await dataManager.getData('economy.json');
            const userKey = `${userId}_${guildId}`;
            
            // Initialiser l'utilisateur s'il n'existe pas
            if (!economy[userKey]) {
                economy[userKey] = {
                    balance: 0,
                    goodKarma: 0,
                    badKarma: 0,
                    dailyStreak: 0,
                    lastDaily: null
                };
            }

            let oldKarma, newKarma, karmaName, karmaEmoji, embedColor;

            if (karmaType === 'good') {
                // Ajouter karma positif
                oldKarma = economy[userKey].goodKarma;
                economy[userKey].goodKarma += amount;
                newKarma = economy[userKey].goodKarma;
                karmaName = 'Karma Positif';
                karmaEmoji = '😇';
                embedColor = '#00FF00';
            } else {
                // Ajouter karma négatif
                oldKarma = economy[userKey].badKarma;
                economy[userKey].badKarma += amount;
                newKarma = economy[userKey].badKarma;
                karmaName = 'Karma Négatif';
                karmaEmoji = '😈';
                embedColor = '#FF0000';
            }
            
            // Calculer la réputation (karma net = charme + perversion négative)
            const karmaNet = (economy[userKey].goodKarma || 0) + (economy[userKey].badKarma || 0);

            // Sauvegarder dans le bon fichier
            await dataManager.saveData('economy.json', economy);

            // Créer l'embed de confirmation
            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(`${karmaEmoji} ${karmaName} Ajouté`)
                .setDescription(`**+${amount} ${karmaName.toLowerCase()}** ajouté à ${targetMember}`)
                .addFields([
                    {
                        name: '👤 Membre',
                        value: `${targetMember}`,
                        inline: true
                    },
                    {
                        name: `${karmaEmoji} Ancien ${karmaName}`,
                        value: `${oldKarma}`,
                        inline: true
                    },
                    {
                        name: `${karmaEmoji} Nouveau ${karmaName}`,
                        value: `${newKarma}`,
                        inline: true
                    },
                    {
                        name: '📈 Montant Ajouté',
                        value: `+${amount} ${karmaEmoji}`,
                        inline: true
                    },
                    {
                        name: '⚖️ Réputation 🥵',
                        value: `${karmaNet} (${economy[userKey].goodKarma}🫦 + ${economy[userKey].badKarma}😈)`,
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
            console.error('❌ Erreur ajout-karma:', error);
            await interaction.reply({
                content: '❌ Erreur lors de l\'ajout de karma.',
                flags: 64
            });
        }
    }
};