const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class HolographicCardGenerator {
    constructor() {
        this.width = 800;
        this.height = 500;
    }

    generateHolographicCard(user, userData, userStats, member, karmaTotal) {
        const inscriptionDate = new Date(user.createdTimestamp).toLocaleDateString('fr-FR');
        const arriveeDate = new Date(member.joinedTimestamp).toLocaleDateString('fr-FR');

        const bgPath = path.join(__dirname, '2071753-abstrait-technologie-numérique-ui-futuriste-hud-interface-virtuelle-elements-science-fiction-moderne-utilisateur-mouvement-technologie-graphique-concept-innovant-gratuit-vectoriel.jpg');
        const backgroundImageBase64 = fs.readFileSync(bgPath).toString('base64');
        const imageHref = `data:image/jpeg;base64,${backgroundImageBase64}`;

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

    <!-- Fond avec image -->
    <image href="${imageHref}" x="0" y="0" width="${this.width}" height="${this.height}" preserveAspectRatio="xMidYMid slice"/>

    <!-- Texte de test -->
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

// ----------------------------
// TEST - exemple
// ----------------------------
const generator = new HolographicCardGenerator();

const fakeUser = {
    username: 'Neo',
    id: '12345678901234567890',
    createdTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 365
};

const fakeMember = {
    joinedTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 30
};

const fakeUserData = {
    balance: 560,
    karmaGood: 12,
    karmaBad: 3
};

const fakeUserStats = {
    messageCount: 482
};

const karmaTotal = fakeUserData.karmaGood - fakeUserData.karmaBad;

const svg = generator.generateHolographicCard(fakeUser, fakeUserData, fakeUserStats, fakeMember, karmaTotal);

// Générer l'image PNG
sharp(Buffer.from(svg))
    .png()
    .toFile('./output/holographic_card.png', (err, info) => {
        if (err) console.error('Erreur Sharp:', err);
        else console.log('✅ Image générée :', info);
    });
