const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function num(v, fb = 0) { const n = Number(v); return Number.isFinite(n) ? n : fb; }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seduire')
    .setDescription('Séduire un membre (NSFW)')
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
      const cfg = (economyConfig.actions?.seduire) || {};
      const enabled = cfg.enabled !== false;
      const cooldown = num(cfg.cooldown, 3_600_000);
      const successChance = num(cfg.successChance, 0.75);
      const min = num(cfg.minReward, 40);
      const max = num(cfg.maxReward, 120);
      const gK = num(cfg.goodKarma, 1);
      const bK = num(cfg.badKarma, 1);

      if (!enabled) {
        return await interaction.reply({ content: '❌ La commande /seduire est désactivée.', flags: 64 });
      }

      const userData = await dataManager.getUser(userId, guildId);
      const now = Date.now();
      if (userData.lastSeduce && (now - userData.lastSeduce) < cooldown) {
        const remaining = Math.ceil((cooldown - (now - userData.lastSeduce)) / 60000);
        return await interaction.reply({ content: `⏰ Attendez **${remaining} min** avant de recommencer.`, flags: 64 });
      }

      const success = Math.random() < successChance;
      let delta = 0;
      if (success) {
        delta = Math.floor(Math.random() * (Math.max(0, max - min) + 1)) + min;
      } else {
        delta = -Math.max(10, Math.floor(min / 2));
      }

      userData.balance = Math.max(0, (userData.balance || 1000) + delta);
      userData.goodKarma = (userData.goodKarma || 0) + gK;
      userData.badKarma = (userData.badKarma || 0) + bK;
      userData.lastSeduce = now;
      await dataManager.updateUser(userId, guildId, userData);

      const karmaNet = (userData.goodKarma || 0) + (userData.badKarma || 0);

      const embed = new EmbedBuilder()
        .setColor(success ? '#e91e63' : '#9e9e9e')
        .setTitle(success ? '💘 Séduction Réussie' : '🙃 Séduction Manquée')
        .setDescription(success ? `Vous avez séduit <@${target.id}> et gagné **+${delta}💋**` : `Cela n'a pas fonctionné avec <@${target.id}>... **${delta}💋**`)
        .addFields(
          { name: '💋 Plaisir', value: `${userData.balance}💋`, inline: true },
          { name: '⚖️ Réputation 🥵', value: `${karmaNet >= 0 ? '+' : ''}${karmaNet}`, inline: true },
          { name: '⏰ Cooldown', value: `${Math.floor(cooldown / 60000)} min`, inline: true }
        );

      await interaction.reply({ content: `<@${target.id}>`, embeds: [embed] });
    } catch (error) {
      console.error('❌ Erreur seduire:', error);
      await interaction.reply({ content: '❌ Une erreur est survenue.', flags: 64 });
    }
  }
};