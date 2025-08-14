const { SlashCommandBuilder } = require('discord.js');

const base = require('./config-aouv.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('configaouv')
		.setDescription('Alias: Configuration Action ou Vérité')
		.setDefaultMemberPermissions('0'),

	execute: base.execute
};