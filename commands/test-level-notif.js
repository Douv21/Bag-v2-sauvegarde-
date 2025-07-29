const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const levelManager = require('../utils/levelManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test-level-notif')
        .setDescription('Forcer la notification du niveau actuel avec récompenses (Admin uniquement)')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('Utilisateur pour lequel forcer la notification')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: 64 }); // Ephemeral
            
            const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
            const config = levelManager.loadConfig();
            
            // Vérifier si le canal de notifications est configuré
            if (!config.notifications.enabled || !config.notifications.channelId) {
                await interaction.editReply({
                    content: '⚠️ Veuillez d\'abord configurer le canal de notifications dans /config-level → Notifications'
                });
                return;
            }
            
            // Afficher les infos de récompenses configurées
            const userLevel = levelManager.getUserLevel(targetUser.id, interaction.guild.id);
            
            // Gérer le cas où roleRewards peut être un objet ou un tableau
            let roleReward = null;
            if (config.roleRewards) {
                if (Array.isArray(config.roleRewards)) {
                    roleReward = config.roleRewards.find(reward => reward.level === userLevel.level);
                } else {
                    // Si c'est un objet, chercher par clé de niveau
                    roleReward = config.roleRewards[userLevel.level] ? {
                        level: userLevel.level,
                        roleId: config.roleRewards[userLevel.level]
                    } : null;
                }
            }
            
            // Afficher la dernière récompense obtenue par le membre
            let rewardInfo = '';
            let lastRewardInfo = '';
            
            if (roleReward && roleReward.roleId) {
                try {
                    const role = await interaction.guild.roles.fetch(roleReward.roleId);
                    rewardInfo = `\n🎁 Récompense configurée: ${role?.name || 'Rôle introuvable'} pour niveau ${userLevel.level}`;
                } catch (error) {
                    rewardInfo = `\n⚠️ Erreur récompense: Rôle ${roleReward.roleId} introuvable`;
                }
            } else {
                rewardInfo = `\n📝 Aucune récompense configurée pour le niveau ${userLevel.level}`;
            }
            
            // Trouver la dernière récompense obtenue
            if (config.roleRewards) {
                let lastRewardLevel = 0;
                let lastRewardRoleId = null;
                
                if (Array.isArray(config.roleRewards)) {
                    // Format tableau
                    for (const reward of config.roleRewards) {
                        if (reward.level <= userLevel.level && reward.level > lastRewardLevel) {
                            lastRewardLevel = reward.level;
                            lastRewardRoleId = reward.roleId;
                        }
                    }
                } else {
                    // Format objet
                    for (const [level, roleId] of Object.entries(config.roleRewards)) {
                        const levelNum = parseInt(level);
                        if (levelNum <= userLevel.level && levelNum > lastRewardLevel) {
                            lastRewardLevel = levelNum;
                            lastRewardRoleId = roleId;
                        }
                    }
                }
                
                if (lastRewardRoleId) {
                    try {
                        const lastRole = await interaction.guild.roles.fetch(lastRewardRoleId);
                        lastRewardInfo = `\n🏆 Dernière récompense obtenue: ${lastRole?.name || 'Rôle introuvable'} (niveau ${lastRewardLevel})`;
                    } catch (error) {
                        lastRewardInfo = `\n⚠️ Dernière récompense: Rôle niveau ${lastRewardLevel} introuvable`;
                    }
                } else {
                    lastRewardInfo = `\n💭 Aucune récompense obtenue à votre niveau actuel`;
                }
            }
            
            // Forcer la notification et récompenses
            await levelManager.forceLevelNotification(
                targetUser.id, 
                interaction.guild.id, 
                interaction.guild
            );

            // Générer et envoyer la carte de récompense séparée
            const levelCardGenerator = require('../utils/levelCardGenerator');
            
            // Trouver la dernière récompense obtenue pour la carte séparée
            let lastReward = null;
            if (config.roleRewards) {
                let lastRewardLevel = 0;
                let lastRewardRoleId = null;
                
                if (Array.isArray(config.roleRewards)) {
                    for (const reward of config.roleRewards) {
                        if (reward.level <= userLevel.level && reward.level > lastRewardLevel) {
                            lastRewardLevel = reward.level;
                            lastRewardRoleId = reward.roleId;
                        }
                    }
                } else {
                    for (const [level, roleId] of Object.entries(config.roleRewards)) {
                        const levelNum = parseInt(level);
                        if (levelNum <= userLevel.level && levelNum > lastRewardLevel) {
                            lastRewardLevel = levelNum;
                            lastRewardRoleId = roleId;
                        }
                    }
                }
                
                if (lastRewardRoleId) {
                    try {
                        const lastRole = await interaction.guild.roles.fetch(lastRewardRoleId);
                        if (lastRole) {
                            lastReward = {
                                name: lastRole.name,
                                level: lastRewardLevel
                            };
                        }
                    } catch (error) {
                        console.log('⚠️ Erreur récupération dernière récompense pour carte:', error);
                    }
                }
            }

            // Si une récompense existe, générer et envoyer la carte de récompense
            if (lastReward && config.notifications.enabled && config.notifications.channelId) {
                try {
                    const user = await interaction.guild.members.fetch(targetUser.id);
                    const serverAvatar = user.displayAvatarURL?.({ format: 'png', size: 256 }) || null;
                    const globalAvatar = user.user.displayAvatarURL?.({ format: 'png', size: 256 }) || null;
                    let finalAvatar = serverAvatar || globalAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
                    
                    if (finalAvatar && finalAvatar.includes('.webp')) {
                        finalAvatar = finalAvatar.replace('.webp', '.png');
                    }

                    const userWithRoles = {
                        id: user.user.id,
                        username: user.user.username || 'Unknown',
                        displayName: user.displayName || user.user.displayName || user.user.username || 'Unknown User',
                        avatarURL: finalAvatar,
                        roles: user.roles.cache.map(role => ({ name: role.name, id: role.id }))
                    };

                    const rewardCardBuffer = await levelCardGenerator.generateRewardCard(userWithRoles, `🏆 Rôle obtenu: ${lastReward.name}`, lastReward.level);
                    
                    if (rewardCardBuffer) {
                        const channel = await interaction.guild.channels.fetch(config.notifications.channelId);
                        if (channel && channel.isTextBased()) {
                            await channel.send({
                                content: `🏆 **Dernière récompense obtenue par <@${targetUser.id}>:**`,
                                files: [{
                                    attachment: rewardCardBuffer,
                                    name: `reward_${targetUser.id}_${lastReward.level}.png`
                                }],
                                allowedMentions: { users: [targetUser.id] }
                            });
                            console.log(`✅ Carte de récompense envoyée pour ${user.user.username}`);
                        }
                    }
                } catch (error) {
                    console.error('❌ Erreur envoi carte de récompense:', error);
                }
            }
            
            await interaction.editReply({
                content: `✅ Notification forcée pour ${targetUser.username} (niveau ${userLevel.level}) !${rewardInfo}${lastRewardInfo}${lastReward ? `\n🎨 Carte de récompense envoyée: **${lastReward.name}**` : '\n💬 Aucune carte de récompense à afficher'}`
            });
            
        } catch (error) {
            console.error('Erreur test notification niveau:', error);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ Erreur lors du test de notification.',
                        flags: 64
                    });
                } else {
                    await interaction.editReply({
                        content: '❌ Erreur lors du test de notification.'
                    });
                }
            } catch (replyError) {
                console.error('Erreur envoi réponse erreur:', replyError);
            }
        }
    },
};