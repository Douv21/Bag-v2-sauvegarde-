// Extension pour le système de sécurité - Méthodes de contrôle d'accès

/**
 * Ajouter ces méthodes au ModerationManager
 */

// ========== CONFIGURATION DE SÉCURITÉ ==========

getDefaultSecurityConfig(guildId) {
  return {
    guildId,
    enabled: true,
    autoAlerts: {
      enabled: true,
      alertChannelId: null,
      mentionModerators: false,
      moderatorRoleId: null
    },
    thresholds: {
      lowRisk: 20,
      mediumRisk: 40, 
      highRisk: 70,
      criticalRisk: 85,
      alertThreshold: 50,
      multiAccountAlert: 60
    },
    accessControl: {
      enabled: false,
      accountAgeGate: {
        enabled: false,
        minimumAgeDays: 7,
        action: 'QUARANTINE'
      },
      riskGate: {
        enabled: false,
        maxAllowedScore: 30,
        action: 'ADMIN_APPROVAL'
      },
      quarantineRoleId: null,
      quarantineRoleName: 'Quarantaine',
      verifiedRoleId: null,
      verifiedRoleName: 'Vérifié',
      quarantineChannelId: null,
      adminApproval: {
        enabled: true,
        timeoutMinutes: 60,
        defaultAction: 'KICK'
      }
    },
    detection: {
      accountAgeCheck: true,
      accountAgeThresholdDays: 7,
      multiAccountCheck: true,
      raidDetection: true,
      auditLogCheck: true,
      genderAnalysis: true
    },
    whitelist: {
      userIds: [],
      roleIds: [],
      roleNames: []
    }
  };
}

async getSecurityConfig(guildId) {
  try {
    const config = await this.dataManager.getData('security_config');
    return config[guildId] || this.getDefaultSecurityConfig(guildId);
  } catch (error) {
    return this.getDefaultSecurityConfig(guildId);
  }
}

async updateSecurityConfig(guildId, updates) {
  try {
    const config = await this.dataManager.getData('security_config');
    const currentConfig = config[guildId] || this.getDefaultSecurityConfig(guildId);
    config[guildId] = this.deepMerge(currentConfig, updates);
    await this.dataManager.saveData('security_config', config);
    return config[guildId];
  } catch (error) {
    throw error;
  }
}

deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = this.deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

async isUserWhitelisted(guildId, userId, member = null) {
  try {
    const config = await this.getSecurityConfig(guildId);
    if (config.whitelist.userIds.includes(userId)) return true;
    if (member) {
      for (const roleId of config.whitelist.roleIds) {
        if (member.roles.cache.has(roleId)) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

// ========== CONTRÔLE D'ACCÈS ==========

async processNewMemberAccess(member) {
  try {
    const config = await this.getSecurityConfig(member.guild.id);
    if (!config.enabled || !config.accessControl.enabled) return;

    // Vérifier whitelist
    if (await this.isUserWhitelisted(member.guild.id, member.user.id, member)) {
      return this.grantAccess(member, 'Utilisateur whitelisté');
    }

    // Effectuer l'analyse de sécurité
    const [securityAnalysis, multiAccountCheck, raidCheck] = await Promise.all([
      this.analyzeUserSecurity(member.guild, member.user),
      this.detectMultiAccounts(member.guild, member.user),
      this.checkRaidIndicators(member.guild, member.user)
    ]);

    // Calculer le score total
    let totalScore = securityAnalysis.riskScore;
    if (multiAccountCheck.confidence >= 70) totalScore += 25;
    else if (multiAccountCheck.confidence >= 50) totalScore += 15;

    // Vérifier l'âge du compte
    const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));
    
    if (config.accessControl.accountAgeGate.enabled && 
        accountAge < config.accessControl.accountAgeGate.minimumAgeDays) {
      return this.handleAccessDenied(member, 'AGE_TOO_LOW', {
        action: config.accessControl.accountAgeGate.action,
        reason: `Compte trop récent (${accountAge} jours < ${config.accessControl.accountAgeGate.minimumAgeDays} requis)`,
        score: totalScore
      });
    }

    // Vérifier le score de risque
    if (config.accessControl.riskGate.enabled && 
        totalScore > config.accessControl.riskGate.maxAllowedScore) {
      return this.handleAccessDenied(member, 'RISK_TOO_HIGH', {
        action: config.accessControl.riskGate.action,
        reason: `Score de risque trop élevé (${totalScore} > ${config.accessControl.riskGate.maxAllowedScore})`,
        score: totalScore,
        multiAccounts: multiAccountCheck.totalSuspects,
        raidSuspect: raidCheck.isRaidSuspect
      });
    }

    // Accès accordé
    return this.grantAccess(member, 'Vérifications passées avec succès');

  } catch (error) {
    console.error('Erreur traitement accès nouveau membre:', error);
  }
}

async handleAccessDenied(member, reason, details) {
  const config = await this.getSecurityConfig(member.guild.id);
  const action = details.action;

  switch (action) {
    case 'QUARANTINE':
      return this.quarantineMember(member, reason, details);
    
    case 'ADMIN_APPROVAL':
      return this.requestAdminApproval(member, reason, details);
    
    case 'KICK':
      return this.autoKickMember(member, reason, details);
    
    case 'BAN':
      return this.autoBanMember(member, reason, details);
    
    default:
      return this.sendSecurityAlert(member, reason, details);
  }
}

async quarantineMember(member, reason, details) {
  try {
    const config = await this.getSecurityConfig(member.guild.id);
    
    // Trouver le rôle de quarantaine
    let quarantineRole = null;
    if (config.accessControl.quarantineRoleId) {
      quarantineRole = member.guild.roles.cache.get(config.accessControl.quarantineRoleId);
    }
    
    if (!quarantineRole && config.accessControl.quarantineRoleName) {
      quarantineRole = member.guild.roles.cache.find(r => 
        r.name.toLowerCase() === config.accessControl.quarantineRoleName.toLowerCase()
      );
    }

    if (quarantineRole) {
      await member.roles.add(quarantineRole, `Quarantaine automatique: ${reason}`);
      
      // Envoyer message de quarantaine
      try {
        await member.send(
          `🔒 **Quarantaine de sécurité**\n\n` +
          `Votre accès au serveur **${member.guild.name}** est temporairement limité.\n\n` +
          `**Raison :** ${reason}\n` +
          `**Score de risque :** ${details.score}/100\n\n` +
          `Un administrateur va examiner votre cas. Veuillez patienter.`
        );
      } catch {}

      // Notifier les admins
      await this.notifyAdminsQuarantine(member, reason, details);
      
      console.log(`🔒 Membre mis en quarantaine: ${member.user.tag} dans ${member.guild.name}`);
    }
  } catch (error) {
    console.error('Erreur quarantaine membre:', error);
  }
}

async requestAdminApproval(member, reason, details) {
  try {
    const config = await this.getSecurityConfig(member.guild.id);
    const alertChannel = await this.findSecurityLogChannel(member.guild);
    
    if (alertChannel) {
      const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
      
      const embed = new EmbedBuilder()
        .setTitle('👨‍💼 APPROBATION ADMIN REQUISE')
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setColor(0xff922b)
        .setTimestamp();

      embed.addFields({
        name: '👤 Nouveau membre',
        value: `${member.user.tag}\n<@${member.user.id}>\nID: ${member.user.id}`,
        inline: true
      });

      embed.addFields({
        name: '⚠️ Problème détecté',
        value: `**Raison :** ${reason}\n**Score :** ${details.score}/100`,
        inline: true
      });

      if (details.multiAccounts > 0) {
        embed.addFields({
          name: '🔍 Multi-comptes',
          value: `${details.multiAccounts} compte(s) suspect(s)`,
          inline: true
        });
      }

      // Boutons d'action
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`security_approve_${member.user.id}`)
            .setLabel('✅ Approuver')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`security_quarantine_${member.user.id}`)
            .setLabel('🔒 Quarantaine')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`security_kick_${member.user.id}`)
            .setLabel('👢 Kick')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`security_ban_${member.user.id}`)
            .setLabel('🔨 Ban')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`security_details_${member.user.id}`)
            .setLabel('🔍 Détails')
            .setStyle(ButtonStyle.Primary)
        );

      embed.setFooter({
        text: `Délai: ${config.accessControl.adminApproval.timeoutMinutes} min • Action auto: ${config.accessControl.adminApproval.defaultAction}`
      });

      // Mentionner les admins si configuré
      let content = '';
      if (config.autoAlerts.mentionModerators && config.autoAlerts.moderatorRoleId) {
        content = `<@&${config.autoAlerts.moderatorRoleId}> **Approbation requise**`;
      }

      const message = await alertChannel.send({ 
        content, 
        embeds: [embed], 
        components: [row] 
      });

      // Programmer l'action automatique après timeout
      setTimeout(async () => {
        try {
          await this.handleApprovalTimeout(member, message, config.accessControl.adminApproval.defaultAction);
        } catch {}
      }, config.accessControl.adminApproval.timeoutMinutes * 60 * 1000);

      console.log(`👨‍💼 Approbation admin demandée pour ${member.user.tag}`);
    }
  } catch (error) {
    console.error('Erreur demande approbation admin:', error);
  }
}

async grantAccess(member, reason) {
  try {
    const config = await this.getSecurityConfig(member.guild.id);
    
    // Ajouter le rôle vérifié si configuré
    if (config.accessControl.verifiedRoleId) {
      const verifiedRole = member.guild.roles.cache.get(config.accessControl.verifiedRoleId);
      if (verifiedRole) {
        await member.roles.add(verifiedRole, `Accès accordé: ${reason}`);
      }
    }

    // Envoyer message de bienvenue
    try {
      await member.send(
        `✅ **Bienvenue sur ${member.guild.name} !**\n\n` +
        `Votre accès a été approuvé automatiquement.\n` +
        `**Raison :** ${reason}\n\n` +
        `Vous pouvez maintenant accéder à tous les canaux autorisés.`
      );
    } catch {}

    console.log(`✅ Accès accordé à ${member.user.tag} dans ${member.guild.name}: ${reason}`);
  } catch (error) {
    console.error('Erreur octroi accès:', error);
  }
}

async autoKickMember(member, reason, details) {
  try {
    await member.send(
      `👢 **Accès refusé - ${member.guild.name}**\n\n` +
      `Votre compte ne respecte pas les critères de sécurité du serveur.\n\n` +
      `**Raison :** ${reason}\n` +
      `**Score de risque :** ${details.score}/100\n\n` +
      `Vous pouvez réessayer de rejoindre plus tard si votre compte respecte les critères.`
    ).catch(() => {});

    await member.kick(`Sécurité automatique: ${reason}`);
    
    await this.sendSecurityAlert(member, `AUTO-KICK: ${reason}`, details);
    console.log(`👢 Auto-kick: ${member.user.tag} dans ${member.guild.name}`);
  } catch (error) {
    console.error('Erreur auto-kick:', error);
  }
}

async autoBanMember(member, reason, details) {
  try {
    await member.send(
      `🔨 **Accès banni - ${member.guild.name}**\n\n` +
      `Votre compte a été identifié comme présentant un risque élevé.\n\n` +
      `**Raison :** ${reason}\n` +
      `**Score de risque :** ${details.score}/100\n\n` +
      `