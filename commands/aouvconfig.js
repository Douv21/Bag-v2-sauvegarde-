const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');

async function getAll(dataManager) {
	return await dataManager.loadData('aouv_config.json', {});
}

async function getGuildCfg(dataManager, guildId) {
	const all = await getAll(dataManager);
	return all[guildId] || { allowedChannels: [], disabledBaseActions: [], disabledBaseTruths: [], customActions: [], customTruths: [] };
}

async function saveGuildCfg(dataManager, guildId, cfg) {
	const all = await getAll(dataManager);
	all[guildId] = cfg;
	await dataManager.saveData('aouv_config.json', all);
}

function ensureManager(interaction) {
	const member = interaction.member;
	const perms = member?.permissions;
	return Boolean(perms?.has(PermissionsBitField.Flags.ManageGuild) || perms?.has(PermissionsBitField.Flags.Administrator));
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('aouvconfig')
		.setDescription('Configurer le jeu Action ou Vérité')
		.addSubcommandGroup(g => g
			.setName('channel')
			.setDescription('Gérer les salons autorisés')
			.addSubcommand(s => s
				.setName('add')
				.setDescription('Autorise un salon pour AouV')
				.addChannelOption(o => o.setName('salon').setDescription('Salon texte').addChannelTypes(ChannelType.GuildText).setRequired(true)))
			.addSubcommand(s => s
				.setName('remove')
				.setDescription('Retire un salon autorisé')
				.addChannelOption(o => o.setName('salon').setDescription('Salon texte').addChannelTypes(ChannelType.GuildText).setRequired(true)))
			.addSubcommand(s => s
				.setName('list')
				.setDescription('Liste les salons autorisés'))
		)
		.addSubcommandGroup(g => g
			.setName('prompt')
			.setDescription('Gérer les prompts')
			.addSubcommand(s => s
				.setName('add')
				.setDescription('Ajouter un prompt personnalisé')
				.addStringOption(o => o.setName('kind').setDescription('action|verite').setRequired(true).addChoices({ name: 'action', value: 'action' }, { name: 'vérité', value: 'verite' }))
				.addStringOption(o => o.setName('texte').setDescription('Contenu du prompt').setRequired(true)))
			.addSubcommand(s => s
				.setName('edit')
				.setDescription('Modifier un prompt personnalisé par indice')
				.addStringOption(o => o.setName('kind').setDescription('action|verite').setRequired(true).addChoices({ name: 'action', value: 'action' }, { name: 'vérité', value: 'verite' }))
				.addIntegerOption(o => o.setName('index').setDescription("Indice (via list-custom)").setRequired(true))
				.addStringOption(o => o.setName('texte').setDescription('Nouveau contenu').setRequired(true)))
			.addSubcommand(s => s
				.setName('remove')
				.setDescription('Supprimer un prompt personnalisé par indice')
				.addStringOption(o => o.setName('kind').setDescription('action|verite').setRequired(true).addChoices({ name: 'action', value: 'action' }, { name: 'vérité', value: 'verite' }))
				.addIntegerOption(o => o.setName('index').setDescription('Indice à supprimer').setRequired(true)))
			.addSubcommand(s => s
				.setName('list-custom')
				.setDescription('Lister prompts personnalisés'))
			.addSubcommand(s => s
				.setName('disable-base')
				.setDescription('Désactiver un prompt de base')
				.addStringOption(o => o.setName('kind').setDescription('action|verite').setRequired(true).addChoices({ name: 'action', value: 'action' }, { name: 'vérité', value: 'verite' }))
				.addIntegerOption(o => o.setName('numero').setDescription('Numéro (1..n) du prompt de base').setRequired(true)))
			.addSubcommand(s => s
				.setName('enable-base')
				.setDescription('Réactiver un prompt de base')
				.addStringOption(o => o.setName('kind').setDescription('action|verite').setRequired(true).addChoices({ name: 'action', value: 'action' }, { name: 'vérité', value: 'verite' }))
				.addIntegerOption(o => o.setName('numero').setDescription('Numéro (1..n) du prompt de base').setRequired(true)))
		),

	async execute(interaction, dataManager) {
		if (!interaction.guild) return interaction.reply({ content: 'Serveur uniquement.', flags: 64 });
		if (!ensureManager(interaction)) return interaction.reply({ content: '❌ Permission requise: Gérer le serveur.', flags: 64 });
		const subGroup = interaction.options.getSubcommandGroup();
		const sub = interaction.options.getSubcommand();
		const guildId = interaction.guild.id;
		const cfg = await getGuildCfg(dataManager, guildId);

		if (subGroup === 'channel') {
			if (sub === 'add') {
				const ch = interaction.options.getChannel('salon', true);
				const allowed = new Set(cfg.allowedChannels || []);
				allowed.add(ch.id);
				cfg.allowedChannels = Array.from(allowed);
				await saveGuildCfg(dataManager, guildId, cfg);
				return interaction.reply({ content: `Salon autorisé: <#${ch.id}>`, flags: 64 });
			}
			if (sub === 'remove') {
				const ch = interaction.options.getChannel('salon', true);
				cfg.allowedChannels = (cfg.allowedChannels || []).filter(id => id !== ch.id);
				await saveGuildCfg(dataManager, guildId, cfg);
				return interaction.reply({ content: `Salon retiré: <#${ch.id}>`, flags: 64 });
			}
			if (sub === 'list') {
				const list = (cfg.allowedChannels || []).map(id => `<#${id}>`).join(', ') || '(Aucun)';
				return interaction.reply({ content: `Salons autorisés: ${list}`, flags: 64 });
			}
		}

		if (subGroup === 'prompt') {
			if (sub === 'add') {
				const kind = interaction.options.getString('kind', true);
				const texte = interaction.options.getString('texte', true);
				if (kind === 'action') cfg.customActions = [...(cfg.customActions || []), texte];
				else cfg.customTruths = [...(cfg.customTruths || []), texte];
				await saveGuildCfg(dataManager, guildId, cfg);
				return interaction.reply({ content: 'Ajouté.', flags: 64 });
			}
			if (sub === 'edit') {
				const kind = interaction.options.getString('kind', true);
				const index = interaction.options.getInteger('index', true);
				const texte = interaction.options.getString('texte', true);
				if (kind === 'action') {
					if (!Array.isArray(cfg.customActions) || index < 0 || index >= cfg.customActions.length) return interaction.reply({ content: 'Indice invalide.', flags: 64 });
					cfg.customActions[index] = texte;
				} else {
					if (!Array.isArray(cfg.customTruths) || index < 0 || index >= cfg.customTruths.length) return interaction.reply({ content: 'Indice invalide.', flags: 64 });
					cfg.customTruths[index] = texte;
				}
				await saveGuildCfg(dataManager, guildId, cfg);
				return interaction.reply({ content: 'Modifié.', flags: 64 });
			}
			if (sub === 'remove') {
				const kind = interaction.options.getString('kind', true);
				const index = interaction.options.getInteger('index', true);
				if (kind === 'action') {
					if (!Array.isArray(cfg.customActions) || index < 0 || index >= cfg.customActions.length) return interaction.reply({ content: 'Indice invalide.', flags: 64 });
					cfg.customActions.splice(index, 1);
				} else {
					if (!Array.isArray(cfg.customTruths) || index < 0 || index >= cfg.customTruths.length) return interaction.reply({ content: 'Indice invalide.', flags: 64 });
					cfg.customTruths.splice(index, 1);
				}
				await saveGuildCfg(dataManager, guildId, cfg);
				return interaction.reply({ content: 'Supprimé.', flags: 64 });
			}
			if (sub === 'list-custom') {
				const a = (cfg.customActions || []).map((t, i) => `A${i}: ${t}`).join('\n') || '(Aucune action personnalisée)';
				const v = (cfg.customTruths || []).map((t, i) => `V${i}: ${t}`).join('\n') || '(Aucune vérité personnalisée)';
				return interaction.reply({ content: `Actions:\n${a}\n\nVérités:\n${v}`, flags: 64 });
			}
			if (sub === 'disable-base' || sub === 'enable-base') {
				const kind = interaction.options.getString('kind', true);
				const numero = interaction.options.getInteger('numero', true);
				const idx = Math.max(1, numero) - 1;
				const key = kind === 'action' ? 'disabledBaseActions' : 'disabledBaseTruths';
				const set = new Set(cfg[key] || []);
				if (sub === 'disable-base') set.add(idx);
				else set.delete(idx);
				cfg[key] = Array.from(set);
				await saveGuildCfg(dataManager, guildId, cfg);
				return interaction.reply({ content: `${sub === 'disable-base' ? 'Désactivé' : 'Réactivé'}: ${kind} #${numero}`, flags: 64 });
			}
		}
	}
};