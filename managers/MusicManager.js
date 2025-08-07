const { EmbedBuilder } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { DeezerPlugin } = require('@distube/deezer');

let distubeInstance = null;

function createNowPlayingEmbed(song, queue) {
  const embed = new EmbedBuilder()
    .setColor('#FF3E8D')
    .setTitle('💋 Now playing, boys & girls')
    .setDescription(`**${song.name}** — ${song.formattedDuration}\nDemandé par <@${song.user?.id || song.user}> 😈`)
    .setThumbnail(song.thumbnail || null)
    .setFooter({ text: `🔥 File: ${queue?.songs?.length || 1} | Volume: ${queue?.volume || 100}%` });
  return embed;
}

function createAddedEmbed(song) {
  const embed = new EmbedBuilder()
    .setColor('#FF69B4')
    .setTitle('😏 Ajouté à la file')
    .setDescription(`**${song.name}** — ${song.formattedDuration}`)
    .setThumbnail(song.thumbnail || null)
    .setFooter({ text: 'Boys & Girls vibes 🔥' });
  return embed;
}

function getMusic(client) {
  if (distubeInstance) return distubeInstance;

  distubeInstance = new DisTube(client, {
    emitNewSongOnly: true,
    leaveOnStop: true,
    leaveOnFinish: true,
    leaveOnEmpty: true,
    nsfw: true,
    emitAddSongWhenCreatingQueue: false,
    plugins: [
      new SpotifyPlugin({ parallel: true, emitEventsAfterFetching: true }),
      new SoundCloudPlugin(),
      new DeezerPlugin(),
      new YtDlpPlugin({ update: true })
    ]
  });

  distubeInstance
    .on('playSong', (queue, song) => {
      const embed = createNowPlayingEmbed(song, queue);
      queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
    })
    .on('addSong', (queue, song) => {
      const embed = createAddedEmbed(song);
      queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
    })
    .on('error', (channel, error) => {
      try {
        const content = `❌ Oups, coquin(e)… Erreur audio: ${'```'}${String(error?.message || error).slice(0, 1800)}${'```'}`;
        if (channel && typeof channel.send === 'function') channel.send({ content }).catch(() => {});
      } catch {}
    })
    .on('finish', queue => {
      queue.textChannel?.send({ content: '💦 File terminée. On se repose un peu ?' }).catch(() => {});
    })
    .on('disconnect', queue => {
      queue.textChannel?.send({ content: '👋 Déconnecté du salon vocal.' }).catch(() => {});
    });

  return distubeInstance;
}

module.exports = { getMusic };