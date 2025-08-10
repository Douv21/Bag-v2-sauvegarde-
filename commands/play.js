const { SlashCommandBuilder, ChannelType, PermissionsBitField, MessageFlags } = require('discord.js');
const { getMusic } = require('../managers/MusicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Joue un titre depuis YouTube/Spotify/SoundCloud/URL')
    .addStringOption(o => o.setName('query').setDescription('Lien ou recherche').setRequired(true))
    .setDMPermission(false),

  cooldown: 2,

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '💋 Rejoins un salon vocal pour que je te fasse vibrer…', ephemeral: true });
    }

    // Vérification des permissions du bot dans le salon vocal
    const me = interaction.guild.members.me || interaction.guild.members.cache.get(interaction.client.user.id);
    const permissions = voiceChannel.permissionsFor(me);
    if (!permissions?.has(PermissionsBitField.Flags.Connect)) {
      return interaction.reply({ content: '❌ Je ne peux pas me connecter à ce salon vocal. Vérifie mes permissions (Connect).', ephemeral: true });
    }
    if (!permissions?.has(PermissionsBitField.Flags.Speak)) {
      return interaction.reply({ content: '❌ Je ne peux pas parler dans ce salon vocal. Vérifie mes permissions (Speak).', ephemeral: true });
    }

    const query = interaction.options.getString('query', true);

    let deferred = false;
    try {
      await interaction.deferReply({ ephemeral: true });
      deferred = true;
    } catch (deferErr) {
      // Si on ne peut pas accuser réception, on arrête proprement
      try {
        await interaction.reply({ content: '❌ Impossible d\'accuser réception de la commande (permissions ou latence).', ephemeral: true });
      } catch {}
      return;
    }

    const client = interaction.client;

    // Évite "already has a voice connection which is not managed by DisTube"
    try {
      const { getVoiceConnection } = require('@discordjs/voice');
      const existing = getVoiceConnection(interaction.guildId);
      if (existing) existing.destroy();
    } catch {}
    try {
      const { stopAlt } = require('../managers/AltPlayer');
      await stopAlt(interaction.guildId).catch(() => {});
    } catch {}

    const distube = getMusic(client);

    try {
      const isUrl = /^https?:\/\//i.test(query);

      // Helper pour jouer avec timeout
      const playWithTimeout = (q) => {
        const timeoutMs = 15000;
        const playPromise = distube.play(voiceChannel, q, {
          member,
          textChannel: interaction.channel,
          interaction
        });
        return Promise.race([
          playPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_MUSIC_PLAY')), timeoutMs))
        ]);
      };

      if (isUrl) {
        await playWithTimeout(query);
      } else {
        // Essais successifs: ytsearch -> ytmsearch -> sans préfixe
        const attempts = [`ytsearch:${query}`, `ytmsearch:${query}`, query];
        let lastErr = null;
        for (const attempt of attempts) {
          try {
            await playWithTimeout(attempt);
            lastErr = null;
            break; // succès
          } catch (err) {
            lastErr = err;
            const msg = String(err?.message || err);
            // Si ce n'est pas une erreur de "pas de résultat" ni un timeout, on arrête tout de suite
            if (!/Cannot find any song with this query|NO_RESULT/i.test(msg) && msg !== 'TIMEOUT_MUSIC_PLAY') {
              throw err;
            }
            // sinon on tente l'essai suivant
          }
        }
        // Fallback: recherche manuelle via yt-search si DisTube n'a rien trouvé
        if (lastErr && /Cannot find any song with this query|NO_RESULT/i.test(String(lastErr?.message || lastErr))) {
          try {
            const yts = require('yt-search');
            const res = await yts(query);
            const first = res && res.videos && res.videos.length > 0 ? res.videos[0] : null;
            if (first && first.url) {
              await playWithTimeout(first.url);
              lastErr = null;
            }
          } catch {}
        }
        if (lastErr) throw lastErr;
      }

      if (deferred) {
        await interaction.editReply({ content: `🔥 Je lance: ${query}` });
      }
    } catch (err) {
      const baseMsg = err && err.message === 'TIMEOUT_MUSIC_PLAY'
        ? '⏳ La connexion vocale ou la récupération de la musique est trop lente. Réessaie dans un instant et vérifie mes permissions/latence.'
        : `❌ Impossible de jouer: ${String(err.message || err)}`;

      // Supprimer les aperçus: on neutralise les URLs et on supprime les embeds auto
      const sanitized = baseMsg.replace(/https?:\/\/\S+/g, (m) => `<${m}>`);
      const response = { content: sanitized, flags: MessageFlags.SuppressEmbeds };

      if (deferred) {
        await interaction.editReply(response).catch(() => {});
      } else {
        await interaction.reply({ ...response, ephemeral: true }).catch(() => {});
      }
    }
  }
};