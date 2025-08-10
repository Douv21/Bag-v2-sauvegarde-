const { ActionRowBuilder, StringSelectMenuBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const path = require('path');
const fs = require('fs');
const { playRadio } = require('../managers/SimpleMusicManager');

function loadRadios() {
  try {
    const p = path.join(__dirname, '..', 'data', 'radios.json');
    const raw = fs.readFileSync(p, 'utf8');
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function buildRadioSelector() {
  const radios = loadRadios().slice(0, 25);
  const options = radios.map(r => ({ label: r.name.slice(0, 100), value: r.id }));
  const menu = new StringSelectMenuBuilder()
    .setCustomId('radio_select')
    .setPlaceholder('Choisis une radio à écouter')
    .addOptions(options);

  return [new ActionRowBuilder().addComponents(menu)];
}

async function handleRadioSelect(interaction) {
  try {
    if (!interaction.isStringSelectMenu() || interaction.customId !== 'radio_select') return;

    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;
    if (!voiceChannel || ![ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(voiceChannel.type)) {
      return interaction.reply({ content: '🎧 Rejoins un salon vocal pour écouter la radio.', ephemeral: true });
    }

    const me = interaction.guild.members.me || interaction.guild.members.cache.get(interaction.client.user.id);
    const permissions = voiceChannel.permissionsFor(me);
    if (!permissions?.has(PermissionsBitField.Flags.Connect) || !permissions?.has(PermissionsBitField.Flags.Speak)) {
      return interaction.reply({ content: '❌ Je n’ai pas les permissions pour me connecter/parler ici.', ephemeral: true });
    }

    const selectedId = interaction.values?.[0];
    const radios = loadRadios();
    const radio = radios.find(r => r.id === selectedId);
    if (!radio) {
      return interaction.reply({ content: '❌ Radio introuvable.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true }).catch(() => {});
    await playRadio(voiceChannel, radio, interaction.channel, interaction.user);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: `📻 Lecture de: ${radio.name}` }).catch(() => {});
    }
  } catch (err) {
    try { await interaction.reply({ content: `❌ Erreur: ${String(err.message || err)}`, ephemeral: true }); } catch {}
  }
}

module.exports = { buildRadioSelector, handleRadioSelect, loadRadios };