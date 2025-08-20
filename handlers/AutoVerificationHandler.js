const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class AutoVerificationHandler {
  constructor(moderationManager) {
    this.moderationManager = moderationManager;
    this.pendingVerifications = new Map(); // userId -> timeout
  }

  /**
   * Vérifier automatiquement un nouveau membre
   * @param {GuildMember} member - Le membre qui vient d'arriver
   */
  async verifyNewMember(member) {
    try {
      const config = await this.moderationManager.getSecurityConfig(member.guild.id);
      
      // Vérifier si le système est activé
      if (!config.enabled || !config.autoVerification?.enabled) {
        return;
      }

      // Vérifier si le membre est exempté
      const isExempted = await this.moderationManager.isUserWhitelisted(
        member.guild.id, 
        member.user.id, 
        member
      );
      
      if (isExempted) {
        console.log(`✅ Membre exempté de vérification: ${member.user.tag}`);
        return;
      }

      // Effectuer l'analyse de sécurité
      const analysis = await this.performSecurityAnalysis(member, config);
      
      // Déterminer l'action à prendre
      const action = this.determineAction(analysis, config);
      
      // Exécuter l'action
      await this.executeAction(member, action, analysis, config);

    } catch (error) {
      console.error('Erreur vérification automatique:', error);
      
      // En cas d'erreur, notifier les admins
      try {
        await this.notifyError(member, error);
      } catch {}
    }
  }

  /**
   * Effectuer l'analyse de sécurité complète
   * @param {GuildMember} member - Le membre à analyser
   * @param {Object} config - Configuration de sécurité
   * @returns {Object} Résultats de l'analyse
   */
  async performSecurityAnalysis(member, config) {
    const user = member.user;
    
    // Analyses en parallèle
    const [
      securityAnalysis,
      multiAccountCheck,
      raidCheck,
      genderInfo
    ] = await Promise.all([
      this.moderationManager.analyzeUserSecurity(member.guild, user),
      this.moderationManager.detectMultiAccounts(member.guild, user),
      this.moderationManager.checkRaidIndicators(member.guild, user),
      this.moderationManager.analyzeGenderInfo(user)
    ]);

    // Calculs spécifiques
    const accountAge = Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24));
    const suspiciousName = this.checkSuspiciousName(user.username);
    
    return {
      accountAge,
      riskScore: securityAnalysis.riskScore,
      multiAccountConfidence: multiAccountCheck.confidence,
      multiAccountCount: multiAccountCheck.totalSuspects,
      isRaidSuspect: raidCheck.isRaidSuspect,
      suspiciousName,
      flags: securityAnalysis.flags,
      recommendations: securityAnalysis.recommendations,
      fullAnalysis: {
        security: securityAnalysis,
        multiAccount: multiAccountCheck,
        raid: raidCheck,
        gender: genderInfo
      }
    };
  }

  /**
   * Déterminer l'action à prendre basée sur l'analyse
   * @param {Object} analysis - Résultats de l'analyse
   * @param {Object} config - Configuration de sécurité
   * @returns {String} Action à prendre
   */
  determineAction(analysis, config) {
    const actions = config.autoVerification?.actions || {};
    
    // Priorité 1: Compte trop récent
    if (config.autoVerification?.minimumAccountAge && 
        analysis.accountAge < config.autoVerification.minimumAccountAge) {
      return actions.recentAccount || 'QUARANTINE';
    }
    
    // Priorité 2: Multi-comptes suspects
    if (config.autoVerification?.multiAccountThreshold && 
        analysis.multiAccountConfidence >= config.autoVerification.multiAccountThreshold) {
      return actions.multiAccount || 'ADMIN_APPROVAL';
    }
    
    // Priorité 3: Score de risque élevé
    if (config.autoVerification?.maxRiskScore && 
        analysis.riskScore > config.autoVerification.maxRiskScore) {
      return actions.suspiciousName || 'QUARANTINE';
    }
    
    // Priorité 4: Nom suspect
    if (analysis.suspiciousName && actions.suspiciousName) {
      return actions.suspiciousName;
    }
    
    // Priorité 5: Suspect de raid
    if (analysis.isRaidSuspect) {
      return 'ADMIN_APPROVAL';
    }
    
    // Aucun problème détecté
    return 'APPROVE';
  }

  /**
   * Exécuter l'action déterminée
   * @param {GuildMember} member - Le membre
   * @param {String} action - Action à exécuter
   * @param {Object} analysis - Résultats de l'analyse
   * @param {Object} config - Configuration
   */
  async executeAction(member, action, analysis, config) {
    console.log(`🔍 Action automatique pour ${member.user.tag}: ${action}`);
    
    switch (action) {
      case 'APPROVE':
        await this.approveMember(member, config);
        break;
        
      case 'QUARANTINE':
        await this.quarantineMember(member, analysis, config);
        break;
        
      case 'ADMIN_APPROVAL':
        await this.requestAdminApproval(member, analysis, config);
        break;
        
      case 'KICK':
        await this.kickMember(member, analysis, config);
        break;
        
      case 'BAN':
        await this.banMember(member, analysis, config);
        break;
        
      case 'ALERT':
        await this.sendAlert(member, analysis, config);
        break;
        
      default:
        console.warn(`Action inconnue: ${action}`);
        await this.quarantineMember(member, analysis, config);
    }
  }

  /**
   * Approuver automatiquement un membre
   */
  async approveMember(member, config) {
    try {
      // Ajouter le rôle vérifié si configuré
      if (config.accessControl?.verifiedRoleId) {
        const verifiedRole = member.guild.roles.cache.get(config.accessControl.verifiedRoleId);
        if (verifiedRole) {
          await member.roles.add(verifiedRole, 'Vérification automatique réussie');
        }
      }
      
      console.log(`✅ Membre approuvé automatiquement: ${member.user.tag}`);
    } catch (error) {
      console.error('Erreur approbation automatique:', error);
    }
  }

  /**
   * Mettre un membre en quarantaine
   */
  async quarantineMember(member, analysis, config) {
    try {
      // Ajouter le rôle de quarantaine
      if (config.accessControl?.quarantineRoleId) {
        const quarantineRole = member.guild.roles.cache.get(config.accessControl.quarantineRoleId);
        if (quarantineRole) {
          await member.roles.add(quarantineRole, 'Quarantaine automatique - Vérification requise');
        }
      }

      // Notifier le membre
      try {
        await member.send(
          `🔒 **Quarantaine automatique - ${member.guild.name}**\n\n` +
          `Votre compte a été automatiquement placé en quarantaine pour vérification.\n\n` +
          `**Raisons possibles :**\n` +
          `• Compte récent (${analysis.accountAge} jour(s))\n` +
          `• Score de risque élevé (${analysis.riskScore}/100)\n` +
          `• Multi-comptes suspects détectés\n\n` +
          `Un administrateur examinera votre cas prochainement. Merci de patienter.`
        );
      } catch {}

      // Envoyer notification aux admins
      await this.sendQuarantineAlert(member, analysis, config);
      
      console.log(`🔒 Membre mis en quarantaine: ${member.user.tag}`);
    } catch (error) {
      console.error('Erreur mise en quarantaine:', error);
    }
  }

  /**
   * Demander approbation admin avec boutons
   */
  async requestAdminApproval(member, analysis, config) {
    try {
      const embed = this.createVerificationEmbed(member, analysis, 'PENDING');
      const buttons = this.createActionButtons(member.user.id);
      
      const alertChannel = member.guild.channels.cache.get(config.autoAlerts?.alertChannelId);
      if (alertChannel) {
        const message = await alertChannel.send({
          content: config.autoAlerts?.mentionModerators && config.autoAlerts?.moderatorRoleId 
            ? `<@&${config.autoAlerts.moderatorRoleId}> **Approbation requise**` 
            : '**Approbation admin requise**',
          embeds: [embed],
          components: [buttons]
        });

        // Programmer l'action automatique après délai
        if (config.autoVerification?.adminApproval?.timeoutMinutes) {
          this.scheduleTimeout(member, message, config);
        }
      }
      
      // Mettre en quarantaine temporairement
      await this.quarantineMember(member, analysis, config);
      
      console.log(`👨‍💼 Approbation admin demandée pour: ${member.user.tag}`);
    } catch (error) {
      console.error('Erreur demande approbation:', error);
    }
  }

  /**
   * Kicker un membre automatiquement
   */
  async kickMember(member, analysis, config) {
    try {
      const reason = `Kick automatique - Score risque: ${analysis.riskScore}/100`;
      
      // Notifier le membre
      try {
        await member.send(
          `👢 **Expulsé automatiquement - ${member.guild.name}**\n\n` +
          `Votre compte a été automatiquement expulsé pour des raisons de sécurité.\n\n` +
          `**Détails :**\n` +
          `• Score de risque: ${analysis.riskScore}/100\n` +
          `• Compte âgé de: ${analysis.accountAge} jour(s)\n` +
          `• Multi-comptes: ${analysis.multiAccountCount} suspect(s)\n\n` +
          `Si vous pensez qu'il s'agit d'une erreur, contactez les administrateurs.`
        );
      } catch {}

      await member.kick(reason);
      await this.sendActionAlert(member, 'KICK', analysis, config);
      
      console.log(`👢 Membre kické automatiquement: ${member.user.tag}`);
    } catch (error) {
      console.error('Erreur kick automatique:', error);
    }
  }

  /**
   * Bannir un membre automatiquement
   */
  async banMember(member, analysis, config) {
    try {
      const reason = `Ban automatique - Score risque: ${analysis.riskScore}/100`;
      
      // Notifier le membre
      try {
        await member.send(
          `🔨 **Banni automatiquement - ${member.guild.name}**\n\n` +
          `Votre compte a été automatiquement banni pour des raisons de sécurité.\n\n` +
          `**Détails :**\n` +
          `• Score de risque: ${analysis.riskScore}/100\n` +
          `• Compte âgé de: ${analysis.accountAge} jour(s)\n` +
          `• Multi-comptes: ${analysis.multiAccountCount} suspect(s)\n\n` +
          `Si vous pensez qu'il s'agit d'une erreur, contactez les administrateurs.`
        );
      } catch {}

      await member.ban({ reason, deleteMessageDays: 1 });
      await this.sendActionAlert(member, 'BAN', analysis, config);
      
      console.log(`🔨 Membre banni automatiquement: ${member.user.tag}`);
    } catch (error) {
      console.error('Erreur ban automatique:', error);
    }
  }

  /**
   * Envoyer une alerte sans action
   */
  async sendAlert(member, analysis, config) {
    try {
      const embed = this.createVerificationEmbed(member, analysis, 'ALERT');
      
      const alertChannel = member.guild.channels.cache.get(config.autoAlerts?.alertChannelId);
      if (alertChannel) {
        await alertChannel.send({
          content: '📢 **Alerte sécurité**',
          embeds: [embed]
        });
      }
      
      console.log(`📢 Alerte envoyée pour: ${member.user.tag}`);
    } catch (error) {
      console.error('Erreur envoi alerte:', error);
    }
  }

  /**
   * Créer l'embed de vérification
   */
  createVerificationEmbed(member, analysis, status) {
    const colors = {
      PENDING: 0xffd43b,
      ALERT: 0xff922b,
      APPROVED: 0x51cf66,
      REJECTED: 0xff6b6b
    };

    const embed = new EmbedBuilder()
      .setTitle('🔍 Vérification Automatique')
      .setDescription(`**${member.user.tag}** vient de rejoindre le serveur`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setColor(colors[status] || 0x6c757d)
      .setTimestamp();

    // Informations de base
    embed.addFields({
      name: '👤 Informations',
      value: `**ID :** ${member.user.id}\n` +
             `**Compte créé :** ${new Date(member.user.createdTimestamp).toLocaleDateString('fr-FR')}\n` +
             `**Âge :** ${analysis.accountAge} jour(s)\n` +
             `**Avatar :** ${member.user.avatar ? '✅ Personnalisé' : '❌ Par défaut'}`,
      inline: true
    });

    // Analyse de risque
    embed.addFields({
      name: '📊 Analyse de risque',
      value: `**Score :** ${analysis.riskScore}/100\n` +
             `**Multi-comptes :** ${analysis.multiAccountCount} (${analysis.multiAccountConfidence}%)\n` +
             `**Raid suspect :** ${analysis.isRaidSuspect ? '🚨 Oui' : '✅ Non'}\n` +
             `**Nom suspect :** ${analysis.suspiciousName ? '⚠️ Oui' : '✅ Non'}`,
      inline: true
    });

    // Drapeaux si présents
    if (analysis.flags.length > 0) {
      embed.addFields({
        name: '🚩 Drapeaux détectés',
        value: analysis.flags.slice(0, 5).join('\n'),
        inline: false
      });
    }

    return embed;
  }

  /**
   * Créer les boutons d'action
   */
  createActionButtons(userId) {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`security_approve_${userId}`)
          .setLabel('Approuver')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`security_deny_${userId}`)
          .setLabel('Refuser & Kick')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌'),
        new ButtonBuilder()
          .setCustomId(`security_quarantine_${userId}`)
          .setLabel('Quarantaine')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔒'),
        new ButtonBuilder()
          .setCustomId(`security_details_${userId}`)
          .setLabel('Détails')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🔍')
      );
  }

  /**
   * Programmer un timeout pour action automatique
   */
  scheduleTimeout(member, message, config) {
    const timeoutMs = (config.autoVerification?.adminApproval?.timeoutMinutes || 60) * 60 * 1000;
    
    const timeout = setTimeout(async () => {
      try {
        // Vérifier si le membre est toujours là et en quarantaine
        const currentMember = await member.guild.members.fetch(member.user.id).catch(() => null);
        if (!currentMember) return;

        const quarantineRoleId = config.accessControl?.quarantineRoleId;
        if (quarantineRoleId && !currentMember.roles.cache.has(quarantineRoleId)) return;

        // Exécuter l'action par défaut
        const defaultAction = config.autoVerification?.adminApproval?.defaultAction || 'KICK';
        
        if (defaultAction === 'KICK') {
          await currentMember.kick('Timeout - Aucune décision admin dans les délais');
        } else if (defaultAction === 'BAN') {
          await currentMember.ban({ reason: 'Timeout - Aucune décision admin dans les délais' });
        }

        // Mettre à jour le message
        const embed = message.embeds[0];
        embed.setColor(0x6c757d);
        embed.setTitle('⏰ Timeout - Action automatique exécutée');
        
        await message.edit({
          embeds: [embed],
          components: []
        });

        console.log(`⏰ Timeout exécuté pour ${member.user.tag}: ${defaultAction}`);
      } catch (error) {
        console.error('Erreur timeout automatique:', error);
      }
    }, timeoutMs);

    this.pendingVerifications.set(member.user.id, timeout);
  }

  /**
   * Vérifier si un nom d'utilisateur est suspect
   */
  checkSuspiciousName(username) {
    const suspiciousPatterns = [
      /^[a-z]+\d{4,}$/, // lettres + nombreux chiffres
      /^user\d+$/i, // user123
      /^guest\d+$/i, // guest123
      /^test\d*$/i, // test, test123
      /^[a-z]{1,3}\d{4,}$/, // abc1234
      /^\d+$/, // que des chiffres
      /^[a-z]\d+[a-z]\d+$/i, // a1b2
      /discord|bot|hack|spam|raid/i, // mots suspects
      /^.{1,2}$/, // trop court
      /^.{25,}$/ // trop long
    ];

    return suspiciousPatterns.some(pattern => pattern.test(username));
  }

  /**
   * Envoyer une alerte de quarantaine
   */
  async sendQuarantineAlert(member, analysis, config) {
    try {
      const alertChannel = member.guild.channels.cache.get(config.autoAlerts?.alertChannelId);
      if (!alertChannel) return;

      const embed = this.createVerificationEmbed(member, analysis, 'PENDING');
      embed.setTitle('🔒 Membre mis en quarantaine automatiquement');
      
      const buttons = this.createActionButtons(member.user.id);
      
      await alertChannel.send({
        content: config.autoAlerts?.mentionModerators && config.autoAlerts?.moderatorRoleId 
          ? `<@&${config.autoAlerts.moderatorRoleId}> **Quarantaine automatique**` 
          : '**Quarantaine automatique**',
        embeds: [embed],
        components: [buttons]
      });
    } catch (error) {
      console.error('Erreur alerte quarantaine:', error);
    }
  }

  /**
   * Envoyer une alerte d'action exécutée
   */
  async sendActionAlert(member, action, analysis, config) {
    try {
      const alertChannel = member.guild.channels.cache.get(config.autoAlerts?.alertChannelId);
      if (!alertChannel) return;

      const actionNames = {
        KICK: '👢 Expulsé automatiquement',
        BAN: '🔨 Banni automatiquement'
      };

      const embed = this.createVerificationEmbed(member, analysis, 'REJECTED');
      embed.setTitle(actionNames[action] || 'Action automatique exécutée');
      
      await alertChannel.send({
        embeds: [embed]
      });
    } catch (error) {
      console.error('Erreur alerte action:', error);
    }
  }

  /**
   * Notifier une erreur aux admins
   */
  async notifyError(member, error) {
    try {
      const config = await this.moderationManager.getSecurityConfig(member.guild.id);
      const alertChannel = member.guild.channels.cache.get(config.autoAlerts?.alertChannelId);
      if (!alertChannel) return;

      const embed = new EmbedBuilder()
        .setTitle('❌ Erreur de vérification automatique')
        .setDescription(`Erreur lors de la vérification de **${member.user.tag}**`)
        .addFields({
          name: 'Erreur',
          value: error.message.slice(0, 1024),
          inline: false
        })
        .setColor(0xff6b6b)
        .setTimestamp();

      await alertChannel.send({ embeds: [embed] });
    } catch {}
  }

  /**
   * Nettoyer les timeouts en attente
   */
  clearPendingTimeout(userId) {
    const timeout = this.pendingVerifications.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingVerifications.delete(userId);
    }
  }
}

module.exports = AutoVerificationHandler;