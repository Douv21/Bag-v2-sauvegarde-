// utils/cardgenerator.js
const fs = require('fs');
const path = require('path');

class HolographicCardGenerator {
    constructor() {
        this.width = 800;
        this.height = 500;
    }

    generateHolographicCard(user, userData, userStats, member, karmaTotal, avatarURLBase64) {
        const inscriptionDate = new Date(user.createdTimestamp).toLocaleDateString('fr-FR');
        const arriveeDate = new Date(member.joinedTimestamp).toLocaleDateString('fr-FR');

        const bgPath = path.join(__dirname, '..', '2071753-abstrait-technologie-numérique-ui-futuriste-hud-interface-virtuelle-elements-science-fiction-moderne-utilisateur-mouvement-technologie-graphique-concept-innovant-gratuit-vectoriel.jpg');
        const backgroundImageBase64 = fs.readFileSync(bgPath).toString('base64');
        const bgHref = `data:image/jpeg;base64,${backgroundImageBase64}`;

        const avatarImage = avatarURLBase64
            ? `<clipPath id="avatarClip"><circle cx="680" cy="110" r="40"/></clipPath>
               <image href="data:image/png;base64,${avatarURLBase64}" x="640" y="70" width="80" height="80" clip-path="url(#avatarClip)"/>`
            : '';

        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <filter id="textGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>

    <image href="${bgHref}" x="0" y="0" width="${this.width}" height="${this.height}" preserveAspectRatio="xMidYMid slice"/>
    
    ${avatarImage}

    <text x="400" y="60" text-anchor="middle" fill="#00ffff" font-size="24" font-family="Arial" filter="url(#textGlow)">
        HOLOGRAPHIC CARD
    </text>

    <text x="50" y="120" fill="#ffffff" font-size="16" font-family="Arial" filter="url(#textGlow)">
        Utilisateur : ${user.username}
    </text>

    <text x="50" y="150" fill="#00ff88" font-size="14" font-family="Arial" filter="url(#textGlow)">
        ID : ${user.id.substring(0, 10)}...
    </text>

    <text x="50" y="180" fill="#ffff00" font-size="14" font-family="Arial" filter="url(#textGlow)">
        Messages : ${userStats.messageCount}
    </text>

    <text x="50" y="210" fill="#00ff00" font-size="14" font-family="Arial" filter="url(#textGlow)">
        Solde : ${userData.balance}€
    </text>

    <text x="50" y="240" fill="#ff6600" font-size="14" font-family="Arial" filter="url(#textGlow)">
        Karma + : ${userData.karmaGood || 0} | - : ${userData.karmaBad || 0}
    </text>

    <text x="50" y="270" fill="#00ccff" font-size="12" font-family="Arial" filter="url(#textGlow)">
        Inscription : ${inscriptionDate}
    </text>
    <text x="50" y="290" fill="#00ccff" font-size="12" font-family="Arial" filter="url(#textGlow)">
        Serveur : ${arriveeDate}
    </text>
</svg>`;
        return svg;
    }
}

module.exports = HolographicCardGenerator;
