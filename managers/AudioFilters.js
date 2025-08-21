module.exports = {
	buildHQFilters,
	getPresetNames,
};

function getPresetNames() {
	return ['balanced'];
}

function buildHQFilters(preset = 'balanced') {
	// Lavalink v4 filters shape
	// Gains are subtle to avoid clipping; range typically [-0.25, +1.0], we keep small boosts
	switch (String(preset).toLowerCase()) {
		case 'balanced':
		default:
			return {
				equalizer: [
					{ band: 0, gain: 0.03 }, // 25 Hz
					{ band: 1, gain: 0.02 }, // 40 Hz
					{ band: 2, gain: 0.01 }, // 63 Hz
					{ band: 3, gain: 0.00 }, // 100 Hz
					{ band: 4, gain: -0.01 }, // 160 Hz
					{ band: 5, gain: 0.01 }, // 250 Hz
					{ band: 6, gain: 0.02 }, // 400 Hz
					{ band: 7, gain: 0.02 }, // 630 Hz
					{ band: 8, gain: 0.02 }, // 1 kHz
					{ band: 9, gain: 0.02 }, // 1.6 kHz
					{ band: 10, gain: 0.03 }, // 2.5 kHz
					{ band: 11, gain: 0.04 }, // 4 kHz
					{ band: 12, gain: 0.05 }, // 6.3 kHz
					{ band: 13, gain: 0.05 }, // 10 kHz
					{ band: 14, gain: 0.05 }, // 16 kHz
				],
			};
	}
}