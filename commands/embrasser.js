const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function n(v, f = 0) { const x = Number(v); return Number.isFinite(x) ? x : f; }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embrasser')
    .setDescription('Embrasser un membre (NSFW)')
    .addUserOption(o => o.setName('membre').setDescription('Membre ciblé').setRequired(true)),

  async execute(interaction, dataManager) {
    try {
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      const target = interaction.options.getUser('membre');

      if (!target || target.bot || target.id === userId) {
        return await interaction.reply({ content: '❌ Choisissez un membre valide (hors vous et bots).', flags: 64 });
      }

      const economyConfig = await dataManager.loadData('economy.json', {});
      const cfg = (economyConfig.actions?.embrasser) || {};
      const enabled = cfg.enabled !== false;
      const cooldown = n(cfg.cooldown, 1_800_000); // 30 min
      const min = n(cfg.minReward, 20);
      const max = n(cfg.maxReward, 80);
      const gK = n(cfg.goodKarma, 1);
      const bK = n(cfg.badKarma, 0);

      if (!enabled) {
        return await interaction.reply({ content: '❌ La commande /embrasser est désactivée.', flags: 64 });
      }

      const userData = await dataManager.getUser(userId, guildId);
      const now = Date.now();
      if (userData.lastEmbrasser && (now - userData.lastEmbrasser) < cooldown) {
        const remaining = Math.ceil((cooldown - (now - userData.lastEmbrasser)) / 60000);
        return await interaction.reply({ content: `⏰ Attendez **${remaining} min** avant de recommencer.`, flags: 64 });
      }

      const gain = Math.floor(Math.random() * (Math.max(0, max - min) + 1)) + min;
      userData.balance = (userData.balance || 1000) + gain;
      userData.goodKarma = (userData.goodKarma || 0) + gK;
      userData.badKarma = (userData.badKarma || 0) + bK;
      userData.lastEmbrasser = now;
      await dataManager.updateUser(userId, guildId, userData);

      const karmaNet = (userData.goodKarma || 0) + (userData.badKarma || 0);
      const embed = new EmbedBuilder()
        .setColor('#ff7675')
        .setTitle('💋 Baiser Volé !')
        .setDescription(`Vous avez embrassé <@${target.id}> et gagné **+${gain}💋**`)
        .addFields(
          { name: '💋 Plaisir', value: `${userData.balance}💋`, inline: true },
          { name: '😇 Karma Positif', value: `${gK >= 0 ? '+' : ''}${gK} (${userData.goodKarma})`, inline: true },
          { name: '😈 Karma Négatif', value: `${bK >= 0 ? '+' : ''}${bK} (${userData.badKarma})`, inline: true },
          { name: '⚖️ Réputation 🥵', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true },
          { name: '⏰ Cooldown', value: `${Math.floor(cooldown / 60000)} min`, inline: true }
        );

      await interaction.reply({ content: `<@${target.id}>`, embeds: [embed] });
    } catch (error) {
      console.error('❌ Erreur embrasser:', error);
      await interaction.reply({ content: '❌ Une erreur est survenue.', flags: 64 });
    }
  }
};