const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('moderation')
    .setDescription('Outils de modération (admin)')
    .addSubcommand(sc => sc
      .setName('ban')
      .setDescription('Bannir un membre')
      .addUserOption(o => o.setName('membre').setDescription('Membre à bannir').setRequired(true))
      .addStringOption(o => o.setName('raison').setDescription('Raison'))
    )
    .addSubcommand(sc => sc
      .setName('unban')
      .setDescription('Débannir un utilisateur par ID')
      .addStringOption(o => o.setName('userid').setDescription('ID utilisateur').setRequired(true))
      .addStringOption(o => o.setName('raison').setDescription('Raison'))
    )
    .addSubcommand(sc => sc
      .setName('kick')
      .setDescription('Expulser un membre')
      .addUserOption(o => o.setName('membre').setDescription('Membre à expulser').setRequired(true))
      .addStringOption(o => o.setName('raison').setDescription('Raison'))
    )
    .addSubcommand(sc => sc
      .setName('mute')
      .setDescription('Rendre muet un membre (timeout)')
      .addUserOption(o => o.setName('membre').setDescription('Membre à mute').setRequired(true))
      .addIntegerOption(o => o.setName('minutes').setDescription('Durée en minutes (max 40320 = 28 jours)').setMinValue(1))
      .addStringOption(o => o.setName('raison').setDescription('Raison'))
    )
    .addSubcommand(sc => sc
      .setName('unmute')
      .setDescription('Retirer le mute (timeout)')
      .addUserOption(o => o.setName('membre').setDescription('Membre à unmute').setRequired(true))
      .addStringOption(o => o.setName('raison').setDescription('Raison'))
    )
    .addSubcommand(sc => sc
      .setName('warn')
      .setDescription('Avertir un membre')
      .addUserOption(o => o.setName('membre').setDescription('Membre à avertir').setRequired(true))
      .addStringOption(o => o.setName('raison').setDescription('Raison'))
    )
    .addSubcommand(sc => sc
      .setName('unwarn')
      .setDescription('Retirer le dernier avertissement d\'un membre')
      .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
    )
    .addSubcommand(sc => sc
      .setName('massban')
      .setDescription('Bannir plusieurs utilisateurs (IDs séparés par des espaces)')
      .addStringOption(o => o.setName('userids').setDescription('IDs utilisateurs').setRequired(true))
      .addStringOption(o => o.setName('raison').setDescription('Raison'))
    )
    .addSubcommand(sc => sc
      .setName('masskick')
      .setDescription('Expulser plusieurs membres (@mentions ou IDs séparés par des espaces)')
      .addStringOption(o => o.setName('membres').setDescription('Mentions/IDs').setRequired(true))
      .addStringOption(o => o.setName('raison').setDescription('Raison'))
    )
    .addSubcommand(sc => sc
      .setName('purge')
      .setDescription('Vider le salon courant et restaurer les paramètres spéciaux')
      .addIntegerOption(o => o.setName('messages').setDescription('Nombre de messages à supprimer (optionnel, sinon purge étendue)').setMinValue(1).setMaxValue(100))
    )
    .addSubcommand(sc => sc
      .setName('config')
      .setDescription('Configurer l\'auto-kick et les règles')
      .addBooleanOption(o => o.setName('role_enforce').setDescription('Activer l\'exigence de rôle'))
      .addStringOption(o => o.setName('role_name').setDescription('Rôle requis (nom)'))
      .addIntegerOption(o => o.setName('role_grace_days').setDescription('Jours de délai pour obtenir le rôle').setMinValue(1).setMaxValue(60))
      .addBooleanOption(o => o.setName('inactivity_enable').setDescription('Activer l\'auto-kick pour inactivité'))
      .addIntegerOption(o => o.setName('inactivity_days').setDescription('Jours d\'inactivité').setMinValue(3).setMaxValue(365))
      .addStringOption(o => o.setName('exempt_role_names').setDescription('Noms de rôles exemptés, séparés par des virgules'))
    )
    .addSubcommand(sc => sc
      .setName('inactivity-report')
      .setDescription('Signaler une activité récente pour éviter l\'auto-kick')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.toString()),

  cooldown: 2,

  async execute(interaction, dataManager) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;

    // Autoriser /moderation inactivity-report à tout le monde
    if (sub !== 'inactivity-report') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: 64 });
      }
    }

    const mod = interaction.client.moderationManager;

    try {
      if (sub === 'ban') {
        const user = interaction.options.getUser('membre', true);
        const reason = interaction.options.getString('raison') || 'Aucun motif';
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: 'Utilisateur introuvable dans ce serveur.', flags: 64 });
        await member.ban({ reason });
        return interaction.reply({ content: `✅ ${user.tag} a été banni.`, flags: 64 });
      }

      if (sub === 'unban') {
        const userId = interaction.options.getString('userid', true);
        const reason = interaction.options.getString('raison') || 'Aucun motif';
        await guild.bans.remove(userId, reason).catch(() => {});
        return interaction.reply({ content: `✅ Utilisateur ${userId} débanni.`, flags: 64 });
      }

      if (sub === 'kick') {
        const user = interaction.options.getUser('membre', true);
        const reason = interaction.options.getString('raison') || 'Aucun motif';
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: 'Utilisateur introuvable.', flags: 64 });
        await member.kick(reason);
        return interaction.reply({ content: `✅ ${user.tag} a été expulsé.`, flags: 64 });
      }

      if (sub === 'mute') {
        const user = interaction.options.getUser('membre', true);
        const minutes = interaction.options.getInteger('minutes') || 60;
        const reason = interaction.options.getString('raison') || 'Aucun motif';
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: 'Utilisateur introuvable.', flags: 64 });
        await mod.muteMember(member, minutes * 60 * 1000, reason);
        return interaction.reply({ content: `✅ ${user.tag} a été mute ${minutes} min.`, flags: 64 });
      }

      if (sub === 'unmute') {
        const user = interaction.options.getUser('membre', true);
        const reason = interaction.options.getString('raison') || 'Aucun motif';
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: 'Utilisateur introuvable.', flags: 64 });
        await mod.unmuteMember(member, reason);
        return interaction.reply({ content: `✅ ${user.tag} a été unmute.`, flags: 64 });
      }

      if (sub === 'warn') {
        const user = interaction.options.getUser('membre', true);
        const reason = interaction.options.getString('raison') || 'Aucun motif';
        const warnings = await mod.addWarning(guild.id, user.id, interaction.user.id, reason);
        return interaction.reply({ content: `⚠️ Warn ajouté à ${user.tag}. Total: ${warnings.length}`, flags: 64 });
      }

      if (sub === 'unwarn') {
        const user = interaction.options.getUser('membre', true);
        const removed = await mod.removeLastWarning(guild.id, user.id);
        if (!removed) return interaction.reply({ content: `❌ Aucun warn à retirer pour ${user.tag}.`, flags: 64 });
        return interaction.reply({ content: `✅ Dernier warn retiré pour ${user.tag}.`, flags: 64 });
      }

      if (sub === 'massban') {
        const ids = (interaction.options.getString('userids', true) || '').split(/\s+/).filter(Boolean);
        const reason = interaction.options.getString('raison') || 'Aucun motif';
        let success = 0; let failed = 0;
        for (const id of ids) {
          await guild.bans.create(id, { reason }).then(() => success++).catch(() => failed++);
        }
        return interaction.reply({ content: `✅ Massban terminé. Réussis: ${success}, Échecs: ${failed}`, flags: 64 });
      }

      if (sub === 'masskick') {
        const input = interaction.options.getString('membres', true);
        const reason = interaction.options.getString('raison') || 'Aucun motif';
        const ids = input.match(/\d{16,20}/g) || [];
        let success = 0; let failed = 0;
        for (const id of ids) {
          const member = await guild.members.fetch(id).catch(() => null);
          if (!member) { failed++; continue; }
          await member.kick(reason).then(() => success++).catch(() => failed++);
        }
        return interaction.reply({ content: `✅ Masskick terminé. Réussis: ${success}, Échecs: ${failed}`, flags: 64 });
      }

      if (sub === 'purge') {
        const count = interaction.options.getInteger('messages');
        const channel = interaction.channel;
        if (count && count > 0) {
          const deleted = await channel.bulkDelete(count, true).catch(() => null);
          return interaction.reply({ content: `🧹 ${deleted?.size || 0} messages supprimés.`, flags: 64 });
        } else {
          await interaction.deferReply({ flags: 64 });
          await mod.purgeChannel(channel, { resetFeatures: true });
          return interaction.editReply({ content: '🧹 Salon vidé et paramètres restaurés (confession, counting, autothread, ...).' });
        }
      }

      if (sub === 'config') {
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

        const saved = await mod.setGuildConfig(guild.id, updates);
        return interaction.reply({ content: '✅ Configuration mise à jour.', flags: 64 });
      }

      if (sub === 'inactivity-report') {
        await interaction.client.moderationManager.markActive(guild.id, interaction.user.id);
        return interaction.reply({ content: '✅ Activité signalée. Vous ne serez pas auto-kick pour inactivité.', flags: 64 });
      }

      return interaction.reply({ content: '❌ Sous-commande inconnue.', flags: 64 });
    } catch (e) {
      console.error('Erreur commande /moderation:', e);
      if (interaction.deferred || interaction.replied) {
        return interaction.followUp({ content: '❌ Erreur lors de la commande.', flags: 64 }).catch(() => {});
      }
      return interaction.reply({ content: '❌ Erreur lors de la commande.', flags: 64 }).catch(() => {});
    }
  }
};