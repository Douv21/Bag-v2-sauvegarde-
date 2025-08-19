const fs = require('fs');
const path = require('path');
const dataHooks = require('./dataHooks');

class MemberLocationManager {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.filePath = path.join(this.dataDir, 'member_locations.json');
        this.ensureStorage();
    }

    ensureStorage() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify({}, null, 2));
        }
    }

    loadAll() {
        try {
            const raw = fs.readFileSync(this.filePath, 'utf8');
            return JSON.parse(raw || '{}') || {};
        } catch (error) {
            console.error('❌ Erreur lecture member_locations.json:', error);
            return {};
        }
    }

    saveAll(data) {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(data || {}, null, 2));
            if (dataHooks && dataHooks.triggerBackup) {
                dataHooks.triggerBackup('member_locations_save');
            }
            return true;
        } catch (error) {
            console.error('❌ Erreur écriture member_locations.json:', error);
            return false;
        }
    }

    static isValidLatitude(value) {
        const n = Number(value);
        return Number.isFinite(n) && n >= -90 && n <= 90;
    }

    static isValidLongitude(value) {
        const n = Number(value);
        return Number.isFinite(n) && n >= -180 && n <= 180;
    }

    setLocation(userId, guildId, latitude, longitude, address = null) {
        if (!userId || !guildId) throw new Error('USER_AND_GUILD_REQUIRED');
        if (!MemberLocationManager.isValidLatitude(latitude)) throw new Error('INVALID_LATITUDE');
        if (!MemberLocationManager.isValidLongitude(longitude)) throw new Error('INVALID_LONGITUDE');

        const locations = this.loadAll();
        const key = `${userId}_${guildId}`;
        const record = {
            userId: String(userId),
            guildId: String(guildId),
            lat: Number(latitude),
            lng: Number(longitude),
            address: address ? String(address) : null,
            updatedAt: new Date().toISOString()
        };
        locations[key] = record;
        this.saveAll(locations);
        return record;
    }

    getLocation(userId, guildId) {
        if (!userId || !guildId) return null;
        const locations = this.loadAll();
        return locations[`${userId}_${guildId}`] || null;
    }

    getAllForGuild(guildId) {
        const locations = this.loadAll();
        return Object.values(locations).filter(r => r.guildId === String(guildId));
    }

    findNearby(guildId, latitude, longitude, radiusKm = 50, limit = 50) {
        if (!MemberLocationManager.isValidLatitude(latitude)) throw new Error('INVALID_LATITUDE');
        if (!MemberLocationManager.isValidLongitude(longitude)) throw new Error('INVALID_LONGITUDE');
        const lat = Number(latitude);
        const lng = Number(longitude);
        const all = this.getAllForGuild(guildId);
        const withDistance = all
            .map(r => ({
                ...r,
                distanceKm: this.haversineKm(lat, lng, r.lat, r.lng)
            }))
            .filter(r => r.distanceKm <= Number(radiusKm));
        withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
        return withDistance.slice(0, Number(limit));
    }

    haversineKm(lat1, lon1, lat2, lon2) {
        const toRad = d => (d * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

module.exports = new MemberLocationManager();

