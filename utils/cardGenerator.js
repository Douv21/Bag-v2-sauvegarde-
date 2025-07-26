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
        
        // Créer un SVG holographique avancé
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <radialGradient id="holoBg" cx="50%" cy="50%" r="70%">
            <stop offset="0%" style="stop-color:#001133;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#003366;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#000022;stop-opacity:1" />
        </radialGradient>
        
        <linearGradient id="neonBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#00ffff;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#0099ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0066cc;stop-opacity:1" />
        </linearGradient>
        
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
        
        <filter id="textGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>
    
    <!-- Background -->
    <rect width="100%" height="100%" fill="url(#holoBg)"/>
    
    <!-- Grid pattern -->
    ${this.generateGridPattern()}
    
    <!-- Main frame with glow -->
    <rect x="20" y="20" width="${this.width-40}" height="${this.height-40}" 
          fill="none" stroke="url(#neonBlue)" stroke-width="2" filter="url(#glow)"/>
    
    <!-- Corner elements -->
    ${this.generateCornerElements()}
    
    <!-- Circular HUD elements -->
    ${this.generateCircularHUD()}
    
    <!-- User info panel -->
    <rect x="60" y="80" width="480" height="340" fill="rgba(0,51,102,0.3)" 
          stroke="#00ccff" stroke-width="1" filter="url(#glow)"/>
    
    <!-- Header with glow -->
    <text x="300" y="110" text-anchor="middle" fill="#00ffff" font-family="Arial, sans-serif" 
          font-size="24" font-weight="bold" filter="url(#textGlow)">HOLOGRAPHIC INTERFACE</text>
    
    <!-- User avatar circle -->
    <circle cx="150" cy="180" r="40" fill="none" stroke="#00ccff" stroke-width="2" filter="url(#glow)"/>
    <text x="150" y="185" text-anchor="middle" fill="#00ffff" font-family="Arial, sans-serif" 
          font-size="14" font-weight="bold" filter="url(#textGlow)">USER</text>
    
    <!-- User data -->
    <text x="220" y="160" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="bold" filter="url(#textGlow)">
        ${user.username.toUpperCase()}
    </text>
    <text x="220" y="180" fill="#00ccff" font-family="Arial, sans-serif" font-size="12" filter="url(#textGlow)">
        ID: ${user.id.substring(0,10)}...
    </text>
    <text x="220" y="200" fill="#00ff88" font-family="Arial, sans-serif" font-size="14" filter="url(#textGlow)">
        STATUS: ONLINE
    </text>
    
    <!-- Stats bars with glow -->
    ${this.generateStatsBars(userData.balance, karmaTotal)}
    
    <!-- Data sections -->
    <text x="80" y="280" fill="#cccccc" font-family="Arial, sans-serif" font-size="12">INSCRIPTION:</text>
    <text x="80" y="295" fill="#00ccff" font-family="Arial, sans-serif" font-size="12" filter="url(#textGlow)">${inscriptionDate}</text>
    
    <text x="280" y="280" fill="#cccccc" font-family="Arial, sans-serif" font-size="12">SERVEUR:</text>
    <text x="280" y="295" fill="#00ccff" font-family="Arial, sans-serif" font-size="12" filter="url(#textGlow)">${arriveeDate}</text>
    
    <text x="80" y="330" fill="#cccccc" font-family="Arial, sans-serif" font-size="12">MESSAGES:</text>
    <text x="80" y="345" fill="#ffff00" font-family="Arial, sans-serif" font-size="12" filter="url(#textGlow)">${userStats.messageCount}</text>
    
    <text x="280" y="330" fill="#cccccc" font-family="Arial, sans-serif" font-size="12">CREDITS:</text>
    <text x="280" y="345" fill="#00ff00" font-family="Arial, sans-serif" font-size="12" filter="url(#textGlow)">${userData.balance}€</text>
    
    <text x="300" y="380" text-anchor="middle" fill="#cccccc" font-family="Arial, sans-serif" font-size="12">KARMA MATRIX:</text>
    <text x="300" y="395" text-anchor="middle" fill="#ff6600" font-family="Arial, sans-serif" font-size="12" filter="url(#textGlow)">
        GOOD: ${userData.karmaGood || 0} | BAD: ${userData.karmaBad || 0}
    </text>
    
    <!-- Side panels -->
    ${this.generateSidePanels()}
</svg>`;

        return svg;
    }

    drawHolographicBackground(ctx) {
        // Gradient radial holographique
        const gradient = ctx.createRadialGradient(400, 250, 0, 400, 250, 400);
        gradient.addColorStop(0, '#001133');
        gradient.addColorStop(0.5, '#003366');
        gradient.addColorStop(1, '#000022');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    drawGrid(ctx) {
        ctx.strokeStyle = 'rgba(0, 51, 102, 0.3)';
        ctx.lineWidth = 0.5;
        
        // Lignes verticales
        for (let x = 0; x < this.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        
        // Lignes horizontales
        for (let y = 0; y < this.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
    }

    drawMainFrame(ctx) {
        ctx.strokeStyle = '#00ccff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ccff';
        ctx.shadowBlur = 10;
        
        ctx.strokeRect(20, 20, this.width - 40, this.height - 40);
        
        ctx.shadowBlur = 0; // Reset shadow
    }

    drawCircularHUD(ctx) {
        // Grand cercle HUD gauche
        ctx.strokeStyle = '#00ccff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ccff';
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.arc(120, 120, 50, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(120, 120, 35, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(120, 120, 20, 0, Math.PI * 2);
        ctx.stroke();
        
        // Arcs rotatifs
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(120, 120, 50, 0, Math.PI);
        ctx.stroke();
        
        // Petit cercle HUD droite
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.width - 120, 120, 30, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(this.width - 120, 120, 15, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }

    drawUserPanel(ctx) {
        ctx.fillStyle = 'rgba(0, 51, 102, 0.3)';
        ctx.strokeStyle = '#00ccff';
        ctx.lineWidth = 1;
        ctx.shadowColor = '#00ccff';
        ctx.shadowBlur = 5;
        
        ctx.fillRect(60, 80, 480, 340);
        ctx.strokeRect(60, 80, 480, 340);
        
        ctx.shadowBlur = 0;
    }

    drawGlowText(ctx, text, x, y) {
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;
    }

    drawUserAvatar(ctx, user) {
        ctx.strokeStyle = '#00ccff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ccff';
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.arc(150, 180, 40, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        this.drawGlowText(ctx, 'USER', 150, 185);
        
        ctx.shadowBlur = 0;
    }

    drawUserData(ctx, user, userData, userStats, karmaTotal, inscriptionDate, arriveeDate) {
        // Nom utilisateur
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        this.drawGlowText(ctx, user.username.toUpperCase(), 220, 160);
        
        // ID
        ctx.fillStyle = '#00ccff';
        ctx.font = '12px Arial';
        this.drawGlowText(ctx, `ID: ${user.id.substring(0,10)}...`, 220, 180);
        
        // Status
        ctx.fillStyle = '#00ff88';
        ctx.font = '14px Arial';
        this.drawGlowText(ctx, 'STATUS: ONLINE', 220, 200);
        
        // Dates
        ctx.fillStyle = '#cccccc';
        ctx.font = '12px Arial';
        ctx.fillText('INSCRIPTION:', 80, 280);
        ctx.fillStyle = '#00ccff';
        this.drawGlowText(ctx, inscriptionDate, 80, 295);
        
        ctx.fillStyle = '#cccccc';
        ctx.fillText('SERVEUR:', 280, 280);
        ctx.fillStyle = '#00ccff';
        this.drawGlowText(ctx, arriveeDate, 280, 295);
        
        // Stats
        ctx.fillStyle = '#cccccc';
        ctx.fillText('MESSAGES:', 80, 330);
        ctx.fillStyle = '#ffff00';
        this.drawGlowText(ctx, userStats.messageCount.toString(), 80, 345);
        
        ctx.fillStyle = '#cccccc';
        ctx.fillText('CREDITS:', 280, 330);
        ctx.fillStyle = '#00ff00';
        this.drawGlowText(ctx, `${userData.balance}€`, 280, 345);
        
        // Karma
        ctx.fillStyle = '#cccccc';
        ctx.textAlign = 'center';
        ctx.fillText('KARMA MATRIX:', 300, 380);
        ctx.fillStyle = '#ff6600';
        this.drawGlowText(ctx, `GOOD: ${userData.karmaGood || 0} | BAD: ${userData.karmaBad || 0}`, 300, 395);
    }

    drawStatsBars(ctx, balance, karma) {
        const balancePercent = Math.min((balance / 1000) * 100, 100);
        const karmaPercent = Math.max(0, Math.min(((karma + 100) / 200) * 100, 100));
        
        // Barre de balance
        ctx.fillStyle = 'rgba(0, 51, 102, 0.5)';
        ctx.fillRect(220, 250, 200, 8);
        ctx.strokeStyle = '#00ccff';
        ctx.strokeRect(220, 250, 200, 8);
        
        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 5;
        ctx.fillRect(220, 250, (balancePercent / 100) * 200, 8);
        
        ctx.fillStyle = '#cccccc';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.shadowBlur = 0;
        ctx.fillText('WEALTH', 430, 245);
        
        // Barre de karma
        ctx.fillStyle = 'rgba(0, 51, 102, 0.5)';
        ctx.fillRect(220, 270, 200, 8);
        ctx.strokeStyle = '#00ccff';
        ctx.strokeRect(220, 270, 200, 8);
        
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 5;
        ctx.fillRect(220, 270, (karmaPercent / 100) * 200, 8);
        
        ctx.fillStyle = '#cccccc';
        ctx.shadowBlur = 0;
        ctx.fillText('KARMA', 430, 265);
    }

    drawSidePanels(ctx) {
        // Panel latéral
        ctx.fillStyle = 'rgba(0, 51, 102, 0.2)';
        ctx.strokeStyle = '#00ccff';
        ctx.lineWidth = 1;
        ctx.shadowColor = '#00ccff';
        ctx.shadowBlur = 5;
        
        ctx.fillRect(560, 80, 180, 340);
        ctx.strokeRect(560, 80, 180, 340);
        
        // Lignes de données
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;
        
        ctx.beginPath();
        ctx.moveTo(580, 120);
        ctx.lineTo(720, 120);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(580, 140);
        ctx.lineTo(700, 140);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(580, 160);
        ctx.lineTo(680, 160);
        ctx.stroke();
        
        ctx.globalAlpha = 1;
        
        // Indicateurs de statut
        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        ctx.arc(590, 200, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(590, 220, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.beginPath();
        ctx.arc(590, 240, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Textes des statuts
        ctx.fillStyle = '#cccccc';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.shadowBlur = 0;
        ctx.fillText('SYSTEM OK', 600, 205);
        ctx.fillText('DATA SYNC', 600, 225);
        ctx.fillText('PROCESSING', 600, 245);
        
        ctx.shadowBlur = 0;
    }

    generateGridPattern() {
        let grid = '';
        // Vertical lines
        for (let x = 0; x < this.width; x += 40) {
            grid += `<line x1="${x}" y1="0" x2="${x}" y2="${this.height}" 
                     stroke="#003366" stroke-width="0.5" opacity="0.3"/>`;
        }
        // Horizontal lines
        for (let y = 0; y < this.height; y += 40) {
            grid += `<line x1="0" y1="${y}" x2="${this.width}" y2="${y}" 
                     stroke="#003366" stroke-width="0.5" opacity="0.3"/>`;
        }
        return grid;
    }

    generateCornerElements() {
        return `
            <!-- Top-left corner -->
            <path d="M 40 40 L 80 40 L 80 45 L 45 45 L 45 80 L 40 80 Z" 
                  fill="#00ccff" filter="url(#glow)"/>
            
            <!-- Top-right corner -->
            <path d="M ${this.width-40} 40 L ${this.width-80} 40 L ${this.width-80} 45 L ${this.width-45} 45 L ${this.width-45} 80 L ${this.width-40} 80 Z" 
                  fill="#00ccff" filter="url(#glow)"/>
            
            <!-- Bottom-left corner -->
            <path d="M 40 ${this.height-40} L 80 ${this.height-40} L 80 ${this.height-45} L 45 ${this.height-45} L 45 ${this.height-80} L 40 ${this.height-80} Z" 
                  fill="#00ccff" filter="url(#glow)"/>
            
            <!-- Bottom-right corner -->
            <path d="M ${this.width-40} ${this.height-40} L ${this.width-80} ${this.height-40} L ${this.width-80} ${this.height-45} L ${this.width-45} ${this.height-45} L ${this.width-45} ${this.height-80} L ${this.width-40} ${this.height-80} Z" 
                  fill="#00ccff" filter="url(#glow)"/>
        `;
    }

    generateCircularHUD() {
        return `
            <!-- Main circular HUD (top-left) -->
            <circle cx="120" cy="120" r="50" fill="none" stroke="#00ccff" stroke-width="2" filter="url(#glow)"/>
            <circle cx="120" cy="120" r="35" fill="none" stroke="#0099ff" stroke-width="1" opacity="0.7"/>
            <circle cx="120" cy="120" r="20" fill="none" stroke="#00ffff" stroke-width="1" opacity="0.5"/>
            
            <!-- Rotating elements -->
            <path d="M 120 70 A 50 50 0 0 1 170 120" fill="none" stroke="#00ffff" stroke-width="3" opacity="0.8"/>
            <path d="M 170 120 A 50 50 0 0 1 120 170" fill="none" stroke="#0066cc" stroke-width="2" opacity="0.6"/>
            
            <!-- Small circular HUD (top-right) -->
            <circle cx="${this.width-120}" cy="120" r="30" fill="none" stroke="#00ccff" stroke-width="1" filter="url(#glow)"/>
            <circle cx="${this.width-120}" cy="120" r="15" fill="none" stroke="#00ffff" stroke-width="1" opacity="0.7"/>
        `;
    }

    generateStatsBars(balance, karma) {
        const balancePercent = Math.min((balance / 1000) * 100, 100);
        const karmaPercent = Math.max(0, Math.min(((karma + 100) / 200) * 100, 100));
        
        return `
            <!-- Balance bar -->
            <rect x="220" y="250" width="200" height="8" fill="rgba(0,51,102,0.5)" stroke="#00ccff" stroke-width="1"/>
            <rect x="220" y="250" width="${balancePercent * 2}" height="8" fill="#00ff00" filter="url(#glow)"/>
            <text x="430" y="245" fill="#cccccc" font-family="Arial, sans-serif" font-size="10">WEALTH</text>
            
            <!-- Karma bar -->
            <rect x="220" y="270" width="200" height="8" fill="rgba(0,51,102,0.5)" stroke="#00ccff" stroke-width="1"/>
            <rect x="220" y="270" width="${karmaPercent * 2}" height="8" fill="#ff6600" filter="url(#glow)"/>
            <text x="430" y="265" fill="#cccccc" font-family="Arial, sans-serif" font-size="10">KARMA</text>
        `;
    }

    generateSidePanels() {
        return `
            <!-- Left side panel -->
            <rect x="560" y="80" width="180" height="340" fill="rgba(0,51,102,0.2)" 
                  stroke="#00ccff" stroke-width="1" filter="url(#glow)"/>
            
            <!-- Data stream lines -->
            <line x1="580" y1="120" x2="720" y2="120" stroke="#00ffff" stroke-width="1" opacity="0.7"/>
            <line x1="580" y1="140" x2="700" y2="140" stroke="#0099ff" stroke-width="1" opacity="0.5"/>
            <line x1="580" y1="160" x2="680" y2="160" stroke="#00ccff" stroke-width="1" opacity="0.6"/>
            <line x1="580" y1="180" x2="710" y2="180" stroke="#00ffff" stroke-width="1" opacity="0.4"/>
            
            <!-- Status indicators -->
            <circle cx="590" cy="200" r="3" fill="#00ff00" filter="url(#glow)"/>
            <text x="600" y="205" fill="#cccccc" font-family="Arial, sans-serif" font-size="10">SYSTEM OK</text>
            
            <circle cx="590" cy="220" r="3" fill="#00ff00" filter="url(#glow)"/>
            <text x="600" y="225" fill="#cccccc" font-family="Arial, sans-serif" font-size="10">DATA SYNC</text>
            
            <circle cx="590" cy="240" r="3" fill="#ffff00" filter="url(#glow)"/>
            <text x="600" y="245" fill="#cccccc" font-family="Arial, sans-serif" font-size="10">PROCESSING</text>
        `;
    }

    async saveCard(svg, filename) {
        const cardsDir = path.join(__dirname, '../temp_cards');
        if (!fs.existsSync(cardsDir)) {
            fs.mkdirSync(cardsDir, { recursive: true });
        }
        
        // Convertir SVG en PNG avec Sharp
        const pngFilename = filename.replace('.svg', '.png');
        const filepath = path.join(cardsDir, pngFilename);
        
        try {
            // Créer le buffer SVG et le convertir en PNG
            const svgBuffer = Buffer.from(svg);
            await sharp(svgBuffer)
                .png()
                .resize(800, 500)
                .toFile(filepath);
            
            return filepath;
        } catch (error) {
            console.error('Erreur conversion SVG vers PNG:', error);
            // Fallback: sauvegarder en SVG
            const svgPath = path.join(cardsDir, filename);
            fs.writeFileSync(svgPath, svg);
            return svgPath;
        }
    }
}

module.exports = HolographicCardGenerator;