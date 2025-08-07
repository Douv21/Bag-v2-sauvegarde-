const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('boutique')
        .setDescription('Accéder à la boutique du serveur (version NSFW)')
        .setDMPermission(false),

    async execute(interaction, dataManager) {
        try {
            const guildId = interaction.guild.id;
            const userId = interaction.user.id;
            
            const userData = await dataManager.getUser(userId, guildId);
            const shopData = await dataManager.loadData('shop.json', {});
            const karmaDiscountsData = await dataManager.loadData('karma_discounts', {});
            const allShopItems = shopData[guildId] || [];
            const shopItems = allShopItems;

            const userKarmaNet = (userData.goodKarma || 0) - (userData.badKarma || 0);
            
            const calculateKarmaDiscount = (userKarmaNet, karmaDiscountsData, guildId) => {
                const guildDiscounts = karmaDiscountsData[guildId] || [];
                if (guildDiscounts.length === 0) return 0;
                const applicableDiscount = guildDiscounts
                    .filter(discount => userKarmaNet >= discount.karmaMin)
                    .sort((a, b) => b.karmaMin - a.karmaMin)[0];
                return applicableDiscount ? applicableDiscount.percentage : 0;
            };

            const karmaDiscountPercent = calculateKarmaDiscount(userKarmaNet, karmaDiscountsData, guildId);

            if (shopItems.length === 0) {
                return await interaction.reply({
                    content: '🛒 La boutique est vide. Les administrateurs n\'ont pas encore configuré d\'articles.\n\n💡 Utilisez `/configeconomie` → 🏪 Boutique pour ajouter des articles.',
                    flags: 64
                });
            }

            let descriptionText = `**Votre plaisir:** ${userData.balance}💋\n**Réputation 🥵:** ${userKarmaNet}`;
            if (karmaDiscountPercent > 0) {
                descriptionText += `\n💸 **Remise réputation:** -${karmaDiscountPercent}% sur tous les achats !`;
            }
            descriptionText += '\n\n🛒 Articles disponibles :';

            const embed = new EmbedBuilder()
                .setColor('#d35400')
                .setTitle('🔞 Boutique NSFW - Boys & Girls')
                .setDescription(descriptionText)
                .setFooter({ text: 'Sélectionnez un objet à acheter (salons privés inclus)' });

            const itemsText = shopItems.slice(0, 10).map((item, index) => {
                let typeIcon = '🏆';
                let typeText = 'Objet virtuel';
                
                if (item.type === 'temporary_role' || item.type === 'temp_role') {
                    typeIcon = '⌛';
                    typeText = `Rôle temporaire (${item.duration}h)`;
                } else if (item.type === 'permanent_role') {
                    typeIcon = '⭐';
                    typeText = 'Rôle permanent';
                } else if (item.type === 'custom_object' || item.type === 'custom') {
                    typeIcon = '🎨';
                    typeText = 'Objet personnalisé';
                } else if (item.type === 'private_24h') {
                    typeIcon = '🔒';
                    typeText = 'Suite privée 24h (texte NSFW + vocal)';
                } else if (item.type === 'private_monthly') {
                    typeIcon = '🗓️';
                    typeText = 'Suite privée 30j (texte NSFW + vocal)';
                } else if (item.type === 'private_permanent') {
                    typeIcon = '♾️';
                    typeText = 'Suite privée permanente (texte NSFW + vocal)';
                }
                
                let priceText = `${item.price}💋`;
                if (karmaDiscountPercent > 0) {
                    const discountedPrice = Math.floor(item.price * (100 - karmaDiscountPercent) / 100);
                    priceText = `~~${item.price}💋~~ **${discountedPrice}💋** (-${karmaDiscountPercent}%)`;
                }
                
                return `${typeIcon} **${item.name}** - ${priceText}\n${typeText}\n*${item.description || 'Aucune description'}*`;
            }).join('\n\n');

            embed.addFields([{
                name: '🛍️ Articles Disponibles',
                value: itemsText || 'Aucun objet disponible',
                inline: false
            }]);

            const components = [];
            if (shopItems.length > 0) {
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('shop_purchase')
                    .setPlaceholder('💳 Sélectionner un objet à acheter')
                    .addOptions(
                        shopItems.slice(0, 25).map((item, index) => {
                            let emoji = '🎨';
                            if (item.type === 'temporary_role' || item.type === 'temp_role') emoji = '⌛';
                            else if (item.type === 'permanent_role') emoji = '⭐';
                            else if (item.type === 'custom_object' || item.type === 'custom') emoji = '🎨';
                            else if (item.type === 'private_24h') emoji = '🔒';
                            else if (item.type === 'private_monthly') emoji = '🗓️';
                            else if (item.type === 'private_permanent') emoji = '♾️';
                            
                            const finalPrice = karmaDiscountPercent > 0 ? 
                                Math.floor(item.price * (100 - karmaDiscountPercent) / 100) : item.price;
                            const priceDisplay = karmaDiscountPercent > 0 ? 
                                `${finalPrice}💋 (était ${item.price}💋)` : `${item.price}💋`;

                            const uniqueValue = item.id ? item.id.toString() : `shop_item_${index}_${Date.now().toString(36)}`;

                            return {
                                label: item.name,
                                description: `${priceDisplay} - ${(item.description || 'Aucune description').substring(0, 60)}`,
                                value: uniqueValue,
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