const { SlashCommandBuilder } = require('discord.js');

const base = require('../assets/config-level.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('configlevel')
		.setDescription('Alias: Configuration du système de niveaux'),

	execute: base.execute
};