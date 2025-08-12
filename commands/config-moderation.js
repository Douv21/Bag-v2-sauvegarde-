const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-moderation')
    .setDescription('Configurer l\'auto-kick et les règles de modération')
    .addBooleanOption(o => o.setName('role_enforce').setDescription('Activer l\'exigence de rôle'))
    .addStringOption(o => o.setName('role_name').setDescription('Rôle requis (nom)'))
    .addIntegerOption(o => o.setName('role_grace_days').setDescription('Jours de délai pour obtenir le rôle').setMinValue(1).setMaxValue(60))
    .addBooleanOption(o => o.setName('inactivity_enable').setDescription('Activer l\'auto-kick pour inactivité'))
    .addIntegerOption(o => o.setName('inactivity_days').setDescription('Jours d\'inactivité').setMinValue(3).setMaxValue(365))
    .addStringOption(o => o.setName('exempt_role_names').setDescription('Noms de rôles exemptés, séparés par des virgules'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
    }

    const guild = interaction.guild;
    const mod = interaction.client.moderationManager;

    const roleEnforce = interaction.options.getBoolean('role_enforce');
    const roleName = interaction.options.getString('role_name');
    const roleGrace = interaction.options.getInteger('role_grace_days');
    const inactivityEnable = interaction.options.getBoolean('inactivity_enable');
    const inactivityDays = interaction.options.getInteger('inactivity_days');
    const exemptRoleNames = (interaction.options.getString('exempt_role_names') || '').split(',').map(s => s.trim()).filter(Boolean);

    const current = await mod.getGuildConfig(guild.id);
    const updates = { ...current };
    if (roleEnforce !== null) updates.roleEnforcement = { ...(updates.roleEnforcement || {}), enabled: roleEnforce };
    if (roleName) updates.roleEnforcement = { ...(updates.roleEnforcement || {}), requiredRoleName: roleName };
    if (roleGrace) updates.roleEnforcement = { ...(updates.roleEnforcement || {}), gracePeriodMs: roleGrace * 24 * 60 * 60 * 1000 };
    if (inactivityEnable !== null) updates.inactivity = { ...(updates.inactivity || {}), enabled: inactivityEnable };
    if (inactivityDays) updates.inactivity = { ...(updates.inactivity || {}), thresholdMs: inactivityDays * 24 * 60 * 60 * 1000 };
    if (exemptRoleNames.length > 0) updates.inactivity = { ...(updates.inactivity || {}), exemptRoleNames };

    await mod.setGuildConfig(guild.id, updates);
    return interaction.reply({ content: '✅ Configuration mise à jour.', flags: 64 });
  }
};