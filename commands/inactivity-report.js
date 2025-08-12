const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inactivity-report')
    .setDescription('Se mettre en pause: attribue un rôle spécial pour éviter l\'auto-kick d\'inactivité (retiré automatiquement lorsque vous redevenez actif)'),

  cooldown: 2,

  async execute(interaction) {
    const guild = interaction.guild;
    const member = interaction.member;
    const moderationManager = interaction.client.moderationManager;

    try {
      // Charger la config courante
      const cfg = await moderationManager.getGuildConfig(guild.id);

      // Déterminer/créer le rôle d'exemption automatique
      const desiredRoleName = cfg.inactivity?.autoExemptRoleName || 'Inactivité - Exempt';
      let roleId = cfg.inactivity?.autoExemptRoleId || null;
      let role = roleId ? guild.roles.cache.get(roleId) : null;

      if (!role) {
        role = guild.roles.cache.find(r => r.name === desiredRoleName)
          || guild.roles.cache.find(r => r.name.toLowerCase() === desiredRoleName.toLowerCase());
      }

      if (!role) {
        // Créer le rôle si possible
        const botMember = guild.members.me;
        const canManageRoles = botMember?.permissions.has(PermissionsBitField.Flags.ManageRoles);
        if (!canManageRoles) {
          return interaction.reply({ content: '❌ Je ne peux pas créer le rôle d\'exemption (permission Gérer les rôles manquante).', ephemeral: true });
        }
        role = await guild.roles.create({
          name: desiredRoleName,
          color: '#95a5a6',
          hoist: false,
          mentionable: false,
          reason: 'Rôle d\'exemption auto-kick inactivité',
        }).catch(() => null);
        if (!role) {
          return interaction.reply({ content: '❌ Impossible de créer le rôle d\'exemption.', ephemeral: true });
        }
      }

      // Persister dans la config sans écraser les autres champs
      const newInactivityCfg = {
        ...(cfg.inactivity || {}),
        autoExemptRoleId: role.id,
        autoExemptRoleName: role.name,
      };
      await moderationManager.setGuildConfig(guild.id, { inactivity: newInactivityCfg });

      // Attribuer le rôle au membre
      if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role, 'Demande de pause inactivité').catch(() => {});
      }

      return interaction.reply({ content: `✅ Pause inactivité activée. Vous ne serez pas auto-kick pour inactivité tant que vous avez le rôle \`${role.name}\`. Il sera retiré automatiquement dès que vous redeviendrez actif.`, ephemeral: true });
    } catch (e) {
      console.error('Erreur /inactivity-report:', e);
      return interaction.reply({ content: '❌ Une erreur est survenue lors de l\'activation de la pause inactivité.', ephemeral: true });
    }
  }
};