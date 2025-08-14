const { SlashCommandBuilder } = require('discord.js');

const base = require('../assets/config-confession.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('configconfession')
		.setDescription('Alias: Configuration du système de confessions')
		.setDefaultMemberPermissions('0'),

	execute: base.execute
};