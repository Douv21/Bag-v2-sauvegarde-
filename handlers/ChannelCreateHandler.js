const { ChannelType } = require('discord.js');
const QuarantineChannelManager = require('./QuarantineChannelManager');

/**
 * Gestionnaire pour l'événement de création de canaux
 * Applique automatiquement les restrictions de quarantaine sur les nouveaux canaux
 */
class ChannelCreateHandler {
  constructor(moderationManager) {
    this.moderationManager = moderationManager;
    this.quarantineManager = new QuarantineChannelManager(moderationManager);
  }

  /**
   * Gérer la création d'un nouveau canal
   * @param {Channel} channel - Le canal qui vient d'être créé
   */
  async handleChannelCreate(channel) {
    try {
      // Ignorer certains types de canaux
      if (![
        ChannelType.GuildText,
        ChannelType.GuildVoice,
        ChannelType.GuildCategory,
        ChannelType.GuildAnnouncement,
        ChannelType.GuildStageVoice,
        ChannelType.GuildForum
      ].includes(channel.type)) {
        return;
      }

      // Ignorer les canaux de quarantaine
      if (channel.name.toLowerCase().includes('quarantaine')) {
        return;
      }
      if (channel.parent && channel.parent.name.toLowerCase().includes('quarantaine')) {
        return;
      }

      console.log(`📝 Nouveau canal créé: ${channel.name} (${channel.type})`);

      // Vérifier si le système de quarantaine est configuré
      const config = await this.moderationManager.getSecurityConfig(channel.guild.id);
      if (!config.enabled || !config.accessControl?.quarantineRoleId) {
        return;
      }

      const quarantineRole = channel.guild.roles.cache.get(config.accessControl.quarantineRoleId);
      if (!quarantineRole) {
        console.warn(`⚠️ Rôle de quarantaine introuvable pour le serveur ${channel.guild.name}`);
        return;
      }

      // Vérifier si il y a des membres en quarantaine
      const quarantinedMembers = await this.quarantineManager.listQuarantinedMembers(channel.guild);
      if (quarantinedMembers.length === 0) {
        console.log(`✅ Aucun membre en quarantaine, pas de restrictions à appliquer sur ${channel.name}`);
        return;
      }

      // Appliquer les restrictions de quarantaine sur le nouveau canal
      await this.quarantineManager.applyQuarantineRestrictionsToNewChannel(channel, channel.guild);

      console.log(`🔒 Restrictions de quarantaine appliquées automatiquement sur le canal ${channel.name}`);

      // Optionnel: Notifier les admins si configuré
      if (config.autoAlerts?.alertChannelId && config.autoAlerts?.notifyChannelChanges) {
        const alertChannel = channel.guild.channels.cache.get(config.autoAlerts.alertChannelId);
        if (alertChannel) {
          try {
            await alertChannel.send({
              embeds: [{
                title: '📝 Nouveau canal configuré',
                description: `Restrictions de quarantaine appliquées automatiquement sur **${channel.name}**`,
                color: 0x51cf66,
                fields: [
                  {
                    name: 'Canal',
                    value: `${channel} (${channel.type})`,
                    inline: true
                  },
                  {
                    name: 'Membres affectés',
                    value: `${quarantinedMembers.length} membre(s) en quarantaine`,
                    inline: true
                  },
                  {
                    name: 'Action',
                    value: 'Restrictions appliquées automatiquement',
                    inline: false
                  }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                  text: 'Système de quarantaine automatique'
                }
              }]
            });
          } catch (notifError) {
            console.warn('Erreur notification canal créé:', notifError.message);
          }
        }
      }

    } catch (error) {
      console.error('Erreur lors du traitement de création de canal:', error);
      
      // En cas d'erreur, essayer de notifier les admins
      try {
        const config = await this.moderationManager.getSecurityConfig(channel.guild.id);
        if (config.autoAlerts?.alertChannelId) {
          const alertChannel = channel.guild.channels.cache.get(config.autoAlerts.alertChannelId);
          if (alertChannel) {
            await alertChannel.send({
              embeds: [{
                title: '❌ Erreur de configuration automatique',
                description: `Impossible d'appliquer les restrictions de quarantaine sur **${channel.name}**`,
                color: 0xff6b6b,
                fields: [
                  {
                    name: 'Erreur',
                    value: error.message.slice(0, 1024),
                    inline: false
                  },
                  {
                    name: 'Action recommandée',
                    value: 'Configurez manuellement avec `/quarantaine configurer-permissions`',
                    inline: false
                  }
                ],
                timestamp: new Date().toISOString()
              }]
            });
          }
        }
      } catch {}
    }
  }
}

module.exports = ChannelCreateHandler;