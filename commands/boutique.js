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

			// Catégorisation par catégorie logique
			const isCustom = (t) => t === 'custom_object' || t === 'custom' || t === 'text' || !t;
			const isTempRole = (t) => t === 'temporary_role' || t === 'temp_role';
			const isPermRole = (t) => t === 'permanent_role' || t === 'perm_role';
			const isSuite = (t) => t === 'private_24h' || t === 'private_monthly' || t === 'private_permanent';
			const deriveCategoryFromType = (t) => {
				if (isSuite(t)) return 'Suites privées';
				if (isTempRole(t) || isPermRole(t)) return 'Rôles';
				if (isCustom(t)) return 'Objets personnalisés';
				return 'Autres';
			};
			
			const categoriesMap = allShopItems.reduce((acc, item) => {
				const raw = typeof item.category === 'string' ? item.category.trim() : '';
				const cat = raw && raw.length > 0 ? raw : deriveCategoryFromType(item.type);
				if (!acc[cat]) acc[cat] = [];
				acc[cat].push(item);
				return acc;
			}, {});

			const categories = Object.entries(categoriesMap);
			const shopHasItems = categories.length > 0;
			
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
				let bestDiscount = 0;
				for (const discount of guildDiscounts) {
					if (userKarmaNet >= discount.minKarma && discount.discountPercent > bestDiscount) {
						bestDiscount = discount.discountPercent;
					}
				}
				return bestDiscount;
			};
			const karmaDiscountPercent = calculateKarmaDiscount(userKarmaNet, karmaDiscountsData, guildId);

			// En-tête avec balance et karma
			const embed = new EmbedBuilder()
				.setColor('#e74c3c')
				.setTitle('🛒 Boutique NSFW du Serveur')
				.setDescription(`💰 **Votre balance :** ${userData.balance || 0}💋\n💫 **Karma :** ${userKarmaNet} ${karmaDiscountPercent > 0 ? `(Remise ${karmaDiscountPercent}% !)` : ''}`)
				.setTimestamp();

			// Fonction de rendu d'articles
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

			// Champs par catégorie
			const fields = [];
			for (const [catName, items] of categories) {
				const list = items.slice(0, 10).map(renderLine).join('\n\n') || 'Aucun objet disponible';
				fields.push({ name: `📂 ${catName}`, value: list, inline: false });
			}
			embed.addFields(fields);

			// Menus par catégorie (IDs uniques par menu)
			const components = [];
			const sortedForMenus = categories
				.sort((a, b) => b[1].length - a[1].length)
				.slice(0, 5);

			for (let i = 0; i < sortedForMenus.length; i++) {
				const [catName, items] = sortedForMenus[i];
				const options = items.slice(0, 25).map(item => {
					const basePrice = item.price;
					const finalPrice = karmaDiscountPercent > 0 ? Math.floor(basePrice * (100 - karmaDiscountPercent) / 100) : basePrice;
					return {
						label: `${item.name} - ${finalPrice}💋`,
						value: item.id,
						description: (item.description || 'Aucune description').slice(0, 100)
					};
				});

				const menu = new StringSelectMenuBuilder()
					.setCustomId(`shop_buy_${i}`)
					.setPlaceholder(`🛒 Acheter dans ${catName}`)
					.addOptions(options);

				components.push(new ActionRowBuilder().addComponents(menu));
			}

			// Footer
			embed.setFooter({ text: '💡 Sélectionnez un article dans les menus pour l\'acheter' });

			await interaction.reply({ embeds: [embed], components });

		} catch (error) {
			console.error('❌ Erreur boutique:', error);
			await interaction.reply({
				content: '❌ Une erreur est survenue lors de l\'affichage de la boutique.',
				flags: 64
			});
		}
	}
};