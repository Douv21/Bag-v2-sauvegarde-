const path = require('path');
const fs = require('fs');
const dataManager = require('./simpleDataManager');

function humanDuration(durationMs) {
	const oneDay = 24 * 60 * 60 * 1000;
	if (durationMs === oneDay) return '1 jour';
	if (durationMs === 7 * oneDay) return '7 jours';
	if (durationMs >= 28 * oneDay) return '30 jours';
	// Fallback
	const days = Math.round(durationMs / oneDay);
	return `${days} jour${days > 1 ? 's' : ''}`;
}

function getCooldownFactor(userData, nowTs = Date.now()) {
	try {
		const boosts = Array.isArray(userData.cooldownBoosts) ? userData.cooldownBoosts : [];
		let factor = 1.0;
		for (const b of boosts) {
			if (!b || typeof b.percent !== 'number' || !b.expiresAt) continue;
			const exp = new Date(b.expiresAt).getTime();
			if (isNaN(exp) || exp <= nowTs) continue;
			const f = Math.max(0, 1 - (b.percent / 100));
			if (f < factor) factor = f;
		}
		return factor;
	} catch (_) { return 1.0; }
}

async function addCooldownBoost(userId, guildId, percent, durationMs) {
	const userData = await dataManager.getUser(userId, guildId);
	if (!Array.isArray(userData.cooldownBoosts)) userData.cooldownBoosts = [];
	const now = Date.now();
	const rec = {
		id: `${now}_${Math.random().toString(36).slice(2, 8)}`,
		percent: Math.max(0, Math.min(100, Number(percent) || 0)),
		durationMs: Number(durationMs) || 0,
		createdAt: new Date(now).toISOString(),
		expiresAt: new Date(now + (Number(durationMs) || 0)).toISOString(),
		source: 'shop'
	};
	userData.cooldownBoosts.push(rec);
	await dataManager.updateUser(userId, guildId, userData);
	return rec;
}

async function ensureCooldownReductionShopItems(guild) {
	const shop = await dataManager.loadData('shop.json', {});
	const guildId = guild.id;
	const items = shop[guildId] || [];

	const oneDay = 24 * 60 * 60 * 1000;
	const oneWeek = 7 * oneDay;
	const oneMonth = 30 * oneDay;

	// Default price grid (can be edited later by admins)
	const pricing = new Map([
		[`${oneDay}_50`, 1000], [`${oneDay}_75`, 1500], [`${oneDay}_100`, 2000],
		[`${oneWeek}_50`, 5000], [`${oneWeek}_75`, 7500], [`${oneWeek}_100`, 10000],
		[`${oneMonth}_50`, 20000], [`${oneMonth}_75`, 30000], [`${oneMonth}_100`, 40000]
	]);

	const matrix = [
		{ durationMs: oneDay, percents: [50, 75, 100] },
		{ durationMs: oneWeek, percents: [50, 75, 100] },
		{ durationMs: oneMonth, percents: [50, 75, 100] }
	];

	const exists = (durationMs, percent) => items.some(i => i.type === 'cooldown_reduction' && Number(i.durationMs) === durationMs && Number(i.reductionPercent) === percent);

	for (const row of matrix) {
		for (const p of row.percents) {
			if (exists(row.durationMs, p)) continue;
			const name = `⏱️ Réduction cooldown ${humanDuration(row.durationMs)} (-${p}%)`;
			const description = `Réduit le cooldown de toutes les actions de ${p}% pendant ${humanDuration(row.durationMs)}.`;
			const priceKey = `${row.durationMs}_${p}`;
			const price = pricing.get(priceKey) || 1000;
			items.push({
				id: `cdr_${row.durationMs}_${p}_${Date.now()}`,
				type: 'cooldown_reduction',
				name,
				price,
				description,
				category: 'Boosts ⏱️',
				reductionPercent: p,
				durationMs: row.durationMs,
				createdAt: new Date().toISOString(),
				createdBy: 'system'
			});
		}
	}

	shop[guildId] = items;
	await dataManager.saveData('shop.json', shop);
}

module.exports = {
	getCooldownFactor,
	addCooldownBoost,
	ensureCooldownReductionShopItems,
	humanDuration
};

