/**
 * RÔLES PRÉDÉFINIS STYLÉS
 * Collection de rôles par défaut avec emojis et couleurs
 */

const defaultRoles = {
    couleurs: {
        name: '🎨 Couleurs',
        description: 'Personnalisez votre couleur de profil',
        exclusive: true,
        roles: [
            {
                name: 'Rouge Passion',
                emoji: '❤️',
                color: '#FF6B6B',
                description: 'Pour les passionnés et les énergiques'
            },
            {
                name: 'Bleu Océan',
                emoji: '💙',
                color: '#4ECDC4',
                description: 'Calme et sérénité comme l\'océan'
            },
            {
                name: 'Violet Mystique',
                emoji: '💜',
                color: '#BB8FCE',
                description: 'Mystérieux et élégant'
            },
            {
                name: 'Vert Nature',
                emoji: '💚',
                color: '#96CEB4',
                description: 'Fraîcheur et harmonie naturelle'
            },
            {
                name: 'Orange Soleil',
                emoji: '🧡',
                color: '#F39C12',
                description: 'Chaleur et optimisme'
            },
            {
                name: 'Rose Sakura',
                emoji: '🌸',
                color: '#F8BBD9',
                description: 'Douceur et délicatesse'
            },
            {
                name: 'Or Royal',
                emoji: '👑',
                color: '#F7DC6F',
                description: 'Luxe et prestige'
            },
            {
                name: 'Argent Lunaire',
                emoji: '🌙',
                color: '#D5DBDB',
                description: 'Élégance nocturne'
            }
        ]
    },
    
    hobbies: {
        name: '🎮 Hobbies & Passions',
        description: 'Partagez vos centres d\'intérêt',
        exclusive: false,
        roles: [
            {
                name: 'Gamer',
                emoji: '🎮',
                color: '#9B59B6',
                description: 'Passionné de jeux vidéo'
            },
            {
                name: 'Otaku',
                emoji: '🍜',
                color: '#E74C3C',
                description: 'Fan de manga et anime'
            },
            {
                name: 'Musicien',
                emoji: '🎵',
                color: '#3498DB',
                description: 'Créateur ou amateur de musique'
            },
            {
                name: 'Artiste',
                emoji: '🎨',
                color: '#E67E22',
                description: 'Créatif et artistique'
            },
            {
                name: 'Lecteur',
                emoji: '📚',
                color: '#27AE60',
                description: 'Dévoreur de livres'
            },
            {
                name: 'Cinéphile',
                emoji: '🎬',
                color: '#8E44AD',
                description: 'Passionné de cinéma'
            },
            {
                name: 'Sportif',
                emoji: '⚽',
                color: '#F39C12',
                description: 'Actif et sportif'
            },
            {
                name: 'Cuisinier',
                emoji: '👨‍🍳',
                color: '#E74C3C',
                description: 'Maître des fourneaux'
            },
            {
                name: 'Photographe',
                emoji: '📸',
                color: '#34495E',
                description: 'Chasseur d\'images'
            },
            {
                name: 'Voyageur',
                emoji: '✈️',
                color: '#16A085',
                description: 'Explorateur du monde'
            }
        ]
    },
    
    notifications: {
        name: '🔔 Notifications',
        description: 'Choisissez vos notifications',
        exclusive: false,
        roles: [
            {
                name: 'Événements',
                emoji: '🎉',
                color: '#F1C40F',
                description: 'Notifications pour les événements spéciaux'
            },
            {
                name: 'Annonces',
                emoji: '📢',
                color: '#3498DB',
                description: 'Notifications importantes du serveur'
            },
            {
                name: 'Giveaways',
                emoji: '🎁',
                color: '#E91E63',
                description: 'Notifications pour les concours'
            },
            {
                name: 'Mises à jour',
                emoji: '🔄',
                color: '#9C27B0',
                description: 'Notifications de mise à jour du bot'
            },
            {
                name: 'Partenariats',
                emoji: '🤝',
                color: '#607D8B',
                description: 'Notifications de partenariats'
            }
        ]
    },
    
    region: {
        name: '🌍 Région',
        description: 'Votre localisation géographique',
        exclusive: true,
        roles: [
            {
                name: 'France',
                emoji: '🇫🇷',
                color: '#0055A4',
                description: 'Vive la France !'
            },
            {
                name: 'Belgique',
                emoji: '🇧🇪',
                color: '#000000',
                description: 'Nos voisins belges'
            },
            {
                name: 'Suisse',
                emoji: '🇨🇭',
                color: '#FF0000',
                description: 'Précision suisse'
            },
            {
                name: 'Canada',
                emoji: '🇨🇦',
                color: '#FF0000',
                description: 'Nos amis canadiens'
            },
            {
                name: 'Québec',
                emoji: '⚜️',
                color: '#003F7F',
                description: 'Belle province'
            },
            {
                name: 'Maghreb',
                emoji: '🏺',
                color: '#228B22',
                description: 'Afrique du Nord'
            },
            {
                name: 'DOM-TOM',
                emoji: '🏝️',
                color: '#00CED1',
                description: 'Territoires d\'outre-mer'
            },
            {
                name: 'International',
                emoji: '🌐',
                color: '#4682B4',
                description: 'Autres pays'
            }
        ]
    },
    
    niveau: {
        name: '⭐ Niveau de Participation',
        description: 'Votre activité sur le serveur',
        exclusive: true,
        roles: [
            {
                name: 'Nouveau',
                emoji: '🌱',
                color: '#95A5A6',
                description: 'Bienvenue sur le serveur !'
            },
            {
                name: 'Actif',
                emoji: '⚡',
                color: '#3498DB',
                description: 'Membre actif de la communauté'
            },
            {
                name: 'Vétéran',
                emoji: '🏆',
                color: '#F39C12',
                description: 'Ancien membre respecté'
            },
            {
                name: 'Légende',
                emoji: '👑',
                color: '#9B59B6',
                description: 'Pilier de la communauté'
            }
        ]
    },
    
    special: {
        name: '✨ Rôles Spéciaux',
        description: 'Rôles uniques et exclusifs',
        exclusive: false,
        roles: [
            {
                name: 'Nitro Booster',
                emoji: '💎',
                color: '#F47FFF',
                description: 'Soutient le serveur avec Nitro'
            },
            {
                name: 'Créateur de Contenu',
                emoji: '📹',
                color: '#FF6B35',
                description: 'Streamer, YouTubeur, etc.'
            },
            {
                name: 'Développeur',
                emoji: '💻',
                color: '#36393F',
                description: 'Maître du code'
            },
            {
                name: 'Designer',
                emoji: '🎨',
                color: '#FF69B4',
                description: 'Créateur visuel'
            },
            {
                name: 'Bot Tester',
                emoji: '🤖',
                color: '#7289DA',
                description: 'Testeur officiel du bot'
            }
        ]
    }
};

/**
 * Crée tous les rôles par défaut pour une guilde
 */
async function createDefaultRoles(guild, roleManager) {
    console.log(`🎭 Création des rôles par défaut pour ${guild.name}...`);
    
    const results = {
        success: 0,
        errors: 0,
        details: []
    };

    for (const [categoryId, categoryData] of Object.entries(defaultRoles)) {
        try {
            // Créer la catégorie
            roleManager.createCategory(guild.id, categoryId, {
                name: categoryData.name,
                description: categoryData.description,
                exclusive: categoryData.exclusive
            });

            // Créer les rôles de la catégorie
            for (const roleData of categoryData.roles) {
                try {
                    const result = await roleManager.createCustomRole(guild, {
                        name: roleData.name,
                        emoji: roleData.emoji,
                        color: roleData.color,
                        description: roleData.description,
                        category: categoryId,
                        mentionable: false
                    });

                    if (result.success) {
                        results.success++;
                        results.details.push(`✅ ${roleData.emoji} ${roleData.name}`);
                    } else {
                        results.errors++;
                        results.details.push(`❌ ${roleData.name}: ${result.error}`);
                    }

                    // Petit délai pour éviter la limite de taux
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    results.errors++;
                    results.details.push(`❌ ${roleData.name}: ${error.message}`);
                }
            }
        } catch (error) {
            console.error(`Erreur création catégorie ${categoryId}:`, error);
        }
    }

    console.log(`🎭 Création terminée: ${results.success} succès, ${results.errors} erreurs`);
    return results;
}

/**
 * Obtient la liste des rôles par défaut pour affichage
 */
function getDefaultRolesList() {
    const list = [];
    
    for (const [categoryId, categoryData] of Object.entries(defaultRoles)) {
        list.push(`\n**${categoryData.name}**`);
        list.push(`*${categoryData.description}*`);
        
        for (const role of categoryData.roles.slice(0, 3)) {
            list.push(`${role.emoji} ${role.name}`);
        }
        
        if (categoryData.roles.length > 3) {
            list.push(`... et ${categoryData.roles.length - 3} autres`);
        }
    }
    
    return list.join('\n');
}

module.exports = {
    defaultRoles,
    createDefaultRoles,
    getDefaultRolesList
};