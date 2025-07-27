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
            const shopData = await dataManager.loadData('shop.json', {});
            const economyConfig = await dataManager.loadData('economy.json', {});
            const allShopItems = shopData[guildId] || [];
            // Afficher tous les types d'objets (custom, temp_role, perm_role)
            const shopItems = allShopItems;

            // Calculer le karma net de l'utilisateur (goodKarma - badKarma, badKarma est déjà négatif)
            const userKarmaNet = (userData.goodKarma || 0) - (userData.badKarma || 0);
            
            // Fonction pour calculer la remise basée sur le karma net
            const calculateKarmaDiscount = (userKarmaNet, economyConfig) => {
                if (!economyConfig.karmaDiscounts || !economyConfig.karmaDiscounts.enabled || !economyConfig.karmaDiscounts.ranges) {
                    return 0;
                }
                
                // Trier les tranches par karma descendant et trouver la meilleure applicable
                const applicableRange = economyConfig.karmaDiscounts.ranges
                    .filter(range => userKarmaNet >= range.minKarma)
                    .sort((a, b) => b.minKarma - a.minKarma)[0];
                
                return applicableRange ? applicableRange.discount : 0;
            };

            const karmaDiscountPercent = calculateKarmaDiscount(userKarmaNet, economyConfig);

            if (shopItems.length === 0) {
                return await interaction.reply({
                    content: '🛒 La boutique est vide. Les administrateurs n\'ont pas encore configuré d\'articles.\n\n💡 Utilisez `/configeconomie` → 🏪 Boutique pour ajouter des articles.',
                    flags: 64
                });
            }

            let descriptionText = `**Votre solde:** ${userData.balance}€\n**Karma net:** ${userKarmaNet}`;
            if (karmaDiscountPercent > 0) {
                descriptionText += `\n💸 **Remise karma:** -${karmaDiscountPercent}% sur tous les achats !`;
            }
            descriptionText += '\n\n🛒 Articles disponibles :';

            const embed = new EmbedBuilder()
                .setColor('#00AAFF')
                .setTitle('🛒 Boutique du Serveur')
                .setDescription(descriptionText)
                .setFooter({ text: 'Sélectionnez un objet pour l\'acheter' });

            // Afficher les objets disponibles
            const itemsText = shopItems.slice(0, 10).map((item, index) => {
                let typeIcon = '🏆';
                let typeText = 'Objet virtuel';
                
                if (item.type === 'temp_role') {
                    typeIcon = '⌛';
                    typeText = `Rôle temporaire (${item.duration}j)`;
                } else if (item.type === 'perm_role') {
                    typeIcon = '⭐';
                    typeText = 'Rôle permanent';
                } else if (item.type === 'custom') {
                    typeIcon = '🎨';
                    typeText = 'Objet personnalisé';
                }
                
                let priceText = `${item.price}€`;
                if (karmaDiscountPercent > 0) {
                    const discountedPrice = Math.floor(item.price * (100 - karmaDiscountPercent) / 100);
                    priceText = `~~${item.price}€~~ **${discountedPrice}€** (-${karmaDiscountPercent}%)`;
                }
                
                return `${typeIcon} **${item.name}** - ${priceText}\n${typeText}\n*${item.description || 'Aucune description'}*`;
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
                            let emoji = '🎨';
                            if (item.type === 'temp_role') emoji = '⌛';
                            else if (item.type === 'perm_role') emoji = '⭐';
                            else if (item.type === 'custom') emoji = '🎨';
                            
                            const finalPrice = karmaDiscountPercent > 0 ? 
                                Math.floor(item.price * (100 - karmaDiscountPercent) / 100) : item.price;
                            const priceDisplay = karmaDiscountPercent > 0 ? 
                                `${finalPrice}€ (était ${item.price}€)` : `${item.price}€`;

                            return {
                                label: item.name,
                                description: `${priceDisplay} - ${(item.description || 'Aucune description').substring(0, 60)}`,
                                value: (item.id || index).toString(),
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