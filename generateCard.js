const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const axios = require('axios');
const HolographicCardGenerator = require('./utils/cardgenerator');

// Fake user Discord-like
const user = {
    username: 'Neo',
    id: '12345678901234567890',
    createdTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 365,
    avatarURL: 'https://cdn.discordapp.com/avatars/12345678901234567890/a_avatarimage.png?size=128' // à adapter ou simuler
};

const member = {
    joinedTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 30
};

const userData = {
    balance: 560,
    karmaGood: 12,
    karmaBad: 3
};

const userStats = {
    messageCount: 482
};

const karmaTotal = userData.karmaGood - userData.karmaBad;

async function createCard() {
    try {
        const generator = new HolographicCardGenerator();

        // Récupère l’avatar et convertit en base64
        let avatarBase64 = '';
        try {
            const response = await axios.get(user.avatarURL, { responseType: 'arraybuffer' });
            avatarBase64 = Buffer.from(response.data, 'binary').toString('base64');
        } catch (err) {
            console.warn('⚠️ Avatar non récupéré, image ignorée.');
        }

        const svg = generator.generateHolographicCard(user, userData, userStats, member, karmaTotal, avatarBase64);

        // Sauvegarde l’image PNG
        if (!fs.existsSync('./output')) fs.mkdirSync('./output');
        await sharp(Buffer.from(svg)).png().toFile('./output/holographic_card.png');
        console.log('✅ Carte générée : ./output/holographic_card.png');
    } catch (error) {
        console.error('❌ Erreur lors de la génération de la carte :', error);
    }
}

createCard();
