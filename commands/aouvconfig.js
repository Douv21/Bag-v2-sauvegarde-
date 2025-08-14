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
		.setDescription('Configurer le jeu Action ou Vérité (redirigé vers /config-aouv)')
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
		return interaction.reply({ content: 'ℹ️ Cette commande est désormais regroupée sous /config-aouv.', flags: 64 });
	}
};