const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { buildChoicesForSlashCommand, findStyleByKey } = require('../utils/rolePalette');

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
				.setDescription('Choisis un style')
				.setRequired(true)
				.addChoices(...LIMITED_CHOICES)
		)
		.addBooleanOption(option =>
			option
				.setName('rename')
				.setDescription('Renommer le rôle avec le nom du style (par défaut: non)')
				.setRequired(false)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles.toString()),

	async execute(interaction) {
		if (!interaction.inGuild()) {
			return interaction.reply({ content: 'Cette commande doit être utilisée dans un serveur.', flags: 64 });
		}

		if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
			return interaction.reply({ content: '❌ Permission requise: Gérer les rôles.', flags: 64 });
		}

		const targetRole = interaction.options.getRole('role');
		const targetMember = interaction.options.getMember('membre');
		const styleKey = interaction.options.getString('style', true);
		const shouldRename = interaction.options.getBoolean('rename') ?? false;

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

				return interaction.editReply({ content: `Mis à jour: ${targetRole.toString()} → ${style.name} (${style.color})`, embeds: [embed] });
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

			return interaction.editReply({ content: `Couleur attribuée à ${targetMember.toString()} → ${style.name} (${style.color})`, embeds: [embed] });
		} catch (error) {
			return interaction.editReply({ content: `Action impossible. Vérifie mes permissions et la position des rôles.\nErreur: ${error.message}` });
		}
	}
};

