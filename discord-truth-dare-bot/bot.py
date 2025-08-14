# -*- coding: utf-8 -*-
import os
import random
import logging

import discord
from discord import app_commands
from discord.ext import commands
from dotenv import load_dotenv

from prompts import ACTIONS, VERITES


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
        prompt_text = random.choice(ACTIONS)
        embed = build_prompt_embed("action", prompt_text, interaction.user)
        await interaction.response.send_message(embed=embed)

    @discord.ui.button(label="Vérité", emoji="💬", style=discord.ButtonStyle.primary)
    async def draw_truth(self, interaction: discord.Interaction, _: discord.ui.Button) -> None:
        prompt_text = random.choice(VERITES)
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
    prompt_text = random.choice(ACTIONS)
    embed = build_prompt_embed("action", prompt_text, interaction.user)
    await interaction.response.send_message(embed=embed)


@tree.command(name="verite", description="Obtiens une question 'Vérité' aléatoire.")
async def verite_cmd(interaction: discord.Interaction) -> None:
    prompt_text = random.choice(VERITES)
    embed = build_prompt_embed("verite", prompt_text, interaction.user)
    await interaction.response.send_message(embed=embed)


@tree.command(name="aouv", description="Démarre le jeu Action ou Vérité dans ce salon.")
async def aouv_cmd(interaction: discord.Interaction) -> None:
    embed = discord.Embed(
        title="Action ou Vérité ?",
        description="Clique sur un bouton ci-dessous pour tirer un prompt public dans ce salon.",
        color=COLOR_NEUTRAL,
    )
    view = TruthDareView()
    await interaction.response.send_message(embed=embed, view=view)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

    if not DISCORD_BOT_TOKEN:
        raise SystemExit(
            "Veuillez définir la variable d'environnement DISCORD_BOT_TOKEN dans un fichier .env ou dans votre environnement."
        )

    bot.run(DISCORD_BOT_TOKEN)  # type: ignore[arg-type]