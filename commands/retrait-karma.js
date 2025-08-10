const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('retrait-karma')
        .setDescription('⚖️ Retirer du karma (positif ou négatif) à un membre (Admin uniquement)')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre à qui retirer du karma')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type de karma à retirer')
                .setRequired(true)
                .addChoices(
                    { name: '😇 Karma Positif', value: 'good' },
                    { name: '😈 Karma Négatif', value: 'bad' }
                ))
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Montant de karma à retirer (1-999)')
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
            
            // Vérifier si l'utilisateur existe
            if (!economy[userKey]) {
                return await interaction.reply({
                    content: `❌ ${targetMember} n'a pas de compte économique.`,
                    flags: 64
                });
            }

            const userData = economy[userKey];
            let oldKarma, newKarma, karmaName, karmaEmoji, embedColor;

            if (karmaType === 'good') {
                oldKarma = userData.goodKarma;
                karmaName = 'Karma Positif';
                karmaEmoji = '😇';
                embedColor = '#FFD700';
                
                // Vérifier si l'utilisateur a assez de karma positif
                if (oldKarma < amount) {
                    return await interaction.reply({
                        content: `❌ ${targetMember} n'a que ${oldKarma} karma positif, impossible de retirer ${amount}.`,
                        flags: 64
                    });
                }
                
                userData.goodKarma -= amount;
                newKarma = userData.goodKarma;
                
            } else { // bad karma
                oldKarma = userData.badKarma;
                karmaName = 'Karma Négatif';
                karmaEmoji = '😈';
                embedColor = '#FF4444';
                
                // Vérifier si l'utilisateur a assez de karma négatif
                if (oldKarma < amount) {
                    return await interaction.reply({
                        content: `❌ ${targetMember} n'a que ${oldKarma} karma négatif, impossible de retirer ${amount}.`,
                        flags: 64
                    });
                }
                
                userData.badKarma -= amount;
                newKarma = userData.badKarma;
            }

            // Calculer la réputation (karma net = charme + perversion négative)
            const karmaNet = (userData.goodKarma || 0) + (userData.badKarma || 0);

            // Sauvegarder dans le bon fichier
            await dataManager.saveData('economy.json', economy);

            // Créer l'embed de confirmation
            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(`${karmaEmoji} ${karmaName} Retiré`)
                .setDescription(`**-${amount} ${karmaName.toLowerCase()}** retiré à ${targetMember}`)
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
                        name: '📉 Montant Retiré',
                        value: `-${amount} ${karmaEmoji}`,
                        inline: true
                    },
                    {
                        name: '⚖️ Réputation 🥵',
                        value: `${karmaNet} (${userData.goodKarma}🫦 + ${userData.badKarma}😈)`,
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
            console.error('❌ Erreur retrait-karma:', error);
            await interaction.reply({
                content: '❌ Erreur lors du retrait de karma.',
                flags: 64
            });
        }
    }
};