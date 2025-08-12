const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-moderation')
    .setDescription('Configurer auto-kick (rôle requis) et kick pour inactivité via sélecteurs')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé aux administrateurs.', ephemeral: true });
    }

    const guild = interaction.guild;
    const mod = interaction.client.moderationManager;
    const cfg = await mod.getGuildConfig(guild.id);

    // Rôles éditables (max 25)
    const roles = guild.roles.cache
      .filter(r => r.editable && r.name !== '@everyone')
      .sort((a, b) => b.position - a.position)
      .first(25);

    // Embed résumé
    const embed = new EmbedBuilder()
      .setTitle('🛡️ Configuration Modération')
      .setColor('#e91e63')
      .setDescription('Sélectionnez un rôle requis et un délai, puis définissez la durée d\'inactivité pour les kicks automatiques.')
      .addFields(
        {
          name: 'Rôle requis',
          value: cfg.roleEnforcement?.requiredRoleName ? `Actuel: ${cfg.roleEnforcement.requiredRoleName}` : 'Aucun',
          inline: true
        },
        {
          name: 'Délai rôle requis',
          value: `${Math.round((cfg.roleEnforcement?.gracePeriodMs || 7*24*60*60*1000) / (24*60*60*1000))} jours`,
          inline: true
        },
        {
          name: 'Inactivité',
          value: `${Math.round((cfg.inactivity?.thresholdMs || 30*24*60*60*1000)/(30*24*60*60*1000))} mois`,
          inline: true
        }
      );

    // Sélecteur du rôle requis (valeur = nom pour compat handler actuel)
    const roleSelect = new StringSelectMenuBuilder()
      .setCustomId('moderation_required_role')
      .setPlaceholder('Choisir le rôle requis')
      .addOptions(
        (roles || []).map(r => ({ label: r.name, value: r.name })).slice(0, 25)
      );

    // Sélecteur délai (jours) pour rôle requis
    const graceDaysSelect = new StringSelectMenuBuilder()
      .setCustomId('moderation_role_grace_days')
      .setPlaceholder('Délai rôle requis (jours)')
      .addOptions([
        { label: '2 jours', value: '2' },
        { label: '4 jours', value: '4' },
        { label: '5 jours', value: '5' },
        { label: '10 jours', value: '10' },
        { label: '20 jours', value: '20' },
        { label: '30 jours', value: '30' }
      ]);

    // Sélecteur inactivité (mois)
    const inactivityMonthsSelect = new StringSelectMenuBuilder()
      .setCustomId('moderation_inactivity_months')
      .setPlaceholder('Kick inactivité après...')
      .addOptions([
        { label: '1 mois', value: '1' },
        { label: '2 mois', value: '2' },
        { label: '3 mois', value: '3' },
        { label: '6 mois', value: '6' },
        { label: '12 mois', value: '12' }
      ]);

    // Nouveau: sélecteur rapide pour activer/désactiver les autokicks
    const quickToggleSelect = new StringSelectMenuBuilder()
      .setCustomId('moderation_autokick_select')
      .setPlaceholder('Activer/Désactiver: Autokick sans rôle / Autokick inactivité')
      .addOptions([
        { label: `Autokick sans rôle — ${cfg.roleEnforcement?.enabled ? 'Désactiver' : 'Activer'}`, value: 'role_toggle' },
        { label: `Autokick inactivité — ${cfg.inactivity?.enabled ? 'Désactiver' : 'Activer'}`, value: 'inactivity_toggle' }
      ]);

    // Boutons Activer/Désactiver (conservés)
    const toggles = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('moderation_toggle_role')
        .setStyle(ButtonStyle.Primary)
        .setLabel(cfg.roleEnforcement?.enabled ? 'Désactiver Rôle Requis' : 'Activer Rôle Requis'),
      new ButtonBuilder()
        .setCustomId('moderation_toggle_inactivity')
        .setStyle(ButtonStyle.Secondary)
        .setLabel(cfg.inactivity?.enabled ? 'Désactiver Inactivité' : 'Activer Inactivité')
    );

    const rows = [
      new ActionRowBuilder().addComponents(quickToggleSelect),
      new ActionRowBuilder().addComponents(roleSelect),
      new ActionRowBuilder().addComponents(graceDaysSelect),
      new ActionRowBuilder().addComponents(inactivityMonthsSelect),
      toggles
    ];

    return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
  }
};