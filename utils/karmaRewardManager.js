const { EmbedBuilder } = require('discord.js');

class KarmaRewardManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    /**
     * Vérifie et applique automatiquement les récompenses/sanctions karma
     */
    async checkAndApplyKarmaRewards(user, guild, channel) {
        try {
            const economyConfig = await this.dataManager.loadData('economy.json', {});
            const karmaRewards = economyConfig.karmaRewards || [];
            
            if (karmaRewards.length === 0) return;

            // Charger les vraies données utilisateur via dataManager
            const userData = await this.dataManager.getUser(user.id, guild.id);

            const goodKarma = userData.goodKarma || 0;
            const badKarma = userData.badKarma || 0;
            const appliedRewards = userData.appliedRewards || [];

            console.log(`🔍 Vérification karma pour ${user.username}: +${goodKarma}😇 / ${badKarma}😈`);

            // Vérifier chaque niveau de récompense/sanction
            for (const reward of karmaRewards) {
                const shouldApply = this.shouldApplyReward(reward, goodKarma, badKarma, appliedRewards);
                
                if (shouldApply) {
                    const karmaType = reward.karmaThreshold > 0 ? 'récompense' : 'sanction';
                    console.log(`✅ ${karmaType} karma déclenchée: ${reward.name} pour ${user.username}`);
                    
                    await this.applyReward(user, guild, channel, reward, userData);
                    
                    // Marquer comme appliqué
                    if (!userData.appliedRewards) userData.appliedRewards = [];
                    userData.appliedRewards.push(reward.id);
                    
                    // Sauvegarder via dataManager
                    await this.dataManager.updateUser(user.id, guild.id, userData);
                    
                    break; // Une seule récompense à la fois
                }
            }

        } catch (error) {
            console.error('Erreur lors de la vérification des récompenses karma:', error);
        }
    }

    /**
     * Détermine si une récompense/sanction doit être appliquée
     */
    shouldApplyReward(reward, goodKarma, badKarma, appliedRewards) {
        // Déjà appliqué
        if (appliedRewards.includes(reward.id)) {
            return false;
        }

        // Vérifier si le karma atteint le seuil
        if (reward.karmaThreshold > 0) {
            // Récompense : karma BON doit être >= seuil
            return goodKarma >= reward.karmaThreshold;
        } else if (reward.karmaThreshold < 0) {
            // Sanction : karma MAUVAIS (valeur absolue) doit être >= seuil absolu
            return Math.abs(badKarma) >= Math.abs(reward.karmaThreshold);
        }
        
        return false;
    }

    /**
     * Applique une récompense ou sanction
     */
    async applyReward(user, guild, channel, reward, userData) {
        try {
            let rewardMessages = [];
            
            // Appliquer l'argent
            if (reward.moneyReward && reward.moneyReward !== 0) {
                userData.balance = (userData.balance || 0) + reward.moneyReward;
                const moneyText = reward.moneyReward > 0 
                    ? `+${reward.moneyReward}€` 
                    : `${reward.moneyReward}€`;
                rewardMessages.push(`💰 **Argent:** ${moneyText}`);
            }

            // Appliquer le rôle (si configuré)
            if (reward.roleId) {
                const role = guild.roles.cache.get(reward.roleId);
                if (role) {
                    const member = guild.members.cache.get(user.id);
                    if (member && !member.roles.cache.has(reward.roleId)) {
                        await member.roles.add(role);
                        
                        // Gérer la durée temporaire
                        if (reward.isTemporary && reward.duration) {
                            const durationMs = reward.duration * 60 * 60 * 1000; // heures en milliseconds
                            setTimeout(async () => {
                                try {
                                    await member.roles.remove(role);
                                    console.log(`🎭 Rôle temporaire ${role.name} retiré à ${user.username}`);
                                } catch (error) {
                                    console.error('Erreur lors du retrait du rôle temporaire:', error);
                                }
                            }, durationMs);
                            
                            const durationText = reward.duration > 24 
                                ? `${Math.round(reward.duration / 24)} jour${Math.round(reward.duration / 24) > 1 ? 's' : ''}`
                                : `${reward.duration} heure${reward.duration > 1 ? 's' : ''}`;
                            rewardMessages.push(`🎭 **Rôle:** ${role.name} (${durationText})`);
                        } else {
                            rewardMessages.push(`🎭 **Rôle:** ${role.name} (permanent)`);
                        }
                    }
                }
            }

            // Créer et envoyer le message d'annonce
            if (rewardMessages.length > 0) {
                await this.sendRewardNotification(user, channel, reward, rewardMessages);
            }

        } catch (error) {
            console.error('Erreur lors de l\'application de la récompense:', error);
        }
    }

    /**
     * Envoie le message de notification dans le canal
     */
    async sendRewardNotification(user, channel, reward, rewardMessages) {
        const isReward = reward.karmaThreshold > 0;
        const typeIcon = isReward ? '😇' : '😈';
        const typeText = isReward ? 'Récompense' : 'Sanction';
        const color = isReward ? 0x00FF00 : 0xFF0000;

        const embed = new EmbedBuilder()
            .setTitle(`${typeIcon} ${typeText} Karma Automatique!`)
            .setDescription(`<@${user.id}> a atteint le niveau **${reward.name}** !`)
            .addFields(
                {
                    name: '⚖️ Seuil Karma',
                    value: `${Math.abs(reward.karmaThreshold)} ${reward.karmaThreshold > 0 ? 'karma bon 😇' : 'karma mauvais 😈'}`,
                    inline: true
                },
                {
                    name: '🎁 Récompenses Reçues',
                    value: rewardMessages.join('\n'),
                    inline: false
                }
            )
            .setColor(color)
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ 
                text: '🎯 Système Karma Automatique',
                iconURL: channel.guild.iconURL()
            });

        try {
            await channel.send({ embeds: [embed] });
            console.log(`🎁 Notification envoyée pour ${user.username}: ${reward.name}`);
        } catch (error) {
            console.error('Erreur envoi notification karma:', error);
        }
    }

    /**
     * Test du système pour tous les membres (pour debug)
     */
    async testKarmaSystem(user, guild, channel) {
        const economyConfig = await this.dataManager.loadData('economy.json', {});
        const karmaRewards = economyConfig.karmaRewards || [];
        
        if (karmaRewards.length === 0) {
            await channel.send('❌ Aucune récompense/sanction configurée.');
            return;
        }

        // Charger tous les membres du serveur avec karma
        const allUsersData = await this.dataManager.loadData('users.json', {});
        const guildUsers = allUsersData[guild.id] || {};
        
        const testEmbed = new EmbedBuilder()
            .setTitle('🧪 Test Système Karma - Tous les Membres')
            .setDescription(`Analyse de **${Object.keys(guildUsers).length}** membres avec données économiques`)
            .setColor(0x0099FF);

        let memberResults = [];
        let totalApplicable = 0;
        
        // Analyser chaque membre avec données
        for (const [userId, userData] of Object.entries(guildUsers)) {
            if (!userData.goodKarma && !userData.badKarma) continue; // Skip membres sans karma
            
            const goodKarma = userData.goodKarma || 0;
            const badKarma = userData.badKarma || 0;
            
            try {
                const member = await guild.members.fetch(userId);
                let memberRewards = [];
                
                for (const reward of karmaRewards) {
                    const shouldApply = this.shouldApplyReward(reward, goodKarma, badKarma, userData.appliedRewards || []);
                    if (shouldApply) {
                        memberRewards.push(reward.name);
                        totalApplicable++;
                    }
                }
                
                if (memberRewards.length > 0) {
                    memberResults.push(`**${member.displayName}** (+${goodKarma}😇/${badKarma}😈)\n└ ${memberRewards.join(', ')}`);
                } else if (goodKarma > 0 || badKarma < 0) {
                    memberResults.push(`**${member.displayName}** (+${goodKarma}😇/${badKarma}😈)\n└ Aucune récompense applicable`);
                }
                
            } catch (error) {
                // Membre introuvable, continuer
                continue;
            }
        }

        if (memberResults.length === 0) {
            testEmbed.addFields({
                name: '👥 Résultats',
                value: 'Aucun membre avec karma trouvé sur ce serveur',
                inline: false
            });
        } else {
            // Limiter à 10 membres max pour éviter embed trop long
            const displayResults = memberResults.slice(0, 10);
            const more = memberResults.length > 10 ? `\n... et ${memberResults.length - 10} autres membres` : '';
            
            testEmbed.addFields([
                {
                    name: '📊 Statistiques',
                    value: `**${memberResults.length}** membres avec karma\n**${totalApplicable}** récompenses applicables`,
                    inline: true
                },
                {
                    name: '🎁 Niveaux Configurés',
                    value: `${karmaRewards.length} niveaux karma`,
                    inline: true
                },
                {
                    name: '👥 Membres et Récompenses',
                    value: displayResults.join('\n\n') + more,
                    inline: false
                }
            ]);
        }

        await channel.send({ embeds: [testEmbed] });
    }
}

module.exports = KarmaRewardManager;