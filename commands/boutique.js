const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('boutique')
        .setDescription('Accéder à la boutique du serveur'),

    async execute(interaction, dataManager) {
        try {
            const guildId = interaction.guild.id;
            const userId = interaction.user.id;
            
            const userData = await dataManager.getUser(userId, guildId);
            const shop = await dataManager.getData('shop');
            const shopItems = shop[guildId] || [];

            if (shopItems.length === 0) {
                return await interaction.reply({
                    content: '🛒 La boutique est vide. Les administrateurs n\'ont pas encore configuré d\'objets.',
                    flags: 64
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#00AAFF')
                .setTitle('🛒 Boutique du Serveur')
                .setDescription(`**Votre solde:** ${userData.balance}€\n\nObjets disponibles à l'achat :`)
                .setFooter({ text: 'Sélectionnez un objet pour l\'acheter' });

            // Afficher les objets disponibles
            const itemsText = shopItems.slice(0, 10).map((item, index) => {
                let typeIcon = '🏆';
                let typeText = 'Objet virtuel';
                
                if (item.type === 'temp_role') {
                    typeIcon = '👤';
                    typeText = `Rôle temporaire (${item.duration}j)`;
                } else if (item.type === 'perm_role') {
                    typeIcon = '⭐';
                    typeText = 'Rôle permanent';
                }
                
                return `${typeIcon} **${item.name}** - ${item.price}€\n${typeText}\n*${item.description}*`;
            }).join('\n\n');

            embed.addFields([{
                name: '🛍️ Articles Disponibles',
                value: itemsText || 'Aucun objet disponible',
                inline: false
            }]);

            // Menu de sélection si des objets existent
            const components = [];
            if (shopItems.length > 0) {
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('shop_purchase')
                    .setPlaceholder('💳 Sélectionner un objet à acheter')
                    .addOptions(
                        shopItems.slice(0, 25).map((item, index) => {
                            let emoji = '🏆';
                            if (item.type === 'temp_role') emoji = '👤';
                            else if (item.type === 'perm_role') emoji = '⭐';
                            
                            return {
                                label: item.name,
                                description: `${item.price}€ - ${item.description.substring(0, 80)}`,
                                value: item.id || index.toString(),
                                emoji: emoji
                            };
                        })
                    );

                components.push(new ActionRowBuilder().addComponents(selectMenu));
            }

            await interaction.reply({
                embeds: [embed],
                components: components,
                flags: 64
            });

        } catch (error) {
            console.error('❌ Erreur boutique:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'accès à la boutique.',
                flags: 64
            });
        }
    }
};