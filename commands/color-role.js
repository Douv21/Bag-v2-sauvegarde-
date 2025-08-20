const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const { buildChoicesForSlashCommand, findStyleByKey, ROLE_STYLES } = require('../utils/rolePalette');

const LIMITED_CHOICES = buildChoicesForSlashCommand().slice(0, 25);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('color-role')
		.setDescription('Appliquer une couleur/style à un rôle OU à un membre')
		.addRoleOption(option =>
			option
				.setName('role')
				.setDescription('Rôle à modifier (optionnel si un membre est choisi)')
				.setRequired(false)
		)
		.addUserOption(option =>
			option
				.setName('membre')
				.setDescription('Membre à qui attribuer la couleur (optionnel si un rôle est choisi)')
				.setRequired(false)
		)
		.addStringOption(option =>
			option
				.setName('style')
				.setDescription('Choisis un style (ou laisse vide pour obtenir un menu)')
				.setRequired(false)
				.addChoices(...LIMITED_CHOICES)
		)
		.addBooleanOption(option =>
			option
				.setName('rename')
				.setDescription('Renommer le rôle avec le nom du style (par défaut: non)')
				.setRequired(false)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

	async execute(interaction) {
		if (!interaction.inGuild()) {
			return interaction.reply({ content: 'Cette commande doit être utilisée dans un serveur.', flags: 64 });
		}

		if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return interaction.reply({ content: '❌ Permission requise: Administrateur.', flags: 64 });
		}

		const targetRole = interaction.options.getRole('role');
		const targetMember = interaction.options.getMember('membre');
		const styleKey = interaction.options.getString('style');
		const shouldRename = interaction.options.getBoolean('rename') ?? false;

		if (!styleKey) {
			if (!targetRole && !targetMember) {
				return interaction.reply({ content: 'Précise soit un rôle (`role`), soit un membre (`membre`).', flags: 64 });
			}

			const preview = new EmbedBuilder()
				.setTitle('🎨 Choix du style de couleur')
				.setDescription('Sélectionne un style dans la liste ci-dessous pour appliquer la couleur.')
				.setColor('#5865F2')
				.addFields(ROLE_STYLES.slice(0, 12).map(s => ({ name: s.name, value: s.color, inline: true })));

			const select = new StringSelectMenuBuilder()
				.setCustomId(`color_role_select|${targetRole ? 'r' : 'm'}|${(targetRole?.id || targetMember?.id)}|${shouldRename ? '1' : '0'}`)
				.setPlaceholder('Choisir un style…')
				.addOptions(LIMITED_CHOICES.map(c => ({ label: c.name, value: c.value })));

			const row = new ActionRowBuilder().addComponents(select);
			return interaction.reply({ embeds: [preview], components: [row], ephemeral: true });
		}

		const style = findStyleByKey(styleKey);
		if (!style) {
			return interaction.reply({ content: `Style inconnu: ${styleKey}.`, flags: 64 });
		}

		if (!targetRole && !targetMember) {
			return interaction.reply({ content: 'Précise soit un rôle (`role`), soit un membre (`membre`).', flags: 64 });
		}

		if (targetRole && targetMember) {
			return interaction.reply({ content: 'Choisis soit un rôle, soit un membre — pas les deux.', flags: 64 });
		}

		await interaction.deferReply({ ephemeral: true });

		try {
			if (targetRole) {
				const roleEditData = { color: style.color };
				if (shouldRename) roleEditData.name = style.name;
				await targetRole.edit(roleEditData, 'Application de couleur via /color-role');

				const embed = new EmbedBuilder()
					.setTitle(`Style appliqué: ${style.name}`)
					.setDescription(`Clé: ${style.key}\nHex: ${style.color}`)
					.setColor(style.color);

				const listEmbed = new EmbedBuilder()
					.setTitle('Palette des couleurs disponibles')
					.setDescription('Néon, Dark, Pastel, Métal')
					.setColor(style.color)
					.addFields(ROLE_STYLES.map(s => ({ name: s.name, value: s.color, inline: true })));

				return interaction.editReply({ content: `Mis à jour: ${targetRole.toString()} → ${style.name} (${style.color})`, embeds: [embed, listEmbed] });
			}

			// Cible: membre → on trouve ou crée le rôle de couleur correspondant au style, puis on l'assigne
			let styleRole = interaction.guild.roles.cache.find(r => r.name === style.name);
			if (!styleRole) {
				styleRole = await interaction.guild.roles.create({
					name: style.name,
					color: style.color,
					hoist: false,
					mentionable: false,
					reason: 'Création automatique du rôle de couleur (color-role)'
				});

				// Positionner le rôle créé le plus haut possible (juste sous le rôle le plus haut du bot)
				try {
					const meForPosition = interaction.guild.members.me;
					if (meForPosition) {
						const targetPosition = Math.max(1, meForPosition.roles.highest.position - 1);
						await styleRole.setPosition(targetPosition);
					}
				} catch (e) {
					console.warn('Impossible de positionner le rôle de couleur au plus haut:', e?.message);
				}
			}

			// Vérifie que le bot peut gérer/assigner ce rôle
			const me = interaction.guild.members.me;
			if (!me || me.roles.highest.comparePositionTo(styleRole) <= 0) {
				return interaction.editReply({ content: `Je ne peux pas assigner le rôle ${styleRole.toString()} (position trop haute). Place mon rôle au-dessus.` });
			}

			await targetMember.roles.add(styleRole, 'Attribution de la couleur via /color-role');

			const embed = new EmbedBuilder()
				.setTitle(`Style appliqué à ${targetMember.displayName}`)
				.setDescription(`Rôle attribué: ${styleRole.toString()}\nClé: ${style.key}\nHex: ${style.color}`)
				.setColor(style.color);

			const listEmbed = new EmbedBuilder()
				.setTitle('Palette des couleurs disponibles')
				.setDescription('Néon, Dark, Pastel, Métal')
				.setColor(style.color)
				.addFields(ROLE_STYLES.map(s => ({ name: s.name, value: s.color, inline: true })));

			return interaction.editReply({ content: `Couleur attribuée à ${targetMember.toString()} → ${style.name} (${style.color})`, embeds: [embed, listEmbed] });
		} catch (error) {
			return interaction.editReply({ content: `Action impossible. Vérifie mes permissions et la position des rôles.\nErreur: ${error.message}` });
		}
	}
};

