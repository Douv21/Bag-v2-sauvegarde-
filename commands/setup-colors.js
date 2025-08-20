const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ROLE_STYLES } = require('../utils/rolePalette');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup-colors')
		.setDescription('Créer les rôles « couleur/style » de la palette')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

	async execute(interaction) {
		if (!interaction.inGuild()) {
			return interaction.reply({ content: 'Cette commande doit être utilisée dans un serveur.', flags: 64 });
		}

		if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return interaction.reply({ content: '❌ Permission requise: Administrateur.', flags: 64 });
		}

		await interaction.deferReply({ ephemeral: true });

		const results = [];
		for (const style of ROLE_STYLES) {
			try {
				const existing = interaction.guild.roles.cache.find(r => r.name === style.name);
				if (existing) {
					results.push(`Déjà présent: ${style.name}`);
					continue;
				}
				const role = await interaction.guild.roles.create({
					name: style.name,
					color: style.color,
					hoist: false,
					mentionable: false,
					reason: 'Palette auto (setup-colors)'
				});

				// Positionner le rôle créé le plus haut possible (juste sous le rôle le plus haut du bot)
				try {
					let me = interaction.guild.members.me;
					if (!me) {
						try {
							if (typeof interaction.guild.members.fetchMe === 'function') {
								me = await interaction.guild.members.fetchMe();
							} else {
								me = await interaction.guild.members.fetch(interaction.client.user.id).catch(() => null);
							}
						} catch {}
					}
					if (me) {
						const targetPosition = Math.max(1, me.roles.highest.position - 1);
						await role.setPosition(targetPosition, { reason: 'Positionner le rôle de couleur sous le rôle du bot (setup-colors)' });
					}
				} catch (e) {
					console.warn('Impossible de positionner le rôle de couleur (setup) au plus haut:', e?.message);
				}
				results.push(`Créé: ${role.name}`);
			} catch (error) {
				results.push(`Erreur: ${style.name} (${error.message})`);
			}
		}

		// Tentative de repositionnement en bloc de tous les rôles de la palette juste sous le rôle le plus haut du bot
		try {
			let me = interaction.guild.members.me;
			if (!me) {
				try {
					if (typeof interaction.guild.members.fetchMe === 'function') {
						me = await interaction.guild.members.fetchMe();
					} else {
						me = await interaction.guild.members.fetch(interaction.client.user.id).catch(() => null);
					}
				} catch {}
			}
			if (me) {
				const targetTop = Math.max(1, me.roles.highest.position - 1);
				const paletteNames = new Map(ROLE_STYLES.map((s, i) => [s.name, i]));
				const paletteRoles = interaction.guild.roles.cache
					.filter(r => paletteNames.has(r.name))
					.sort((a, b) => paletteNames.get(a.name) - paletteNames.get(b.name));
				let offset = 0;
				for (const role of paletteRoles.values()) {
					try { await role.setPosition(targetTop - offset, { reason: 'Repositionnement palette de couleurs (setup-colors)' }); } catch {}
					offset += 1;
				}
			}
		} catch (_) {}

		return interaction.editReply({ content: `Terminé.\n${results.join('\n')}` });
	}
};