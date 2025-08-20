/**
 * Utilitaire pour positionner les rôles de couleur au plus haut de la liste
 */

/**
 * Positionne un rôle au plus haut possible dans la hiérarchie
 * @param {Role} role - Le rôle Discord à positionner
 * @param {Guild} guild - Le serveur Discord
 * @param {GuildMember} botMember - Le membre bot pour vérifier les permissions
 * @returns {Promise<boolean>} - True si le positionnement a réussi, false sinon
 */
async function positionRoleAtTop(role, guild, botMember) {
    if (!role || !guild || !botMember) {
        console.warn('Paramètres manquants pour positionner le rôle');
        return false;
    }

    try {
        // Obtenir tous les rôles du serveur (sauf @everyone)
        const allRoles = Array.from(guild.roles.cache.values())
            .filter(r => r.id !== guild.id) // Exclure @everyone
            .sort((a, b) => b.position - a.position);
        
        // Trouver la position la plus haute que le bot peut gérer
        let targetPosition = allRoles.length;
        for (const roleInGuild of allRoles) {
            if (botMember.roles.highest.comparePositionTo(roleInGuild) > 0) {
                targetPosition = roleInGuild.position + 1;
                break;
            }
        }
        
        // S'assurer que la position est valide
        targetPosition = Math.min(targetPosition, allRoles.length);
        targetPosition = Math.max(1, targetPosition);
        
        // Positionner le rôle
        await role.setPosition(targetPosition);
        console.log(`✅ Rôle de couleur "${role.name}" positionné à la position ${targetPosition}`);
        
        return true;
    } catch (error) {
        console.warn(`Impossible de positionner le rôle de couleur "${role.name}" au plus haut:`, error?.message);
        return false;
    }
}

/**
 * Crée un rôle de couleur et le positionne au plus haut possible
 * @param {Guild} guild - Le serveur Discord
 * @param {GuildMember} botMember - Le membre bot pour vérifier les permissions
 * @param {Object} style - L'objet style contenant name et color
 * @param {string} reason - La raison de création du rôle
 * @returns {Promise<Role|null>} - Le rôle créé ou null en cas d'erreur
 */
async function createAndPositionColorRole(guild, botMember, style, reason = 'Création automatique du rôle de couleur') {
    if (!guild || !botMember || !style || !style.name || !style.color) {
        console.warn('Paramètres manquants pour créer le rôle de couleur');
        return null;
    }

    try {
        // Créer le rôle
        const role = await guild.roles.create({
            name: style.name,
            color: style.color,
            hoist: false,
            mentionable: false,
            reason: reason
        });

        // Le positionner au plus haut
        await positionRoleAtTop(role, guild, botMember);

        return role;
    } catch (error) {
        console.error(`Erreur lors de la création du rôle de couleur "${style.name}":`, error?.message);
        return null;
    }
}

module.exports = {
    positionRoleAtTop,
    createAndPositionColorRole
};