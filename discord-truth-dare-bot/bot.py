# -*- coding: utf-8 -*-
import os
import random
import logging

import discord
from discord import app_commands
from discord.ext import commands
from dotenv import load_dotenv

from prompts import ACTIONS, VERITES
from storage import (
	get_combined_actions,
	get_combined_truths,
	get_channels,
	add_channel,
	remove_channel,
	list_custom_prompts,
	add_custom_prompt,
	edit_custom_prompt,
	remove_custom_prompt,
	disable_base_prompt,
	enable_base_prompt,
	list_disabled_base,
)


load_dotenv()

DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN") or os.getenv("BOT_TOKEN")

COLOR_ACTION = 0xFF6B6B
COLOR_TRUTH = 0x3399FF
COLOR_NEUTRAL = 0x888888


def build_prompt_embed(kind: str, prompt_text: str, author: discord.abc.User) -> discord.Embed:
	"""Create a nicely formatted embed for the prompt."""
	if kind == "action":
		title = "Action 🎯"
		color = COLOR_ACTION
	elif kind == "verite":
		title = "Vérité 💬"
		color = COLOR_TRUTH
	else:
		title = "Action ou Vérité ?"
		color = COLOR_NEUTRAL

	embed = discord.Embed(title=title, description=prompt_text, color=color)
	embed.set_footer(text=f"Demandé par {author.display_name}")
	return embed


class TruthDareView(discord.ui.View):
	"""View with two buttons to draw Action/Vérité and send a new message each time."""

	def __init__(self) -> None:
		super().__init__(timeout=900)

	@discord.ui.button(label="Action", emoji="🎯", style=discord.ButtonStyle.danger)
	async def draw_action(self, interaction: discord.Interaction, _: discord.ui.Button) -> None:
		guild_id = interaction.guild_id
		pool = get_combined_actions(guild_id, ACTIONS) if guild_id else list(ACTIONS)
		prompt_text = random.choice(pool) if pool else "(Aucune action configurée)"
		embed = build_prompt_embed("action", prompt_text, interaction.user)
		await interaction.response.send_message(embed=embed)

	@discord.ui.button(label="Vérité", emoji="💬", style=discord.ButtonStyle.primary)
	async def draw_truth(self, interaction: discord.Interaction, _: discord.ui.Button) -> None:
		guild_id = interaction.guild_id
		pool = get_combined_truths(guild_id, VERITES) if guild_id else list(VERITES)
		prompt_text = random.choice(pool) if pool else "(Aucune vérité configurée)"
		embed = build_prompt_embed("verite", prompt_text, interaction.user)
		await interaction.response.send_message(embed=embed)


intents = discord.Intents.default()
# We only need default intents for slash commands and buttons
bot = commands.Bot(command_prefix="!", intents=intents)

tree = bot.tree


@bot.event
async def on_ready() -> None:
	logging.info("Bot connecté en tant que %s (ID: %s)", bot.user, getattr(bot.user, "id", "?"))
	try:
		synced = await tree.sync()
		logging.info("Commandes slash synchronisées: %d", len(synced))
	except Exception:
		logging.exception("Échec de la synchronisation des commandes slash")


@tree.command(name="action", description="Obtiens un défi 'Action' aléatoire.")
async def action_cmd(interaction: discord.Interaction) -> None:
	pool = get_combined_actions(interaction.guild_id, ACTIONS) if interaction.guild_id else list(ACTIONS)
	prompt_text = random.choice(pool) if pool else "(Aucune action configurée)"
	embed = build_prompt_embed("action", prompt_text, interaction.user)
	await interaction.response.send_message(embed=embed)


@tree.command(name="verite", description="Obtiens une question 'Vérité' aléatoire.")
async def verite_cmd(interaction: discord.Interaction) -> None:
	pool = get_combined_truths(interaction.guild_id, VERITES) if interaction.guild_id else list(VERITES)
	prompt_text = random.choice(pool) if pool else "(Aucune vérité configurée)"
	embed = build_prompt_embed("verite", prompt_text, interaction.user)
	await interaction.response.send_message(embed=embed)


@tree.command(name="aouv", description="Démarre le jeu Action ou Vérité dans ce salon.")
async def aouv_cmd(interaction: discord.Interaction) -> None:
	if not interaction.guild_id:
		return await interaction.response.send_message("Cette commande doit être utilisée dans un serveur.", ephemeral=True)
	allowed = get_channels(interaction.guild_id)
	if allowed and interaction.channel_id not in allowed:
		channels_str = ", ".join(f"<#{cid}>" for cid in allowed)
		return await interaction.response.send_message(
			f"Ce salon n'est pas configuré pour AouV. Utilise l'un des salons autorisés: {channels_str}", ephemeral=True
		)
	embed = discord.Embed(
		title="Action ou Vérité ?",
		description="Clique sur un bouton ci-dessous pour tirer un prompt public dans ce salon.",
		color=COLOR_NEUTRAL,
	)
	view = TruthDareView()
	await interaction.response.send_message(embed=embed, view=view)


# ---- Configuration commands ----

aouvconfig = app_commands.Group(name="aouvconfig", description="Configurer le jeu Action ou Vérité")
channel_group = app_commands.Group(name="channel", description="Gérer les salons autorisés")
prompt_group = app_commands.Group(name="prompt", description="Gérer les prompts")


async def _ensure_manager(interaction: discord.Interaction) -> bool:
	if not interaction.guild or not isinstance(interaction.user, discord.Member):
		await interaction.response.send_message("Commande disponible uniquement sur un serveur.", ephemeral=True)
		return False
	perms = interaction.user.guild_permissions
	if not (perms.manage_guild or perms.administrator):
		await interaction.response.send_message("Tu dois avoir la permission Gérer le serveur pour utiliser cette commande.", ephemeral=True)
		return False
	return True


@channel_group.command(name="add", description="Autorise un salon pour le jeu AouV")
@app_commands.describe(salon="Salon texte à autoriser")
async def cfg_channel_add(interaction: discord.Interaction, salon: discord.TextChannel) -> None:
	if not await _ensure_manager(interaction):
		return
	add_channel(interaction.guild_id, salon.id)  # type: ignore[arg-type]
	await interaction.response.send_message(f"Salon autorisé: {salon.mention}", ephemeral=True)


@channel_group.command(name="remove", description="Retire un salon autorisé")
@app_commands.describe(salon="Salon texte à retirer")
async def cfg_channel_remove(interaction: discord.Interaction, salon: discord.TextChannel) -> None:
	if not await _ensure_manager(interaction):
		return
	success = remove_channel(interaction.guild_id, salon.id)  # type: ignore[arg-type]
	msg = f"Salon retiré: {salon.mention}" if success else f"Ce salon n'était pas autorisé: {salon.mention}"
	await interaction.response.send_message(msg, ephemeral=True)


@channel_group.command(name="list", description="Liste les salons autorisés")
async def cfg_channel_list(interaction: discord.Interaction) -> None:
	if not await _ensure_manager(interaction):
		return
	ids = get_channels(interaction.guild_id)  # type: ignore[arg-type]
	if not ids:
		return await interaction.response.send_message("Aucun salon configuré. Le jeu est autorisé partout.", ephemeral=True)
	mentions = []
	for cid in ids:
		ch = interaction.guild.get_channel(cid) if interaction.guild else None
		mentions.append(ch.mention if isinstance(ch, discord.TextChannel) else f"<#{cid}>")
	await interaction.response.send_message("Salons autorisés: " + ", ".join(mentions), ephemeral=True)


@prompt_group.command(name="add", description="Ajoute un prompt personnalisé")
@app_commands.describe(kind="Type de prompt", texte="Contenu du prompt")
@app_commands.choices(kind=[app_commands.Choice(name="action", value="action"), app_commands.Choice(name="vérité", value="verite")])
async def cfg_prompt_add(interaction: discord.Interaction, kind: app_commands.Choice[str], texte: str) -> None:
	if not await _ensure_manager(interaction):
		return
	pid = add_custom_prompt(interaction.guild_id, kind.value, texte)  # type: ignore[arg-type]
	await interaction.response.send_message(f"Ajouté ({kind.value}) avec l'ID `{pid}`.", ephemeral=True)


@prompt_group.command(name="edit", description="Modifie un prompt personnalisé par ID")
@app_commands.describe(kind="Type de prompt", prompt_id="ID du prompt", texte="Nouveau contenu")
@app_commands.choices(kind=[app_commands.Choice(name="action", value="action"), app_commands.Choice(name="vérité", value="verite")])
async def cfg_prompt_edit(interaction: discord.Interaction, kind: app_commands.Choice[str], prompt_id: str, texte: str) -> None:
	if not await _ensure_manager(interaction):
		return
	success = edit_custom_prompt(interaction.guild_id, kind.value, prompt_id, texte)  # type: ignore[arg-type]
	msg = "Modifié." if success else "ID introuvable."
	await interaction.response.send_message(msg, ephemeral=True)


@prompt_group.command(name="remove", description="Supprime un prompt personnalisé par ID")
@app_commands.describe(kind="Type de prompt", prompt_id="ID du prompt")
@app_commands.choices(kind=[app_commands.Choice(name="action", value="action"), app_commands.Choice(name="vérité", value="verite")])
async def cfg_prompt_remove(interaction: discord.Interaction, kind: app_commands.Choice[str], prompt_id: str) -> None:
	if not await _ensure_manager(interaction):
		return
	success = remove_custom_prompt(interaction.guild_id, kind.value, prompt_id)  # type: ignore[arg-type]
	msg = "Supprimé." if success else "ID introuvable."
	await interaction.response.send_message(msg, ephemeral=True)


@prompt_group.command(name="list-custom", description="Liste les prompts personnalisés")
@app_commands.describe(kind="Type de prompt")
@app_commands.choices(kind=[app_commands.Choice(name="action", value="action"), app_commands.Choice(name="vérité", value="verite")])
async def cfg_prompt_list_custom(interaction: discord.Interaction, kind: app_commands.Choice[str]) -> None:
	if not await _ensure_manager(interaction):
		return
	items = list_custom_prompts(interaction.guild_id, kind.value)  # type: ignore[arg-type]
	if not items:
		return await interaction.response.send_message("Aucun prompt personnalisé.", ephemeral=True)
	lines = [f"`{pid}` — {text}" for pid, text in items[:50]]
	more = "\n…" if len(items) > 50 else ""
	await interaction.response.send_message("\n".join(lines) + more, ephemeral=True)


@prompt_group.command(name="disable-base", description="Désactive un prompt de base par numéro (1..n)")
@app_commands.describe(kind="Type de prompt", numero="Numéro (1..n) dans la liste de base")
@app_commands.choices(kind=[app_commands.Choice(name="action", value="action"), app_commands.Choice(name="vérité", value="verite")])
async def cfg_prompt_disable_base(interaction: discord.Interaction, kind: app_commands.Choice[str], numero: int) -> None:
	if not await _ensure_manager(interaction):
		return
	index = numero - 1
	base = ACTIONS if kind.value == "action" else VERITES
	if index < 0 or index >= len(base):
		return await interaction.response.send_message("Numéro invalide.", ephemeral=True)
	did = disable_base_prompt(interaction.guild_id, kind.value, index)  # type: ignore[arg-type]
	msg = "Désactivé." if did else "Déjà désactivé."
	await interaction.response.send_message(msg, ephemeral=True)


@prompt_group.command(name="enable-base", description="Réactive un prompt de base par numéro (1..n)")
@app_commands.describe(kind="Type de prompt", numero="Numéro (1..n) dans la liste de base")
@app_commands.choices(kind=[app_commands.Choice(name="action", value="action"), app_commands.Choice(name="vérité", value="verite")])
async def cfg_prompt_enable_base(interaction: discord.Interaction, kind: app_commands.Choice[str], numero: int) -> None:
	if not await _ensure_manager(interaction):
		return
	index = numero - 1
	base = ACTIONS if kind.value == "action" else VERITES
	if index < 0 or index >= len(base):
		return await interaction.response.send_message("Numéro invalide.", ephemeral=True)
	did = enable_base_prompt(interaction.guild_id, kind.value, index)  # type: ignore[arg-type]
	msg = "Réactivé." if did else "N'était pas désactivé."
	await interaction.response.send_message(msg, ephemeral=True)


@prompt_group.command(name="list-disabled", description="Liste les numéros de prompts de base désactivés")
@app_commands.describe(kind="Type de prompt")
@app_commands.choices(kind=[app_commands.Choice(name="action", value="action"), app_commands.Choice(name="vérité", value="verite")])
async def cfg_prompt_list_disabled(interaction: discord.Interaction, kind: app_commands.Choice[str]) -> None:
	if not await _ensure_manager(interaction):
		return
	indices = list_disabled_base(interaction.guild_id, kind.value)  # type: ignore[arg-type]
	if not indices:
		return await interaction.response.send_message("Aucun prompt de base désactivé.", ephemeral=True)
	numbers = ", ".join(str(i + 1) for i in sorted(indices))
	await interaction.response.send_message(f"Désactivés: {numbers}", ephemeral=True)


@prompt_group.command(name="list-base", description="Liste les prompts de base (paginated, 20 par page)")
@app_commands.describe(kind="Type de prompt", page="Page (>=1)")
@app_commands.choices(kind=[app_commands.Choice(name="action", value="action"), app_commands.Choice(name="vérité", value="verite")])
async def cfg_prompt_list_base(interaction: discord.Interaction, kind: app_commands.Choice[str], page: int = 1) -> None:
	if not await _ensure_manager(interaction):
		return
	base = ACTIONS if kind.value == "action" else VERITES
	if page < 1:
		page = 1
	per = 20
	start = (page - 1) * per
	end = start + per
	slice_items = list(enumerate(base, start=1))[start:end]
	if not slice_items:
		return await interaction.response.send_message("Page vide.", ephemeral=True)
	lines = [f"{idx}. {text}" for idx, text in slice_items]
	await interaction.response.send_message("\n".join(lines), ephemeral=True)


aouvconfig.add_command(channel_group)
aouvconfig.add_command(prompt_group)
tree.add_command(aouvconfig)


if __name__ == "__main__":
	logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

	if not DISCORD_BOT_TOKEN:
		raise SystemExit(
			"Veuillez définir la variable d'environnement DISCORD_BOT_TOKEN dans un fichier .env ou dans votre environnement."
		)

	bot.run(DISCORD_BOT_TOKEN)  # type: ignore[arg-type]