const fs = require('fs');
const path = require('path');
const https = require('https');

function normalizeRoleName(roleName) {
    if (!roleName || typeof roleName !== 'string') return '';
    return roleName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

function getMimeFromExt(ext) {
    const e = ext.toLowerCase();
    if (e === 'png') return 'image/png';
    if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
    if (e === 'webp') return 'image/webp';
    return 'application/octet-stream';
}

function readFileAsDataUri(filePath) {
    try {
        if (!fs.existsSync(filePath)) return '';
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).replace('.', '') || 'png';
        const mime = getMimeFromExt(ext);
        return `data:${mime};base64,${buffer.toString('base64')}`;
    } catch (err) {
        console.log('⚠️ Erreur lecture image:', err.message);
        return '';
    }
}

function fetchUrlAsDataUri(url) {
    return new Promise((resolve) => {
        try {
            https.get(url, (response) => {
                let data = Buffer.alloc(0);
                response.on('data', (chunk) => { data = Buffer.concat([data, chunk]); });
                response.on('end', () => {
                    const ext = (url.split('.').pop() || 'png').split('?')[0];
                    const mime = getMimeFromExt(ext);
                    resolve(`data:${mime};base64,${data.toString('base64')}`);
                });
            }).on('error', () => resolve(''));
        } catch (_) {
            resolve('');
        }
    });
}

function loadStyleBackgroundsConfig() {
    try {
        const configPath = path.join(__dirname, '../data/level_config.json');
        if (!fs.existsSync(configPath)) return {};
        const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return parsed.styleBackgrounds || {};
    } catch (err) {
        console.log('⚠️ Erreur chargement styleBackgrounds:', err.message);
        return {};
    }
}

function tryResolveFromConfig(style, normalizedRoleNames, styleBackgrounds) {
    const styleCfg = styleBackgrounds[style];
    if (!styleCfg) return '';

    // byRole peut être { roleKey: pathOrUrl }
    const byRole = styleCfg.byRole || styleCfg.roles || {};

    for (const roleName of normalizedRoleNames) {
        if (byRole[roleName]) {
            const target = byRole[roleName];
            if (typeof target === 'string' && target.trim().length > 0) {
                if (target.startsWith('http://') || target.startsWith('https://')) {
                    return target; // sera fetch plus tard au besoin
                }
                const abs = path.isAbsolute(target) ? target : path.join(__dirname, '..', target);
                if (fs.existsSync(abs)) return abs;
            }
        }
    }

    if (typeof styleCfg.default === 'string' && styleCfg.default.trim().length > 0) {
        const def = styleCfg.default;
        if (def.startsWith('http://') || def.startsWith('https://')) {
            return def;
        }
        const abs = path.isAbsolute(def) ? def : path.join(__dirname, '..', def);
        if (fs.existsSync(abs)) return abs;
    }

    return '';
}

function tryResolveFromStyleFolder(style, normalizedRoleNames) {
    const baseDir = path.join(__dirname, '..', 'assets', 'styles', style);
    const exts = ['png', 'jpg', 'jpeg', 'webp'];
    try {
        if (!fs.existsSync(baseDir)) return '';

        // Match par rôle
        for (const role of normalizedRoleNames) {
            for (const ext of exts) {
                const p = path.join(baseDir, `${role}.${ext}`);
                if (fs.existsSync(p)) return p;
            }
        }

        // Fallback default.*
        for (const ext of exts) {
            const p = path.join(baseDir, `default.${ext}`);
            if (fs.existsSync(p)) return p;
        }

        return '';
    } catch (_) {
        return '';
    }
}

function tryResolveLegacyHolographic(normalizedRoleNames) {
    const baseAssets = path.join(__dirname, '..', 'assets');
    const defaultPath = path.join(baseAssets, 'background_1.jpg');
    const femmePath = path.join(baseAssets, 'background_2.png');
    const certifiePath = path.join(baseAssets, 'background_3.png');

    if (normalizedRoleNames.includes('certifie')) {
        if (fs.existsSync(certifiePath)) return certifiePath;
    }
    if (normalizedRoleNames.includes('femme')) {
        if (fs.existsSync(femmePath)) return femmePath;
    }
    if (fs.existsSync(defaultPath)) return defaultPath;
    return '';
}

async function resolveBackgroundImage(style, userRoles = []) {
    try {
        const normalizedRoles = Array.isArray(userRoles)
            ? userRoles.map(r => normalizeRoleName(r.name || r)).filter(Boolean)
            : [];

        // 1) Config JSON
        const styleBackgrounds = loadStyleBackgroundsConfig();
        let resolved = tryResolveFromConfig(style, normalizedRoles, styleBackgrounds);

        // 2) Dossier assets/styles/<style>
        if (!resolved) {
            resolved = tryResolveFromStyleFolder(style, normalizedRoles);
        }

        // 3) Fallback legacy holographique
        if (!resolved && style === 'holographic') {
            resolved = tryResolveLegacyHolographic(normalizedRoles);
        }

        if (!resolved) return '';

        if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
            return await fetchUrlAsDataUri(resolved);
        }
        return readFileAsDataUri(resolved);
    } catch (err) {
        console.log('⚠️ Erreur resolveBackgroundImage:', err.message);
        return '';
    }
}

module.exports = {
    normalizeRoleName,
    resolveBackgroundImage
};