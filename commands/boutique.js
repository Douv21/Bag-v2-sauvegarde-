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

            // Catégorisation
            const isCustom = (t) => t === 'custom_object' || t === 'custom' || t === 'text' || !t;
            const isTempRole = (t) => t === 'temporary_role' || t === 'temp_role';
            const isPermRole = (t) => t === 'permanent_role' || t === 'perm_role';
            const isSuite = (t) => t === 'private_24h' || t === 'private_monthly' || t === 'private_permanent';

            const customItems = allShopItems.filter(i => isCustom(i.type));
            const giftableItems = customItems; // Objets personnalisés: peuvent être offerts via /objet
            const interactiveItems = customItems; // Objets personnalisés: utilisables via /objet (message personnalisé)
            const suiteItems = allShopItems.filter(i => isSuite(i.type));
            const roleItems = allShopItems.filter(i => isTempRole(i.type) || isPermRole(i.type));

            const shopHasItems = (giftableItems.length + interactiveItems.length + suiteItems.length + roleItems.length) > 0;
            if (!shopHasItems) {
                return await interaction.reply({
                    content: '🛒 La boutique est vide. Les administrateurs n\'ont pas encore configuré d\'articles.\n\n💡 Utilisez `/configeconomie` → 🏪 Boutique pour ajouter des articles.',
                    flags: 64
                });
            }

            // Réputation et remises
            const userKarmaNet = (userData.goodKarma || 0) + (userData.badKarma || 0);
            const calculateKarmaDiscount = (userKarmaNet, karmaDiscountsData, guildId) => {
                const guildDiscounts = karmaDiscountsData[guildId] || [];
                if (guildDiscounts.length === 0) return 0;
                const applicableDiscount = guildDiscounts
                    .filter(discount => userKarmaNet >= discount.karmaMin)
                    .sort((a, b) => b.karmaMin - a.karmaMin)[0];
                return applicableDiscount ? applicableDiscount.percentage : 0;
            };
            const karmaDiscountPercent = calculateKarmaDiscount(userKarmaNet, karmaDiscountsData, guildId);

            // Texte de description
            let descriptionText = `**Votre plaisir:** ${userData.balance}💋\n**Réputation 🥵:** ${userKarmaNet}`;
            if (karmaDiscountPercent > 0) {
                descriptionText += `\n💸 **Remise réputation:** -${karmaDiscountPercent}% sur tous les achats !`;
            }
            descriptionText += '\n\n🛒 Articles par catégories :';

            const embed = new EmbedBuilder()
                .setColor('#d35400')
                .setTitle('🔞 Boutique NSFW - Boys & Girls')
                .setDescription(descriptionText)
                .setFooter({ text: 'Choisissez un article dans la catégorie souhaitée' });

            const renderLine = (item) => {
                let typeIcon = '🏆';
                let typeText = 'Objet virtuel';
                if (isTempRole(item.type)) {
                    typeIcon = '⌛';
                    typeText = `Rôle temporaire (${item.duration}j)`;
                } else if (isPermRole(item.type)) {
                    typeIcon = '⭐';
                    typeText = 'Rôle permanent';
                } else if (isCustom(item.type)) {
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
            };

            const fields = [];
            if (giftableItems.length > 0) {
                fields.push({ name: '🎁 Objets à offrir (ex: ours à câliner)', value: giftableItems.slice(0, 10).map(renderLine).join('\n\n'), inline: false });
            }
            if (interactiveItems.length > 0) {
                fields.push({ name: '💬 Objets à interagir', value: interactiveItems.slice(0, 10).map(renderLine).join('\n\n'), inline: false });
            }
            if (suiteItems.length > 0) {
                fields.push({ name: '🔒 Suites privées', value: suiteItems.slice(0, 10).map(renderLine).join('\n\n'), inline: false });
            }
            if (roleItems.length > 0) {
                fields.push({ name: '⭐ Rôles', value: roleItems.slice(0, 10).map(renderLine).join('\n\n'), inline: false });
            }
            if (fields.length === 0) {
                fields.push({ name: '🛍️ Articles Disponibles', value: 'Aucun objet disponible', inline: false });
            }
            embed.addFields(fields);

            // Menus par catégorie (même customId pour garder le handler existant)
            const components = [];

            if (giftableItems.length > 0) {
                const selectGift = new StringSelectMenuBuilder()
                    .setCustomId('shop_purchase')
                    .setPlaceholder('🎁 Sélectionner un objet à offrir')
                    .addOptions(
                        giftableItems.slice(0, 25).map((item) => {
                            const finalPrice = karmaDiscountPercent > 0 ? Math.floor(item.price * (100 - karmaDiscountPercent) / 100) : item.price;
                            const priceDisplay = karmaDiscountPercent > 0 ? `${finalPrice}💋 (était ${item.price}💋)` : `${item.price}💋`;
                            const fullIndex = allShopItems.findIndex(it => it === item);
                            const uniqueValue = item.id ? item.id.toString() : `shop_item_${fullIndex}_${Date.now().toString(36)}`;
                            return {
                                label: item.name,
                                description: `${priceDisplay} - ${(item.description || 'Aucune description').substring(0, 60)}`,
                                value: uniqueValue,
                                emoji: '🎁'
                            };
                        })
                    );
                components.push(new ActionRowBuilder().addComponents(selectGift));
            }

            if (interactiveItems.length > 0) {
                const selectInteract = new StringSelectMenuBuilder()
                    .setCustomId('shop_purchase')
                    .setPlaceholder('💬 Sélectionner un objet à interagir')
                    .addOptions(
                        interactiveItems.slice(0, 25).map((item) => {
                            const finalPrice = karmaDiscountPercent > 0 ? Math.floor(item.price * (100 - karmaDiscountPercent) / 100) : item.price;
                            const priceDisplay = karmaDiscountPercent > 0 ? `${finalPrice}💋 (était ${item.price}💋)` : `${item.price}💋`;
                            const fullIndex = allShopItems.findIndex(it => it === item);
                            const uniqueValue = item.id ? item.id.toString() : `shop_item_${fullIndex}_${Date.now().toString(36)}`;
                            return {
                                label: item.name,
                                description: `${priceDisplay} - ${(item.description || 'Aucune description').substring(0, 60)}`,
                                value: uniqueValue,
                                emoji: '💬'
                            };
                        })
                    );
                components.push(new ActionRowBuilder().addComponents(selectInteract));
            }

            if (suiteItems.length > 0) {
                const selectSuites = new StringSelectMenuBuilder()
                    .setCustomId('shop_purchase')
                    .setPlaceholder('🔒 Sélectionner une suite privée')
                    .addOptions(
                        suiteItems.slice(0, 25).map((item) => {
                            let emoji = '🔒';
                            if (item.type === 'private_monthly') emoji = '🗓️';
                            if (item.type === 'private_permanent') emoji = '♾️';
                            const finalPrice = karmaDiscountPercent > 0 ? Math.floor(item.price * (100 - karmaDiscountPercent) / 100) : item.price;
                            const priceDisplay = karmaDiscountPercent > 0 ? `${finalPrice}💋 (était ${item.price}💋)` : `${item.price}💋`;
                            const fullIndex = allShopItems.findIndex(it => it === item);
                            const uniqueValue = item.id ? item.id.toString() : `shop_item_${fullIndex}_${Date.now().toString(36)}`;
                            return {
                                label: item.name,
                                description: `${priceDisplay} - ${(item.description || 'Aucune description').substring(0, 60)}`,
                                value: uniqueValue,
                                emoji: emoji
                            };
                        })
                    );
                components.push(new ActionRowBuilder().addComponents(selectSuites));
            }

            if (roleItems.length > 0) {
                const selectRoles = new StringSelectMenuBuilder()
                    .setCustomId('shop_purchase')
                    .setPlaceholder('⭐ Sélectionner un rôle à acheter')
                    .addOptions(
                        roleItems.slice(0, 25).map((item) => {
                            let emoji = isTempRole(item.type) ? '⌛' : '⭐';
                            const finalPrice = karmaDiscountPercent > 0 ? Math.floor(item.price * (100 - karmaDiscountPercent) / 100) : item.price;
                            const priceDisplay = karmaDiscountPercent > 0 ? `${finalPrice}💋 (était ${item.price}💋)` : `${item.price}💋`;
                            const fullIndex = allShopItems.findIndex(it => it === item);
                            const uniqueValue = item.id ? item.id.toString() : `shop_item_${fullIndex}_${Date.now().toString(36)}`;
                            return {
                                label: item.name,
                                description: `${priceDisplay} - ${(item.description || 'Aucune description').substring(0, 60)}`,
                                value: uniqueValue,
                                emoji: emoji
                            };
                        })
                    );
                components.push(new ActionRowBuilder().addComponents(selectRoles));
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