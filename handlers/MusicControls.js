const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

function buildControls(queue) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('music_toggle').setLabel('Pause/Play').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('music_skip').setLabel('Skip').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music_stop').setLabel('Stop').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('music_loop').setLabel('Loop').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music_shuffle').setLabel('Shuffle').setStyle(ButtonStyle.Secondary)
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
    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '🎧 Rejoins un salon vocal pour utiliser les contrôles musique.', ephemeral: true });
    }

    const me = interaction.guild.members.me || interaction.guild.members.cache.get(interaction.client.user.id);
    const permissions = voiceChannel.permissionsFor(me);
    if (!permissions?.has(PermissionsBitField.Flags.Connect) || !permissions?.has(PermissionsBitField.Flags.Speak)) {
      return interaction.reply({ content: '❌ Je n’ai pas les permissions pour me connecter/parler ici.', ephemeral: true });
    }

    const distube = getMusic(interaction.client);
    const queue = distube.getQueue(interaction.guildId);

    if (!queue) {
      return interaction.reply({ content: '😴 Aucune lecture en cours.', ephemeral: true });
    }

    const id = interaction.customId;
    let msg = null;

    switch (id) {
      case 'music_toggle':
        if (queue.paused) {
          queue.resume();
          msg = '▶️ Lecture relancée.';
        } else {
          queue.pause();
          msg = '⏸️ Lecture en pause.';
        }
        break;
      case 'music_skip':
        await queue.skip();
        msg = '⏭️ Morceau suivant.';
        break;
      case 'music_stop':
        await distube.stop(interaction.guildId);
        try { queue.voice?.connection?.destroy?.(); } catch {}
        msg = '🛑 Musique arrêtée et file nettoyée.';
        break;
      case 'music_loop': {
        const mode = typeof queue.repeatMode === 'number' ? (queue.repeatMode + 1) % 3 : 0;
        const final = queue.setRepeatMode(mode);
        msg = final === 0 ? '🔁 Loop désactivé.' : final === 1 ? '🔂 Loop sur le morceau.' : '🔁 Loop sur la file.';
        break;
      }
      case 'music_shuffle':
        queue.shuffle();
        msg = '🔀 File mélangée.';
        break;
      case 'music_voldown': {
        const v = Math.max(0, (queue.volume || 100) - 10);
        queue.setVolume(v);
        msg = `🔉 Volume: ${v}%`;
        break;
      }
      case 'music_volup': {
        const v = Math.min(100, (queue.volume || 100) + 10);
        queue.setVolume(v);
        msg = `🔊 Volume: ${v}%`;
        break;
      }
      case 'music_np': {
        const song = queue.songs?.[0];
        if (!song) {
          msg = '😶 Aucun morceau en cours.';
        } else {
          const { createNowPlayingEmbed } = require('../managers/MusicManager');
          const embed = createNowPlayingEmbed(song);
          return interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
        }
        break;
      }
      default:
        msg = '❔ Action inconnue.';
    }

    if (msg) {
      await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
    }
  } catch (err) {
    try { await interaction.reply({ content: `❌ Erreur: ${String(err.message || err)}`, ephemeral: true }); } catch {}
  }
}

module.exports = { buildControls, handleButton };