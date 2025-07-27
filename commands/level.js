const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const levelManager = require('../utils/levelManager');
const levelCardGenerator = require('../utils/levelCardGenerator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Afficher votre niveau et progression XP')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('Utilisateur dont afficher le niveau (optionnel)')
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply();
            
            const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
            const targetMember = await interaction.guild.members.fetch(targetUser.id);
            const userLevel = levelManager.getUserLevel(targetUser.id, interaction.guild.id);
            
            // Calculs de progression corrigés
            const currentLevelXP = levelManager.calculateXPForLevel(userLevel.level);
            const nextLevelXP = levelManager.calculateXPForLevel(userLevel.level + 1);
            const xpProgress = Math.max(0, userLevel.xp - currentLevelXP);
            const xpNeeded = nextLevelXP - currentLevelXP;
            const progressPercent = Math.min(100, Math.max(0, Math.round((xpProgress / xpNeeded) * 100)));
            
            console.log(`🔍 Debug progression:`, {
                userXP: userLevel.xp,
                level: userLevel.level,
                currentLevelXP,
                nextLevelXP,
                xpProgress,
                xpNeeded,
                progressPercent
            });
            
            // Créer la barre de progression avec validation
            const barLength = 20;
            const filledBars = Math.max(0, Math.min(barLength, Math.round((progressPercent / 100) * barLength)));
            const emptyBars = Math.max(0, barLength - filledBars);
            const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
            
            // Pas d'embed texte, seulement la carte
            
            // Générer la carte de niveau (uniquement style holographique)
            const config = levelManager.loadConfig();
            
            try {
                console.log(`🎨 /level: Génération carte holographic pour ${targetUser.username}`);
                console.log(`🔍 Debug user data:`, {
                    id: targetUser.id,
                    username: targetUser.username,
                    displayName: targetUser.displayName,
                    tag: targetUser.tag,
                    memberDisplayName: targetMember.displayName
                });
                
                // Calculer les données de progression pour la carte
                // Obtenir le nombre de messages depuis economy.json pour cohérence
                const dataManager = require('../utils/simpleDataManager');
                const economyData = await dataManager.loadData('economy.json', {});
                const economyKey = `${targetUser.id}_${interaction.guild.id}`;
                const economyUser = economyData[economyKey] || {};
                
                // Calculer le classement XP pour ce serveur
                const levelUsers = await dataManager.loadData('level_users.json', {});
                const guildUsers = Object.values(levelUsers).filter(user => user.guildId === interaction.guild.id);
                guildUsers.sort((a, b) => b.xp - a.xp); // Trier par XP décroissant
                
                const userRank = guildUsers.findIndex(user => user.userId === targetUser.id) + 1;
                const totalUsers = guildUsers.length;
                
                const progressData = {
                    currentXP: xpProgress,
                    totalNeeded: xpNeeded,
                    progressPercent: progressPercent,
                    totalXP: userLevel.xp,
                    nextLevelXP: nextLevelXP,
                    totalMessages: economyUser.messageCount || userLevel.totalMessages || 0,
                    totalVoiceTime: Math.floor((userLevel.totalVoiceTime || 0) / 60000),
                    rank: userRank,
                    totalUsers: totalUsers
                };
                
                // Récupérer l'avatar avec priorité serveur > global et forcer le format PNG
                const serverAvatar = targetMember.displayAvatarURL?.({ format: 'png', size: 256 }) || null;
                const globalAvatar = targetUser.displayAvatarURL?.({ format: 'png', size: 256 }) || null;
                
                // Convertir les URL webp en PNG si nécessaire
                let finalAvatar = serverAvatar || globalAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
                if (finalAvatar && finalAvatar.includes('.webp')) {
                    finalAvatar = finalAvatar.replace('.webp', '.png');
                }
                
                console.log(`🖼️ Avatar final sélectionné:`, finalAvatar);
                
                // Préparer l'utilisateur avec ses rôles pour la génération de carte
                const finalDisplayName = targetMember.displayName || targetUser.displayName || targetUser.username || 'Unknown User';
                const userWithRoles = {
                    id: targetUser.id,
                    username: targetUser.username || 'Unknown',
                    discriminator: targetUser.discriminator || '0000',
                    tag: targetUser.tag || `${targetUser.username || 'Unknown'}#${targetUser.discriminator || '0000'}`,
                    displayName: finalDisplayName,
                    avatarURL: finalAvatar,
                    roles: targetMember.roles.cache.map(role => ({ name: role.name, id: role.id })),
                    displayAvatarURL: function(options = { format: 'png', size: 256 }) {
                        return finalAvatar;
                    }
                };
                
                console.log(`✅ Final user object for card:`, {
                    displayName: userWithRoles.displayName,
                    username: userWithRoles.username,
                    avatarURL: userWithRoles.avatarURL,
                    rolesCount: userWithRoles.roles.length
                });
                
                // Utiliser la méthode unifiée qui gère automatiquement les images selon les rôles
                const cardBuffer = await levelCardGenerator.generateCard(
                    userWithRoles, 
                    userLevel,
                    userLevel.level - 1,
                    userLevel.level,
                    null,
                    'holographic',
                    progressData
                );
                
                console.log(`📊 /level: Carte générée - ${cardBuffer ? cardBuffer.length : 0} bytes`);
                
                if (cardBuffer && cardBuffer.length > 100) {
                    try {
                        const attachment = new AttachmentBuilder(cardBuffer, { 
                            name: `level-card.png`,
                            description: `Carte de niveau ${userLevel.level} pour ${targetUser.username}`
                        });
                        
                        // Réponse avec seulement l'image, sans embed
                        await interaction.editReply({ 
                            files: [attachment]
                        });
                        
                        console.log(`✅ /level: Carte envoyée avec image intégrée pour ${targetUser.username}`);
                    } catch (attachError) {
                        console.error('❌ /level: Erreur création attachment:', attachError);
                        await interaction.editReply({ 
                            content: `⚠️ *Erreur d'affichage de la carte de niveau*`
                        });
                    }
                } else {
                    console.warn(`⚠️ /level: Carte trop petite ou nulle pour ${targetUser.username}`);
                    await interaction.editReply({ 
                        content: `❌ Impossible de générer la carte de niveau`
                    });
                }
            } catch (cardError) {
                console.error('❌ /level: Erreur génération carte:', cardError);
                await interaction.editReply({ 
                    content: `⚠️ *Carte de niveau indisponible pour le moment*`
                });
            }
            
        } catch (error) {
            console.error('Erreur commande level:', error);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ Une erreur est survenue lors de l\'affichage du niveau.',
                        flags: 64
                    });
                } else {
                    await interaction.editReply({
                        content: '❌ Une erreur est survenue lors de l\'affichage du niveau.'
                    });
                }
            } catch (replyError) {
                console.error('Erreur envoi réponse erreur:', replyError);
            }
        }
    }
};