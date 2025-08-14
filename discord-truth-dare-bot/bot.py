# -*- coding: utf-8 -*-
import os
import random
import logging
from typing import Optional

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
    """Discord UI view with buttons to draw Action/Vérité prompts or stop the game."""

    def __init__(self, ephemere: bool = False) -> None:
        super().__init__(timeout=120)
        self.ephemere = bool(ephemere)

    async def disable_all(self, interaction: discord.Interaction) -> None:
        for item in self.children:
            if isinstance(item, discord.ui.Button):
                item.disabled = True
        try:
            await interaction.response.edit_message(view=self)
        except discord.InteractionResponded:
            await interaction.edit_original_response(view=self)
        except Exception:
            logging.exception("Failed to disable buttons on interaction")

    @discord.ui.button(label="Action", emoji="🎯", style=discord.ButtonStyle.danger)
    async def draw_action(self, interaction: discord.Interaction, _: discord.ui.Button) -> None:
        prompt_text = random.choice(ACTIONS)
        embed = build_prompt_embed("action", prompt_text, interaction.user)
        try:
            await interaction.response.edit_message(embed=embed, view=self)
        except discord.InteractionResponded:
            await interaction.edit_original_response(embed=embed, view=self)

    @discord.ui.button(label="Vérité", emoji="💬", style=discord.ButtonStyle.primary)
    async def draw_truth(self, interaction: discord.Interaction, _: discord.ui.Button) -> None:
        prompt_text = random.choice(VERITES)
        embed = build_prompt_embed("verite", prompt_text, interaction.user)
        try:
            await interaction.response.edit_message(embed=embed, view=self)
        except discord.InteractionResponded:
            await interaction.edit_original_response(embed=embed, view=self)

    @discord.ui.button(label="Stop", emoji="⛔", style=discord.ButtonStyle.secondary)
    async def stop_view(self, interaction: discord.Interaction, _: discord.ui.Button) -> None:
        await self.disable_all(interaction)

    async def on_timeout(self) -> None:
        # When the view times out, we cannot edit the original message without a reference here.
        # Buttons will naturally stop responding.
        pass


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
@app_commands.describe(ephemere="Réponse visible seulement par toi (privée)")
async def action_cmd(interaction: discord.Interaction, ephemere: Optional[bool] = False) -> None:
    prompt_text = random.choice(ACTIONS)
    embed = build_prompt_embed("action", prompt_text, interaction.user)
    view = TruthDareView(ephemere=bool(ephemere))
    await interaction.response.send_message(embed=embed, view=view, ephemeral=bool(ephemere))


@tree.command(name="verite", description="Obtiens une question 'Vérité' aléatoire.")
@app_commands.describe(ephemere="Réponse visible seulement par toi (privée)")
async def verite_cmd(interaction: discord.Interaction, ephemere: Optional[bool] = False) -> None:
    prompt_text = random.choice(VERITES)
    embed = build_prompt_embed("verite", prompt_text, interaction.user)
    view = TruthDareView(ephemere=bool(ephemere))
    await interaction.response.send_message(embed=embed, view=view, ephemeral=bool(ephemere))


@tree.command(name="av", description="Choisis: Action ou Vérité, avec des boutons.")
@app_commands.describe(ephemere="Réponse visible seulement par toi (privée)")
async def av_cmd(interaction: discord.Interaction, ephemere: Optional[bool] = False) -> None:
    embed = discord.Embed(
        title="Action ou Vérité ?",
        description="Choisis un bouton ci-dessous pour tirer un prompt.",
        color=COLOR_NEUTRAL,
    )
    embed.set_footer(text="Appuie sur Stop pour désactiver les boutons.")
    view = TruthDareView(ephemere=bool(ephemere))
    await interaction.response.send_message(embed=embed, view=view, ephemeral=bool(ephemere))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

    if not DISCORD_BOT_TOKEN:
        raise SystemExit(
            "Veuillez définir la variable d'environnement DISCORD_BOT_TOKEN dans un fichier .env ou dans votre environnement."
        )

    bot.run(DISCORD_BOT_TOKEN)  # type: ignore[arg-type]