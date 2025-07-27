const sharp = require('sharp');
const https = require('https');

class LevelCardGenerator {
    constructor() {
        console.log('🎨 LevelCardGenerator initialisé');
    }

    async generateNotificationCard(user, newLevel) {
        try {
            console.log(`🔔 Génération carte notification niveau: ${newLevel} pour ${user.username}`);
            console.log(`🎭 Rôles utilisateur pour notification:`, user.roles?.map(r => r.name) || []);
            
            // Utiliser le style holographique avec image selon les rôles
            const svgContent = await this.createHolographicSVG(user, user, 0, newLevel, null, null, user.roles || []);
            
            // Convertir SVG en PNG avec Sharp
            const pngBuffer = await sharp(Buffer.from(svgContent))
                .png({ 
                    quality: 90,
                    compressionLevel: 6,
                    progressive: true
                })
                .resize(800, 400, { 
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .toBuffer();
            
            console.log(`✅ Carte notification générée: ${pngBuffer.length} bytes`);
            return pngBuffer;
            
        } catch (error) {
            console.error('❌ Erreur génération carte notification:', error);
            return null;
        }
    }

    async generateCard(user, userLevel, oldLevel, newLevel, roleReward, style = 'futuristic', progressData = null) {
        try {
            console.log(`🎨 Génération carte niveau: ${newLevel} (style: ${style})`);
            
            // Générer le SVG avec le style approprié
            let svgContent;
            
            if (style === 'gamer') {
                svgContent = this.createGamerSVG(user, userLevel, oldLevel, newLevel, roleReward, progressData);
            } else if (style === 'amour') {
                svgContent = this.createAmourSVG(user, userLevel, oldLevel, newLevel, roleReward, progressData);
            } else if (style === 'sensuel') {
                svgContent = this.createSensuelSVG(user, userLevel, oldLevel, newLevel, roleReward, progressData);
            } else if (style === 'holographic') {
                svgContent = await this.createHolographicSVG(user, userLevel, oldLevel, newLevel, roleReward, progressData, user.roles || []);
            } else {
                // Styles par défaut existants
                const theme = this.getTheme(style);
                svgContent = this.createLevelUpSVG(user, userLevel, oldLevel, newLevel, roleReward, theme, style, progressData);
            }
            
            // Convertir SVG en PNG avec Sharp
            const pngBuffer = await sharp(Buffer.from(svgContent))
                .png({ 
                    quality: 90,
                    compressionLevel: 6,
                    progressive: true
                })
                .resize(800, 400, { 
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .toBuffer();
            
            console.log(`✅ Carte générée: ${pngBuffer.length} bytes (${style})`);
            
            // Vérification que le buffer est valide
            if (!pngBuffer || pngBuffer.length === 0) {
                throw new Error('Buffer PNG vide généré');
            }
            
            return pngBuffer;
        } catch (error) {
            console.error('❌ Erreur génération carte niveau:', error);
            console.error('Stack trace:', error.stack);
            
            // Retourner une carte de fallback simple
            try {
                return await this.generateFallbackCard(user, newLevel);
            } catch (fallbackError) {
                console.error('❌ Erreur carte fallback:', fallbackError);
                return null;
            }
        }
    }

    async createHolographicSVG(user, userLevel, oldLevel, newLevel, roleReward, progressData, userRoles = []) {
        console.log(`🖼️ Avatar URL reçue pour carte:`, user.avatarURL);
        
        // Télécharger et encoder l'avatar en base64 pour l'intégrer directement dans le SVG
        let avatarBase64 = '';
        try {
            if (user.avatarURL && user.avatarURL.startsWith('http')) {
                const https = require('https');
                const avatarData = await new Promise((resolve, reject) => {
                    https.get(user.avatarURL, (response) => {
                        let data = Buffer.alloc(0);
                        response.on('data', (chunk) => {
                            data = Buffer.concat([data, chunk]);
                        });
                        response.on('end', () => {
                            resolve(data);
                        });
                    }).on('error', (err) => {
                        console.log('⚠️ Erreur téléchargement avatar:', err);
                        reject(err);
                    });
                });
                avatarBase64 = `data:image/png;base64,${avatarData.toString('base64')}`;
                console.log(`✅ Avatar téléchargé et encodé en base64: ${avatarBase64.length} chars`);
            }
        } catch (error) {
            console.log('⚠️ Impossible de télécharger avatar, utilisation avatar par défaut');
            avatarBase64 = 'https://cdn.discordapp.com/embed/avatars/0.png';
        }
        const fs = require('fs');
        const path = require('path');
        
        // Déterminer quelle image utiliser selon les rôles
        let imagePath;
        let imageFormat = 'jpeg';
        
        // Vérifier les rôles pour choisir l'image appropriée - priorité "certifié" sur "femme"
        if (userRoles.some(role => role.name.toLowerCase().includes('certifié'))) {
            imagePath = path.join(__dirname, '../../attached_assets/3_1753521071380.png');
            imageFormat = 'png';
            console.log('🎨 Utilisation image certifié (3_1753521071380.png) pour la carte');
        } else if (userRoles.some(role => role.name.toLowerCase().includes('femme'))) {
            imagePath = path.join(__dirname, '../../attached_assets/2_1753521071482.png');
            imageFormat = 'png';
            console.log('🎨 Utilisation image femme (2_1753521071482.png) pour la carte');
        } else {
            imagePath = path.join(__dirname, '../../attached_assets/1_1753517381716.jpg');
            imageFormat = 'jpeg';
            console.log('🎨 Utilisation image par défaut (1_1753517381716.jpg) pour la carte');
        }
        
        // Essayer de charger l'image appropriée
        let bgImage = '';
        try {
            if (fs.existsSync(imagePath)) {
                const imageBuffer = fs.readFileSync(imagePath);
                bgImage = `data:image/${imageFormat};base64,${imageBuffer.toString('base64')}`;
                console.log(`✅ Image de fond chargée: ${bgImage.length} chars (${imageFormat})`);
            } else {
                console.log(`❌ Image non trouvée: ${imagePath}`);
            }
        } catch (error) {
            console.log('⚠️ Erreur chargement image de fond:', error.message);
        }

        return `
        <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="holoBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#0a0a2a;stop-opacity:1"/>
                    <stop offset="25%" style="stop-color:#1e1e4a;stop-opacity:1"/>
                    <stop offset="50%" style="stop-color:#2a2a6a;stop-opacity:1"/>
                    <stop offset="75%" style="stop-color:#1a1a3a;stop-opacity:1"/>
                    <stop offset="100%" style="stop-color:#0a0a1a;stop-opacity:1"/>
                </linearGradient>
                <filter id="holoGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur"/>
                    <feMerge>
                        <feMergeNode in="blur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                <pattern id="holoPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <rect width="40" height="40" fill="none"/>
                    <line x1="0" y1="0" x2="40" y2="40" stroke="#00ffff" stroke-width="0.5" opacity="0.3"/>
                    <line x1="40" y1="0" x2="0" y2="40" stroke="#ff00ff" stroke-width="0.5" opacity="0.3"/>
                </pattern>
                <clipPath id="cardClip">
                    <rect x="0" y="0" width="800" height="400" rx="20"/>
                </clipPath>
            </defs>
            
            <!-- Background Image ou Holographique -->
            ${bgImage ? `
                <image href="${bgImage}" x="0" y="0" width="800" height="400" preserveAspectRatio="xMidYMid slice" opacity="1"/>
                <rect width="800" height="400" fill="url(#holoPattern)" opacity="0.2"/>
            ` : `
                <rect width="800" height="400" fill="url(#holoBg)"/>
                <rect width="800" height="400" fill="url(#holoPattern)"/>
            `}
            
            <!-- Bordures holographiques -->
            <rect x="10" y="10" width="780" height="380" fill="none" stroke="#00ffff" stroke-width="3" rx="20" filter="url(#holoGlow)"/>
            <rect x="15" y="15" width="770" height="370" fill="none" stroke="#ff00ff" stroke-width="1" rx="15" opacity="0.6"/>
            
            <!-- Avatar Circle -->
            <clipPath id="holoAvatarClip">
                <circle cx="120" cy="120" r="48"/>
            </clipPath>
            <circle cx="120" cy="120" r="52" fill="#00ffff" filter="url(#holoGlow)" opacity="0.8"/>
            <circle cx="120" cy="120" r="50" fill="#000000" stroke="#ff00ff" stroke-width="2"/>
            <image href="${avatarBase64 || 'https://cdn.discordapp.com/embed/avatars/0.png'}" x="72" y="72" width="96" height="96" clip-path="url(#holoAvatarClip)"/>
            
            <!-- Level Badge -->
            <circle cx="680" cy="80" r="40" fill="#00ffff" filter="url(#holoGlow)" opacity="0.8"/>
            <circle cx="680" cy="80" r="35" fill="rgba(0,0,0,0.8)" stroke="#ff00ff" stroke-width="2"/>
            <text x="680" y="90" text-anchor="middle" fill="#00ffff" font-family="Arial Black" font-size="28" font-weight="bold" filter="url(#holoGlow)">${newLevel}</text>
            
            <!-- Semi-transparent background for text readability -->
            <rect x="180" y="80" width="400" height="80" fill="rgba(0,0,0,0.8)" rx="10"/>
            
            <!-- User Info -->
            <text x="200" y="105" fill="#ffffff" font-family="Arial Black" font-size="24" font-weight="bold" filter="url(#holoGlow)">${user.displayName || user.username || 'Unknown User'}</text>
            <text x="200" y="130" fill="#00ffff" font-family="Arial" font-size="18" filter="url(#holoGlow)">✨ Niveau ${newLevel}</text>
            <text x="200" y="150" fill="#ff00ff" font-family="Arial" font-size="16">Mode Holographique</text>
            
            <!-- XP Progress Bar -->
            ${progressData ? `
            <!-- Background semi-transparent pour la lisibilité -->
            <rect x="30" y="165" width="640" height="120" fill="rgba(0,0,0,0.7)" rx="10"/>
            
            <text x="50" y="185" fill="#ffffff" font-family="Arial Black" font-size="18" font-weight="bold">Progression XP:</text>
            <rect x="50" y="195" width="600" height="20" fill="rgba(0,0,0,0.7)" rx="10" stroke="#00ffff" stroke-width="2"/>
            <rect x="50" y="195" width="${(progressData.progressPercent / 100) * 600}" height="20" fill="#00ffff" rx="10" filter="url(#holoGlow)"/>
            <text x="350" y="210" text-anchor="middle" fill="#ffffff" font-family="Arial Black" font-size="14" font-weight="bold">${progressData.currentXP.toLocaleString()} / ${progressData.totalNeeded.toLocaleString()} XP (${progressData.progressPercent}%)</text>
            
            <!-- Stats -->
            <text x="50" y="245" fill="#ffffff" font-family="Arial Black" font-size="18" font-weight="bold">💬 Messages: ${progressData.totalMessages}</text>
            <text x="280" y="245" fill="#ffffff" font-family="Arial Black" font-size="18" font-weight="bold">🎤 Vocal: ${progressData.totalVoiceTime} min</text>
            <text x="50" y="275" fill="#00ffff" font-family="Arial Black" font-size="18" font-weight="bold" filter="url(#holoGlow)">⚡ XP Total: ${progressData.totalXP.toLocaleString()}</text>
            ` : `
            <rect x="40" y="170" width="150" height="25" fill="rgba(0,0,0,0.5)" rx="5"/>
            <text x="115" y="187" text-anchor="middle" fill="#00ffff" font-family="Arial Black" font-size="16" filter="url(#holoGlow)">NIVEAU ATTEINT</text>
            `}
            
            <!-- Classement XP en bas à droite -->
            ${progressData && progressData.rank ? `
            <rect x="560" y="300" width="220" height="80" fill="rgba(0,255,255,0.15)" rx="15" stroke="#00ffff" stroke-width="3" filter="url(#holoGlow)"/>
            <text x="670" y="325" text-anchor="middle" fill="#00ffff" font-family="Arial Black" font-size="20" font-weight="bold" filter="url(#holoGlow)">🏆 CLASSEMENT</text>
            <text x="670" y="350" text-anchor="middle" fill="#ffffff" font-family="Arial Black" font-size="28" font-weight="bold">#${progressData.rank}</text>
            <text x="670" y="370" text-anchor="middle" fill="#ff00ff" font-family="Arial Black" font-size="16" font-weight="bold">sur ${progressData.totalUsers} membres</text>
            ` : ''}
            
            <!-- Effets holographiques -->
            <line x1="0" y1="100" x2="800" y2="100" stroke="#00ffff" stroke-width="1" opacity="0.3"/>
            <line x1="0" y1="200" x2="800" y2="200" stroke="#ff00ff" stroke-width="1" opacity="0.3"/>
            <line x1="0" y1="300" x2="800" y2="300" stroke="#00ffff" stroke-width="1" opacity="0.3"/>
        </svg>`;
    }

    createGamerSVG(user, userLevel, oldLevel, newLevel, roleReward, progressData) {
        return `
        <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="gamerBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#0a0015"/>
                    <stop offset="50%" style="stop-color:#001144"/>
                    <stop offset="100%" style="stop-color:#000000"/>
                </linearGradient>
                <filter id="neonGlow">
                    <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                    <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                <pattern id="circuitPattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M0,25 L25,25 L25,0 M25,25 L50,25 M25,25 L25,50" stroke="#00ff88" stroke-width="1" opacity="0.6"/>
                    <circle cx="12" cy="12" r="3" fill="#00ff88" opacity="0.8"/>
                    <circle cx="37" cy="37" r="3" fill="#0088ff" opacity="0.8"/>
                    <rect x="20" y="20" width="10" height="10" fill="#ff0088" opacity="0.4"/>
                </pattern>
            </defs>
            
            <!-- Animated Background -->
            <rect width="800" height="400" fill="url(#gamerBg)"/>
            <rect width="800" height="400" fill="url(#circuitPattern)" opacity="0.4"/>
            
            <!-- Cyberpunk borders -->
            <rect x="10" y="10" width="780" height="380" fill="none" stroke="#00ff88" stroke-width="4" rx="25" filter="url(#neonGlow)"/>
            <rect x="20" y="20" width="760" height="360" fill="none" stroke="#0088ff" stroke-width="2" rx="20" opacity="0.8"/>
            
            <!-- Hexagonal Level Badge -->
            <polygon points="680,30 720,50 720,90 680,110 640,90 640,50" fill="#00ff88" filter="url(#neonGlow)"/>
            <polygon points="680,40 710,55 710,85 680,100 650,85 650,55" fill="#000011" stroke="#0088ff" stroke-width="2"/>
            <text x="680" y="75" text-anchor="middle" fill="#00ff88" font-family="Arial Black" font-size="32" font-weight="bold" filter="url(#neonGlow)">${newLevel}</text>
            
            <!-- Avatar Hexagon -->
            <clipPath id="gamerAvatarClip">
                <circle cx="120" cy="120" r="48"/>
            </clipPath>
            <polygon points="120,65 140,72 155,90 155,120 155,150 140,168 120,175 100,168 85,150 85,120 85,90 100,72" fill="#00ff88" filter="url(#neonGlow)"/>
            <circle cx="120" cy="120" r="50" fill="#000000"/>
            <image href="${user.avatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png'}" x="72" y="72" width="96" height="96" clip-path="url(#gamerAvatarClip)"/>
            
            <!-- User Info -->
            <text x="200" y="100" fill="#ffffff" font-family="Arial Black" font-size="28" font-weight="bold">${user.displayName || user.username || 'Unknown User'}</text>
            <text x="200" y="130" fill="#00ff88" font-family="Arial" font-size="22" filter="url(#neonGlow)">🎮 Niveau ${newLevel}</text>
            <text x="200" y="155" fill="#0088ff" font-family="Arial" font-size="18">Cyber Gamer Mode</text>
            
            <!-- XP Progress Bar -->
            ${progressData ? `
            <text x="50" y="200" fill="#ffffff" font-family="Arial" font-size="16">Progression XP:</text>
            <rect x="50" y="210" width="500" height="15" fill="#000000" rx="8" filter="url(#neonGlow)"/>
            <rect x="50" y="210" width="${(progressData.progressPercent / 100) * 500}" height="15" fill="#00ff88" rx="8" filter="url(#neonGlow)"/>
            <text x="300" y="222" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="12" font-weight="bold">${progressData.currentXP.toLocaleString()} / ${progressData.totalNeeded.toLocaleString()} XP (${progressData.progressPercent}%)</text>
            
            <!-- Stats -->
            <text x="50" y="250" fill="#ffffff" font-family="Arial" font-size="16">💬 Messages: ${progressData.totalMessages}</text>
            <text x="250" y="250" fill="#ffffff" font-family="Arial" font-size="16">🎤 Vocal: ${progressData.totalVoiceTime} min</text>
            <text x="450" y="250" fill="#00ff88" font-family="Arial" font-size="16" filter="url(#neonGlow)">⚡ XP Total: ${progressData.totalXP.toLocaleString()}</text>
            ` : `
            <rect x="40" y="170" width="150" height="30" fill="#00ff88" opacity="0.2" rx="5"/>
            <text x="50" y="190" fill="#ffffff" font-family="Arial" font-size="18" font-weight="bold">Ancien: ${oldLevel}</text>
            
            <rect x="40" y="210" width="150" height="30" fill="#0088ff" opacity="0.2" rx="5"/>
            <text x="50" y="230" fill="#ffffff" font-family="Arial" font-size="18" font-weight="bold">Nouveau: ${newLevel}</text>
            `}
            
            ${roleReward ? `<text x="50" y="280" fill="#ff0088" font-family="Arial" font-size="20" font-weight="bold">🏆 Rôle débloqué: ${roleReward.name}</text>` : ''}
            
            <!-- Gaming footer -->
            <rect x="0" y="340" width="800" height="60" fill="#00ff88" opacity="0.1"/>
            <text x="400" y="370" text-anchor="middle" fill="#00ff88" font-family="Arial Black" font-size="24" font-weight="bold" filter="url(#neonGlow)">
                🎮 ACHIEVEMENT UNLOCKED 🎮
            </text>
        </svg>`;
    }

    createAmourSVG(user, userLevel, oldLevel, newLevel, roleReward, progressData) {
        return `
        <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="amourBg" cx="50%" cy="50%" r="70%">
                    <stop offset="0%" style="stop-color:#ff1493" opacity="0.15"/>
                    <stop offset="50%" style="stop-color:#2d001a"/>
                    <stop offset="100%" style="stop-color:#1a0000"/>
                </radialGradient>
                <filter id="softGlow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                <pattern id="heartPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M30,45 C35,35 50,35 50,25 C50,20 45,15 40,15 C35,15 30,20 30,25 C30,20 25,15 20,15 C15,15 10,20 10,25 C10,35 25,35 30,45 Z" fill="#ff69b4" opacity="0.1"/>
                </pattern>
            </defs>
            
            <!-- Background -->
            <rect width="800" height="400" fill="url(#amourBg)"/>
            <rect width="800" height="400" fill="url(#heartPattern)"/>
            
            <!-- Elegant borders -->
            <rect x="10" y="10" width="780" height="380" fill="none" stroke="#ff69b4" stroke-width="2" rx="25" filter="url(#softGlow)"/>
            <rect x="20" y="20" width="760" height="360" fill="none" stroke="#ffd700" stroke-width="1" rx="20" opacity="0.6"/>
            
            <!-- Avatar Circle for Amour -->
            <clipPath id="amourAvatarClip">
                <circle cx="120" cy="120" r="48"/>
            </clipPath>
            <circle cx="120" cy="120" r="55" fill="#ff1493" filter="url(#softGlow)"/>
            <circle cx="120" cy="120" r="50" fill="#000000"/>
            <image href="${user.avatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png'}" x="72" y="72" width="96" height="96" clip-path="url(#amourAvatarClip)"/>
            
            <!-- Heart Level Badge -->
            <circle cx="680" cy="80" r="55" fill="#ff1493" filter="url(#softGlow)"/>
            <!-- Heart Shape Badge -->
            <path d="M680,105 C685,95 695,95 695,85 C695,80 690,75 685,75 C682,75 680,77 680,80 C680,77 678,75 675,75 C670,75 665,80 665,85 C665,95 675,95 680,105 Z" fill="#ffd700" filter="url(#softGlow)"/>
            <text x="680" y="70" text-anchor="middle" fill="#ffffff" font-family="Arial Black" font-size="24" font-weight="bold">${newLevel}</text>
            
            <!-- User Info -->
            <text x="200" y="100" fill="#ffffff" font-family="Arial" font-size="28" font-weight="bold">${user.displayName}</text>
            <text x="200" y="130" fill="#ff69b4" font-family="Arial" font-size="22" font-style="italic" filter="url(#softGlow)">💖 Niveau ${newLevel}</text>
            <text x="200" y="155" fill="#ffd700" font-family="Arial" font-size="18">Un niveau d'amour atteint !</text>
            
            <!-- XP Progress Bar -->
            ${progressData ? `
            <text x="50" y="200" fill="#ffffff" font-family="Arial" font-size="16">Progression XP:</text>
            <rect x="50" y="210" width="500" height="20" fill="#000000" rx="10" filter="url(#softGlow)"/>
            <rect x="50" y="210" width="${(progressData.progressPercent / 100) * 500}" height="20" fill="#ff69b4" rx="10" filter="url(#softGlow)"/>
            <text x="300" y="225" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="14" font-weight="bold">${progressData.currentXP.toLocaleString()} / ${progressData.totalNeeded.toLocaleString()} XP (${progressData.progressPercent}%)</text>
            
            <!-- Stats -->
            <text x="50" y="255" fill="#ffffff" font-family="Arial" font-size="16">💬 Messages: ${progressData.totalMessages}</text>
            <text x="250" y="255" fill="#ffffff" font-family="Arial" font-size="16">🎤 Vocal: ${progressData.totalVoiceTime} min</text>
            <text x="450" y="255" fill="#ff69b4" font-family="Arial" font-size="16" filter="url(#softGlow)">⚡ XP Total: ${progressData.totalXP.toLocaleString()}</text>
            ` : `
            <text x="50" y="200" fill="#ffffff" font-family="Arial" font-size="18">Niveau d'amour précédent:</text>
            <text x="250" y="200" fill="#ff69b4" font-family="Arial" font-size="22" font-weight="bold">${oldLevel}</text>
            <text x="50" y="230" fill="#ffffff" font-family="Arial" font-size="18">Nouveau niveau d'amour:</text>
            <text x="250" y="230" fill="#ffd700" font-family="Arial" font-size="26" font-weight="bold">${newLevel}</text>
            `}
            
            ${roleReward ? `<text x="50" y="285" fill="#ff1493" font-family="Arial" font-size="18">💝 Nouveau rôle d'amour: ${roleReward.name}</text>` : ''}
            
            <!-- Romantic decorations -->
            <rect x="0" y="350" width="800" height="50" fill="#ff69b4" opacity="0.3"/>
            <text x="400" y="375" text-anchor="middle" fill="#ffd700" font-family="Arial" font-size="18" font-style="italic" filter="url(#softGlow)">💕 L'amour grandit dans votre cœur 💕</text>
        </svg>`;
    }

    createSensuelSVG(user, userLevel, oldLevel, newLevel, roleReward, progressData) {
        return `
        <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="sensuelBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#1a0000"/>
                    <stop offset="50%" style="stop-color:#2d1a1a"/>
                    <stop offset="100%" style="stop-color:#000000"/>
                </linearGradient>
                <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#daa520"/>
                    <stop offset="50%" style="stop-color:#ffd700"/>
                    <stop offset="100%" style="stop-color:#b8860b"/>
                </linearGradient>
                <filter id="luxuryGlow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                <pattern id="velvetPattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                    <circle cx="15" cy="15" r="8" fill="#8b0000" opacity="0.3"/>
                    <circle cx="15" cy="15" r="4" fill="#dc143c" opacity="0.5"/>
                </pattern>
            </defs>
            
            <!-- Luxury Background -->
            <rect width="800" height="400" fill="url(#sensuelBg)"/>
            <rect width="800" height="400" fill="url(#velvetPattern)"/>
            
            <!-- Golden luxury borders -->
            <rect x="8" y="8" width="784" height="384" fill="none" stroke="url(#goldAccent)" stroke-width="4" rx="30" filter="url(#luxuryGlow)"/>
            <rect x="18" y="18" width="764" height="364" fill="none" stroke="#dc143c" stroke-width="2" rx="25" opacity="0.8"/>
            
            <!-- Lips Level Badge -->
            <ellipse cx="680" cy="70" rx="45" ry="25" fill="url(#goldAccent)" filter="url(#luxuryGlow)"/>
            <!-- Lips Shape -->
            <path d="M645,70 Q660,55 680,70 Q700,55 715,70 Q700,85 680,70 Q660,85 645,70 Z" fill="#dc143c" filter="url(#luxuryGlow)"/>
            <ellipse cx="680" cy="70" rx="35" ry="15" fill="#000000" opacity="0.3"/>
            <text x="680" y="75" text-anchor="middle" fill="#ffd700" font-family="Arial Black" font-size="24" font-weight="bold" filter="url(#luxuryGlow)">${newLevel}</text>
            
            <!-- Avatar Circle with proper clipping -->
            <defs>
                <clipPath id="avatarClip">
                    <circle cx="120" cy="120" r="48"/>
                </clipPath>
            </defs>
            <circle cx="120" cy="120" r="55" fill="url(#goldAccent)" filter="url(#luxuryGlow)"/>
            <circle cx="120" cy="120" r="50" fill="#000000"/>
            <image href="${user.avatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png'}" x="72" y="72" width="96" height="96" clip-path="url(#avatarClip)"/>
            
            <!-- User Info -->
            <text x="200" y="100" fill="#ffffff" font-family="Arial" font-size="32" font-weight="bold">${user.displayName}</text>
            <text x="200" y="130" fill="url(#goldAccent)" font-family="Arial" font-size="24" font-style="italic" filter="url(#luxuryGlow)">Niveau ${newLevel}</text>
            <text x="200" y="155" fill="#dc143c" font-family="Arial" font-size="18">Raffinement et Élégance</text>
            
            <!-- XP Progress Bar -->
            ${progressData ? `
            <text x="50" y="210" fill="#ffffff" font-family="Arial" font-size="16">Progression XP:</text>
            <rect x="50" y="220" width="500" height="20" fill="#000000" rx="10" filter="url(#luxuryGlow)"/>
            <rect x="50" y="220" width="${(progressData.progressPercent / 100) * 500}" height="20" fill="url(#goldAccent)" rx="10" filter="url(#luxuryGlow)"/>
            <text x="300" y="235" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="14" font-weight="bold">${progressData.currentXP.toLocaleString()} / ${progressData.totalNeeded.toLocaleString()} XP (${progressData.progressPercent}%)</text>
            
            <!-- Stats -->
            <text x="50" y="270" fill="#ffffff" font-family="Arial" font-size="16">💬 Messages: ${progressData.totalMessages}</text>
            <text x="250" y="270" fill="#ffffff" font-family="Arial" font-size="16">🎤 Vocal: ${progressData.totalVoiceTime} min</text>
            <text x="450" y="270" fill="url(#goldAccent)" font-family="Arial" font-size="16" filter="url(#luxuryGlow)">⚡ XP Total: ${progressData.totalXP.toLocaleString()}</text>
            ` : `
            <text x="50" y="210" fill="#ffffff" font-family="Arial" font-size="18">Niveau précédent:</text>
            <text x="200" y="210" fill="#dc143c" font-family="Arial" font-size="22" font-weight="bold">${oldLevel}</text>
            
            <text x="50" y="240" fill="#ffffff" font-family="Arial" font-size="18">Nouveau niveau:</text>
            <text x="200" y="240" fill="url(#goldAccent)" font-family="Arial" font-size="26" font-weight="bold" filter="url(#luxuryGlow)">${newLevel}</text>
            `}
            
            ${roleReward ? `<text x="50" y="300" fill="#ffd700" font-family="Arial" font-size="20" font-style="italic">💎 Nouveau statut: ${roleReward.name}</text>` : ''}
            
            <!-- Luxury footer -->
            <rect x="0" y="340" width="800" height="60" fill="url(#goldAccent)" opacity="0.2"/>
            <text x="400" y="370" text-anchor="middle" fill="#ffd700" font-family="Arial" font-size="22" font-style="italic" filter="url(#luxuryGlow)">💋 Élégance et Sophistication 💋</text>
        </svg>`;
    }

    createLevelUpSVG(user, userLevel, oldLevel, newLevel, roleReward, theme, style = 'futuristic', progressData) {
        const nextLevelXP = this.calculateXPForLevel(newLevel + 1);
        const currentLevelXP = this.calculateXPForLevel(newLevel);
        const progress = ((userLevel.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
        
        return `
        <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${theme.gradient[0]};stop-opacity:0.1" />
                    <stop offset="100%" style="stop-color:${theme.gradient[1]};stop-opacity:0.3" />
                </linearGradient>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:${theme.gradient[0]}" />
                    <stop offset="100%" style="stop-color:${theme.gradient[1]}" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            
            <rect width="800" height="400" fill="${theme.background}"/>
            <rect width="800" height="400" fill="url(#bgGradient)"/>
            <rect x="10" y="10" width="780" height="380" fill="none" stroke="${theme.accent}" stroke-width="2" rx="20"/>
            
            <rect x="200" y="50" width="400" height="60" fill="${theme.accent}" opacity="0.2" rx="30"/>
            <text x="400" y="85" font-family="Arial Black" font-size="28" fill="${theme.text}" text-anchor="middle" font-weight="bold">NIVEAU ATTEINT !</text>
            
            ${style === 'holographic' ? `
            <!-- Glass morphism effect like the reference -->
            <linearGradient id="holoBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#00d4ff" opacity="0.2"/>
                <stop offset="50%" style="stop-color:#7c3aed" opacity="0.3"/>
                <stop offset="100%" style="stop-color:#1e293b" opacity="0.4"/>
            </linearGradient>
            <filter id="glassBlur">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
                <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0"/>
            </filter>
            <!-- Glass container -->
            <rect x="320" y="120" width="160" height="120" rx="20" fill="url(#holoBg)" stroke="#00d4ff" stroke-width="2" filter="url(#glassBlur)"/>
            <!-- Inner holographic effect -->
            <rect x="335" y="135" width="130" height="90" rx="12" fill="none" stroke="#7c3aed" stroke-width="1" opacity="0.6"/>
            <!-- Corner decorations like in reference -->
            <polygon points="325,125 345,125 335,135" fill="#00d4ff" opacity="0.8"/>
            <polygon points="455,125 475,125 465,135" fill="#7c3aed" opacity="0.8"/>
            <polygon points="325,235 345,235 335,225" fill="#7c3aed" opacity="0.8"/>
            <polygon points="455,235 475,235 465,225" fill="#00d4ff" opacity="0.8"/>
            <!-- Level number with holographic glow -->
            <text x="400" y="190" font-family="Arial Black" font-size="32" fill="#00d4ff" text-anchor="middle" font-weight="bold" filter="url(#glow)">${newLevel}</text>
            ` : `
            <circle cx="400" cy="180" r="40" fill="${theme.accent}" filter="url(#glow)"/>
            <text x="400" y="190" font-family="Arial Black" font-size="32" fill="${theme.background}" text-anchor="middle" font-weight="bold">${newLevel}</text>
            `}
            
            <!-- Avatar Circle for default styles -->
            <clipPath id="defaultAvatarClip">
                <circle cx="120" cy="120" r="48"/>
            </clipPath>
            <circle cx="120" cy="120" r="55" fill="${theme.accent}" filter="url(#glow)"/>
            <circle cx="120" cy="120" r="50" fill="#000000"/>
            <image href="${user.avatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png'}" x="72" y="72" width="96" height="96" clip-path="url(#defaultAvatarClip)"/>
            
            <!-- User Info -->
            <text x="200" y="190" fill="${theme.text}" font-family="Arial" font-size="22" font-weight="bold">${user.displayName}</text>
            <text x="200" y="215" fill="${theme.accent}" font-family="Arial" font-size="18">Niveau ${newLevel}</text>
            
            <!-- XP Progress Bar -->
            ${progressData ? `
            <text x="50" y="250" fill="${theme.text}" font-family="Arial" font-size="16">Progression XP:</text>
            <rect x="50" y="260" width="500" height="20" fill="#000000" rx="10"/>
            <rect x="50" y="260" width="${(progressData.progressPercent / 100) * 500}" height="20" fill="url(#progressGradient)" rx="10"/>
            <text x="300" y="275" text-anchor="middle" fill="${theme.text}" font-family="Arial" font-size="14" font-weight="bold">${progressData.currentXP.toLocaleString()} / ${progressData.totalNeeded.toLocaleString()} XP (${progressData.progressPercent}%)</text>
            
            <!-- Stats -->
            <text x="50" y="305" fill="${theme.text}" font-family="Arial" font-size="16">💬 Messages: ${progressData.totalMessages}</text>
            <text x="250" y="305" fill="${theme.text}" font-family="Arial" font-size="16">🎤 Vocal: ${progressData.totalVoiceTime} min</text>
            <text x="450" y="305" fill="${theme.accent}" font-family="Arial" font-size="16">⚡ XP Total: ${progressData.totalXP.toLocaleString()}</text>
            ` : `
            <text x="200" y="250" fill="${theme.accent}" font-family="Arial" font-size="18">Niveau ${oldLevel} → ${newLevel}</text>
            `}
            
            ${roleReward ? `<text x="50" y="330" font-family="Arial" font-size="16" fill="${theme.text}">🏆 Nouveau rôle: ${roleReward.name}</text>` : ''}
            
            <rect x="0" y="350" width="800" height="50" fill="${theme.accent}" opacity="0.1"/>
            <text x="400" y="375" text-anchor="middle" fill="${theme.accent}" font-family="Arial" font-size="16" font-weight="bold">Félicitations pour votre progression !</text>
        </svg>`;
    }

    getTheme(style) {
        const themes = {
            'futuristic': {
                background: '#0a0a23',
                accent: '#5865F2',
                text: '#ffffff',
                gradient: ['#5865F2', '#7289DA']
            },
            'elegant': {
                background: '#2c1810',
                accent: '#9932cc',
                text: '#ffffff',
                gradient: ['#9932cc', '#dda0dd']
            },
            'gaming': {
                background: '#1a1a00',
                accent: '#ff6b35',
                text: '#ffffff',
                gradient: ['#ff6b35', '#f7931e']
            },
            'minimal': {
                background: '#f5f5f5',
                accent: '#333333',
                text: '#000000',
                gradient: ['#333333', '#666666']
            },
            'holographic': {
                background: '#0a0a2a',
                accent: '#00d4ff',
                text: '#ffffff',
                gradient: ['#00d4ff', '#7c3aed']
            }
        };
        
        return themes[style] || themes['futuristic'];
    }

    calculateXPForLevel(level) {
        return Math.floor(100 * Math.pow(level, 1.5));
    }

    async generateNotificationCard(user, level, progressData = null) {
        try {
            console.log(`🎉 Génération carte notification niveau ${level} pour ${user.displayName}`);
            
            // Télécharger l'avatar
            let avatarBase64 = '';
            try {
                if (user.avatarURL && user.avatarURL.startsWith('http')) {
                    const https = require('https');
                    const avatarData = await new Promise((resolve, reject) => {
                        https.get(user.avatarURL, (response) => {
                            let data = Buffer.alloc(0);
                            response.on('data', (chunk) => {
                                data = Buffer.concat([data, chunk]);
                            });
                            response.on('end', () => {
                                resolve(data);
                            });
                        }).on('error', (err) => {
                            console.log('⚠️ Erreur téléchargement avatar pour notification:', err);
                            reject(err);
                        });
                    });
                    avatarBase64 = `data:image/png;base64,${avatarData.toString('base64')}`;
                    console.log(`✅ Avatar téléchargé pour notification: ${avatarBase64.length} chars`);
                }
            } catch (error) {
                console.log('⚠️ Erreur téléchargement avatar pour notification:', error);
            }

            // Système d'image de fond selon les rôles (même que pour les cartes level)
            const fs = require('fs');
            const path = require('path');
            
            // Déterminer quelle image utiliser selon les rôles
            let imagePath = path.join(__dirname, '../../attached_assets/1_1753517381716.jpg'); // Default
            let imageFormat = 'jpeg';
            
            // Vérifier les rôles pour choisir l'image appropriée - priorité "certifié" sur "femme"
            if (user.roles && Array.isArray(user.roles)) {
                const roleNames = user.roles.map(role => role.name.toLowerCase());
                
                if (roleNames.includes('certifié')) {
                    imagePath = path.join(__dirname, '../../attached_assets/3_1753520815029.png');
                    imageFormat = 'png';
                    console.log('🎨 Notification: Utilisation image certifié (3.png)');
                } else if (roleNames.includes('femme')) {
                    imagePath = path.join(__dirname, '../../attached_assets/2_1753520814954.png');
                    imageFormat = 'png';
                    console.log('🎨 Notification: Utilisation image femme (2.png)');
                } else {
                    console.log('🎨 Notification: Utilisation image par défaut (1.jpg)');
                }
            }
            
            // Charger l'image de fond
            let bgImage = '';
            try {
                if (fs.existsSync(imagePath)) {
                    const imageBuffer = fs.readFileSync(imagePath);
                    bgImage = `data:image/${imageFormat};base64,${imageBuffer.toString('base64')}`;
                    console.log('✅ Image de fond chargée pour notification');
                }
            } catch (error) {
                console.log('⚠️ Image de fond non trouvée pour notification, utilisation fond holographique par défaut');
            }

            const svgContent = `
            <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="holoBg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#0a0a2a;stop-opacity:1"/>
                        <stop offset="25%" style="stop-color:#1e1e4a;stop-opacity:1"/>
                        <stop offset="50%" style="stop-color:#2a2a6a;stop-opacity:1"/>
                        <stop offset="75%" style="stop-color:#1a1a3a;stop-opacity:1"/>
                        <stop offset="100%" style="stop-color:#0a0a1a;stop-opacity:1"/>
                    </linearGradient>
                    <filter id="holoGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur"/>
                        <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    <pattern id="holoPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <rect width="40" height="40" fill="none"/>
                        <line x1="0" y1="0" x2="40" y2="40" stroke="#00ffff" stroke-width="0.5" opacity="0.3"/>
                        <line x1="40" y1="0" x2="0" y2="40" stroke="#ff00ff" stroke-width="0.5" opacity="0.3"/>
                    </pattern>
                </defs>
                
                <!-- Background Image ou Holographique -->
                ${bgImage ? `
                    <defs>
                        <clipPath id="notifCardClip">
                            <rect x="0" y="0" width="800" height="400" rx="20"/>
                        </clipPath>
                    </defs>
                    <image href="${bgImage}" x="0" y="0" width="800" height="400" clip-path="url(#notifCardClip)" preserveAspectRatio="xMidYMid slice"/>
                    <rect width="800" height="400" fill="url(#holoPattern)" opacity="0.2"/>
                ` : `
                    <rect width="800" height="400" fill="url(#holoBg)"/>
                    <rect width="800" height="400" fill="url(#holoPattern)"/>
                `}
                
                <!-- Overlay pour la lisibilité du texte -->
                <rect width="800" height="400" fill="rgba(0,0,0,0.4)" rx="20"/>
                
                <!-- Bordures néon blanches -->
                <rect x="10" y="10" width="780" height="380" fill="none" stroke="#ffffff" stroke-width="3" rx="20" filter="url(#holoGlow)"/>
                <rect x="15" y="15" width="770" height="370" fill="none" stroke="#cccccc" stroke-width="1" rx="15" opacity="0.8"/>
                
                <!-- Avatar Circle -->
                <clipPath id="notifAvatarClip">
                    <circle cx="120" cy="200" r="48"/>
                </clipPath>
                <circle cx="120" cy="200" r="52" fill="#ffffff" opacity="0.8"/>
                <circle cx="120" cy="200" r="50" fill="#000000" stroke="#ffffff" stroke-width="2"/>
                <image href="${avatarBase64 || 'https://cdn.discordapp.com/embed/avatars/0.png'}" x="72" y="152" width="96" height="96" clip-path="url(#notifAvatarClip)"/>
                
                <!-- Level Badge -->
                <circle cx="680" cy="100" r="50" fill="#ffffff" opacity="0.8"/>
                <circle cx="680" cy="100" r="45" fill="rgba(0,0,0,0.8)" stroke="#ffffff" stroke-width="2"/>
                <text x="680" y="115" text-anchor="middle" fill="#ffffff" font-family="Arial Black" font-size="36" font-weight="bold">${level}</text>
                
                <!-- Congratulations Text with background for readability -->
                <rect x="200" y="120" width="400" height="160" fill="rgba(0,0,0,0.6)" rx="15"/>
                <text x="400" y="150" text-anchor="middle" fill="#ffffff" font-family="Arial Black" font-size="32" font-weight="bold">Félicitations !</text>
                <text x="400" y="190" text-anchor="middle" fill="#ffffff" font-family="Arial Black" font-size="24" font-weight="bold">${user.displayName}</text>
                <text x="400" y="230" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="20">Tu as atteint le niveau ${level}</text>
                
                <!-- Decoration en bas -->
                <text x="400" y="340" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="18" font-style="italic">🎉 Montée de niveau ! 🎉</text>
                
                <!-- Effets holographiques -->
                <line x1="0" y1="100" x2="800" y2="100" stroke="#00ffff" stroke-width="1" opacity="0.3"/>
                <line x1="0" y1="300" x2="800" y2="300" stroke="#ff00ff" stroke-width="1" opacity="0.3"/>
            </svg>`;
            
            // Convertir en PNG avec Sharp
            return await sharp(Buffer.from(svgContent))
                .png()
                .resize(800, 400, { 
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .toBuffer();
                
        } catch (error) {
            console.error('❌ Erreur génération carte notification:', error);
            return await this.generateFallbackCard(user, level);
        }
    }

    async generateFallbackCard(user, newLevel) {
        try {
            const fallbackSVG = `
            <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
                <rect width="800" height="400" fill="#2c2f33"/>
                <rect x="10" y="10" width="780" height="380" fill="none" stroke="#7289DA" stroke-width="2" rx="20"/>
                <text x="400" y="200" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="32" font-weight="bold">
                    Niveau ${newLevel} atteint !
                </text>
                <text x="400" y="240" text-anchor="middle" fill="#7289DA" font-family="Arial" font-size="24">
                    ${user.displayName}
                </text>
            </svg>`;
            
            return await sharp(Buffer.from(fallbackSVG))
                .png()
                .resize(800, 400)
                .toBuffer();
        } catch (error) {
            console.error('Erreur génération carte fallback:', error);
            return Buffer.from('Level Up!');
        }
    }

    async generateRewardCard(user, rewardText, level, progressData = null) {
        try {
            console.log(`🎁 Génération carte récompense pour ${user.displayName}: ${rewardText}`);
            
            // Télécharger l'avatar
            let avatarBase64 = '';
            try {
                if (user.avatarURL && user.avatarURL.startsWith('http')) {
                    const https = require('https');
                    const avatarData = await new Promise((resolve, reject) => {
                        https.get(user.avatarURL, (response) => {
                            let data = Buffer.alloc(0);
                            response.on('data', (chunk) => {
                                data = Buffer.concat([data, chunk]);
                            });
                            response.on('end', () => {
                                resolve(data);
                            });
                        }).on('error', (err) => {
                            console.log('⚠️ Erreur téléchargement avatar pour récompense:', err);
                            reject(err);
                        });
                    });
                    avatarBase64 = `data:image/png;base64,${avatarData.toString('base64')}`;
                    console.log(`✅ Avatar téléchargé pour récompense: ${avatarBase64.length} chars`);
                }
            } catch (error) {
                console.log('⚠️ Erreur téléchargement avatar pour récompense:', error);
            }

            // Système d'image de fond selon les rôles (même que pour les cartes level)
            const fs = require('fs');
            const path = require('path');
            
            // Déterminer quelle image utiliser selon les rôles
            let imagePath = path.join(__dirname, '../../attached_assets/1_1753517381716.jpg'); // Default
            let imageFormat = 'jpeg';
            
            // Vérifier les rôles pour choisir l'image appropriée - priorité "certifié" sur "femme"
            if (user.roles && Array.isArray(user.roles)) {
                const roleNames = user.roles.map(role => role.name.toLowerCase());
                
                if (roleNames.includes('certifié')) {
                    imagePath = path.join(__dirname, '../../attached_assets/3_1753521071380.png');
                    imageFormat = 'png';
                    console.log('🎨 Récompense: Utilisation image certifié (3_1753521071380.png)');
                } else if (roleNames.includes('femme')) {
                    imagePath = path.join(__dirname, '../../attached_assets/2_1753521071482.png');
                    imageFormat = 'png';
                    console.log('🎨 Récompense: Utilisation image femme (2_1753521071482.png)');
                } else {
                    console.log('🎨 Récompense: Utilisation image par défaut (1_1753517381716.jpg)');
                }
            }
            
            // Charger l'image de fond
            let bgImage = '';
            try {
                if (fs.existsSync(imagePath)) {
                    const imageBuffer = fs.readFileSync(imagePath);
                    bgImage = `data:image/${imageFormat};base64,${imageBuffer.toString('base64')}`;
                    console.log('✅ Image de fond chargée pour récompense');
                }
            } catch (error) {
                console.log('⚠️ Image de fond non trouvée pour récompense, utilisation fond holographique par défaut');
            }

            const svgContent = `
            <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="rewardBg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#2a0a2a;stop-opacity:1"/>
                        <stop offset="25%" style="stop-color:#4a1e4a;stop-opacity:1"/>
                        <stop offset="50%" style="stop-color:#6a2a6a;stop-opacity:1"/>
                        <stop offset="75%" style="stop-color:#3a1a3a;stop-opacity:1"/>
                        <stop offset="100%" style="stop-color:#1a0a1a;stop-opacity:1"/>
                    </linearGradient>
                    <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur"/>
                        <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    <pattern id="starPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                        <circle cx="30" cy="30" r="2" fill="#ffd700" opacity="0.6"/>
                        <circle cx="15" cy="15" r="1" fill="#ffff00" opacity="0.4"/>
                        <circle cx="45" cy="45" r="1" fill="#ffff00" opacity="0.4"/>
                    </pattern>
                </defs>
                
                <!-- Background Image ou Holographique -->
                ${bgImage ? `
                    <defs>
                        <clipPath id="rewardCardClip">
                            <rect x="0" y="0" width="800" height="400" rx="20"/>
                        </clipPath>
                    </defs>
                    <image href="${bgImage}" x="0" y="0" width="800" height="400" clip-path="url(#rewardCardClip)" preserveAspectRatio="xMidYMid slice"/>
                    <rect width="800" height="400" fill="url(#starPattern)" opacity="0.3"/>
                ` : `
                    <rect width="800" height="400" fill="url(#rewardBg)"/>
                    <rect width="800" height="400" fill="url(#starPattern)"/>
                `}
                
                <!-- Overlay pour la lisibilité du texte -->
                <rect width="800" height="400" fill="rgba(0,0,0,0.5)" rx="20"/>
                
                <!-- Bordures néon dorées -->
                <rect x="10" y="10" width="780" height="380" fill="none" stroke="#ffd700" stroke-width="4" rx="20" filter="url(#goldGlow)"/>
                <rect x="15" y="15" width="770" height="370" fill="none" stroke="#ffff00" stroke-width="2" rx="15" opacity="0.8"/>
                
                <!-- Avatar Circle -->
                <clipPath id="rewardAvatarClip">
                    <circle cx="120" cy="200" r="48"/>
                </clipPath>
                <circle cx="120" cy="200" r="52" fill="#ffd700" opacity="0.9"/>
                <circle cx="120" cy="200" r="50" fill="#000000" stroke="#ffff00" stroke-width="3"/>
                <image href="${avatarBase64 || 'https://cdn.discordapp.com/embed/avatars/0.png'}" x="72" y="152" width="96" height="96" clip-path="url(#rewardAvatarClip)"/>
                
                <!-- Level Badge -->
                <circle cx="680" cy="100" r="50" fill="#ffd700" opacity="0.9"/>
                <circle cx="680" cy="100" r="45" fill="rgba(0,0,0,0.8)" stroke="#ffff00" stroke-width="2"/>
                <text x="680" y="115" text-anchor="middle" fill="#ffd700" font-family="Arial Black" font-size="36" font-weight="bold">${level}</text>
                
                <!-- Reward Text with background for readability -->
                <rect x="200" y="120" width="400" height="160" fill="rgba(0,0,0,0.7)" rx="15"/>
                <text x="400" y="150" text-anchor="middle" fill="#ffd700" font-family="Arial Black" font-size="28" font-weight="bold">🎁 Récompense !</text>
                <text x="400" y="185" text-anchor="middle" fill="#ffff00" font-family="Arial Black" font-size="22" font-weight="bold">${user.displayName}</text>
                <text x="400" y="220" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="18">Niveau ${level} atteint !</text>
                <text x="400" y="250" text-anchor="middle" fill="#ffd700" font-family="Arial" font-size="16">${rewardText}</text>
                
                <!-- Decoration en bas -->
                <text x="400" y="340" text-anchor="middle" fill="#ffd700" font-family="Arial" font-size="18" font-style="italic">✨ Nouvelle récompense obtenue ! ✨</text>
                
                <!-- Effets dorés -->
                <line x1="0" y1="100" x2="800" y2="100" stroke="#ffd700" stroke-width="1" opacity="0.5"/>
                <line x1="0" y1="300" x2="800" y2="300" stroke="#ffff00" stroke-width="1" opacity="0.5"/>
            </svg>`;
            
            // Convertir en PNG avec Sharp
            return await sharp(Buffer.from(svgContent))
                .png()
                .resize(800, 400, { 
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .toBuffer();
                
        } catch (error) {
            console.error('❌ Erreur génération carte récompense:', error);
            return await this.generateFallbackCard(user, level);
        }
    }
}

module.exports = new LevelCardGenerator();