const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-verification')
    .setDescription('Configurer les règles de vérification des membres')
    .addIntegerOption(o => o.setName('age_min_jours').setDescription("Âge minimal du compte (jours)").setMinValue(0))
    .addStringOption(o => o.setName('auto_action').setDescription('Action automatique au join pour haut risque')
      .addChoices(
        { name: 'aucune', value: 'none' },
        { name: 'journaliser', value: 'log' },
        { name: 'restreindre', value: 'restrict' },
        { name: 'kick', value: 'kick' },
        { name: 'ban', value: 'ban' }
      ))
    .addStringOption(o => o.setName('role_restreint').setDescription('Nom du rôle à attribuer (restreindre)'))
    .addBooleanOption(o => o.setName('autoriser_bots').setDescription('Autoriser les comptes bot à rejoindre'))
    .addBooleanOption(o => o.setName('verif_bans_autres').setDescription('Vérifier les bans sur autres serveurs (du bot)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 3,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
    }

    const vm = interaction.client.verificationManager;
    if (!vm) return interaction.reply({ content: '❌ Vérification indisponible.', flags: 64 });

    const guildId = interaction.guild.id;
    const updates = {};
    const age = interaction.options.getInteger('age_min_jours');
    const autoAction = interaction.options.getString('auto_action');
    const roleName = interaction.options.getString('role_restreint');
    const allowBots = interaction.options.getBoolean('autoriser_bots');
    const checkBans = interaction.options.getBoolean('verif_bans_autres');

    if (typeof age === 'number') updates.minimumAccountAgeDays = age;
    if (autoAction) updates.autoAction = autoAction;
    if (roleName) updates.restrictedRoleName = roleName;
    if (typeof allowBots === 'boolean') updates.allowBots = allowBots;
    if (typeof checkBans === 'boolean') updates.checkCrossGuildBans = checkBans;

    const next = await vm.setGuildConfig(guildId, updates);
    await interaction.reply({ content: `✅ Configuration mise à jour. Action auto: ${next.autoAction}, âge min: ${next.minimumAccountAgeDays}j, bots: ${next.allowBots ? 'oui' : 'non'}, bans autres serveurs: ${next.checkCrossGuildBans ? 'oui' : 'non'}, rôle restreint: ${next.restrictedRoleName}`, flags: 64 });
  }
};

