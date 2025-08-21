const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');
const { pause, resume, skip, stop, setVolume, getQueueInfo, createNowPlayingEmbed, updatePlayerMessage } = require('../managers/MusicManager');

function buildControls() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('music_toggle').setLabel('Pause/Play').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('music_skip').setLabel('Skip').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music_stop').setLabel('Stop').setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('music_voldown').setLabel('Vol -').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music_volup').setLabel('Vol +').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music_np').setLabel('Now Playing').setStyle(ButtonStyle.Primary)
  );

  return [row1, row2];
}

async function handleButton(interaction) {
  try {
    if (!interaction.isButton() || !interaction.customId.startsWith('music_')) return;

    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;
    if (!voiceChannel || ![ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(voiceChannel.type)) {
      return interaction.reply({ content: '🎧 Rejoins un salon vocal pour utiliser les contrôles musique.', ephemeral: true });
    }

    const me = interaction.guild.members.me || interaction.guild.members.cache.get(interaction.client.user.id);
    const permissions = voiceChannel.permissionsFor(me);
    if (!permissions?.has(PermissionsBitField.Flags.Connect) || !permissions?.has(PermissionsBitField.Flags.Speak)) {
      return interaction.reply({ content: '❌ Je n’ai pas les permissions pour me connecter/parler ici.', ephemeral: true });
    }

    const id = interaction.customId;
    let msg = null;

    switch (id) {
      case 'music_toggle': {
        const info = getQueueInfo(interaction.guildId);
        if (info?.current) {
          if (info.paused) {
            await resume(interaction.guildId);
            msg = '▶️ Lecture relancée.';
          } else {
            await pause(interaction.guildId);
            msg = '⏸️ Lecture en pause.';
          }
        } else {
          msg = '😴 Aucune lecture en cours.';
        }
        break;
      }
      case 'music_skip':
        await skip(interaction.guildId);
        msg = '⏭️ Morceau suivant.';
        break;
      case 'music_stop':
        await stop(interaction.guildId);
        msg = '🛑 Musique arrêtée et file nettoyée.';
        break;
      case 'music_voldown': {
        const info = getQueueInfo(interaction.guildId);
        const v = Math.max(0, (info.volume || 100) - 10);
        const nv = await setVolume(interaction.guildId, v);
        msg = `🔉 Volume: ${nv}%`;
        break;
      }
      case 'music_volup': {
        const info = getQueueInfo(interaction.guildId);
        const v = Math.min(100, (info.volume || 100) + 10);
        const nv = await setVolume(interaction.guildId, v);
        msg = `🔊 Volume: ${nv}%`;
        break;
      }
      case 'music_np': {
        const info = getQueueInfo(interaction.guildId);
        const song = info?.current;
        if (!song) {
          msg = '😶 Aucun morceau en cours.';
        } else {
          const embed = createNowPlayingEmbed(song, interaction.guild);
          return interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
        }
        break;
      }
      default:
        msg = '❔ Action inconnue.';
    }

    try { await updatePlayerMessage(interaction.guildId); } catch {}

    if (msg) {
      await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
    }
  } catch (err) {
    try { await interaction.reply({ content: `❌ Erreur: ${String(err.message || err)}`, ephemeral: true }); } catch {}
  }
}

module.exports = { buildControls, handleButton };