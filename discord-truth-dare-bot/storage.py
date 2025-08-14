# -*- coding: utf-8 -*-
import json
import os
import uuid
from dataclasses import dataclass, asdict
from typing import Dict, List, Tuple, Optional

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DATA_FILE = os.path.join(DATA_DIR, "config.json")


@dataclass
class CustomPrompt:
    id: str
    text: str


@dataclass
class GuildConfig:
    channels: List[int]
    custom_actions: List[CustomPrompt]
    custom_truths: List[CustomPrompt]
    disabled_actions: List[int]
    disabled_truths: List[int]


_DEFAULT_CONFIG: Dict[str, GuildConfig] = {}


def _ensure_data_dir() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)


def _read_store() -> Dict[str, GuildConfig]:
    _ensure_data_dir()
    if not os.path.exists(DATA_FILE):
        return {}
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        raw = json.load(f)
    result: Dict[str, GuildConfig] = {}
    for gid, conf in raw.items():
        result[gid] = GuildConfig(
            channels=list(conf.get("channels", [])),
            custom_actions=[CustomPrompt(**cp) for cp in conf.get("custom_actions", [])],
            custom_truths=[CustomPrompt(**cp) for cp in conf.get("custom_truths", [])],
            disabled_actions=list(conf.get("disabled_actions", [])),
            disabled_truths=list(conf.get("disabled_truths", [])),
        )
    return result


def _write_store(store: Dict[str, GuildConfig]) -> None:
    _ensure_data_dir()
    serializable = {gid: asdict(conf) for gid, conf in store.items()}
    tmp_file = DATA_FILE + ".tmp"
    with open(tmp_file, "w", encoding="utf-8") as f:
        json.dump(serializable, f, ensure_ascii=False, indent=2)
    os.replace(tmp_file, DATA_FILE)


def _get_or_create(store: Dict[str, GuildConfig], guild_id: int) -> GuildConfig:
    key = str(guild_id)
    if key not in store:
        store[key] = GuildConfig(
            channels=[],
            custom_actions=[],
            custom_truths=[],
            disabled_actions=[],
            disabled_truths=[],
        )
    return store[key]


def add_channel(guild_id: int, channel_id: int) -> None:
    store = _read_store()
    conf = _get_or_create(store, guild_id)
    if channel_id not in conf.channels:
        conf.channels.append(channel_id)
    _write_store(store)


def remove_channel(guild_id: int, channel_id: int) -> bool:
    store = _read_store()
    conf = _get_or_create(store, guild_id)
    if channel_id in conf.channels:
        conf.channels.remove(channel_id)
        _write_store(store)
        return True
    return False


def get_channels(guild_id: int) -> List[int]:
    store = _read_store()
    conf = _get_or_create(store, guild_id)
    return list(conf.channels)


def add_custom_prompt(guild_id: int, kind: str, text: str) -> str:
    store = _read_store()
    conf = _get_or_create(store, guild_id)
    prompt_id = uuid.uuid4().hex[:8]
    target = conf.custom_actions if kind == "action" else conf.custom_truths
    target.append(CustomPrompt(id=prompt_id, text=text))
    _write_store(store)
    return prompt_id


def edit_custom_prompt(guild_id: int, kind: str, prompt_id: str, new_text: str) -> bool:
    store = _read_store()
    conf = _get_or_create(store, guild_id)
    target = conf.custom_actions if kind == "action" else conf.custom_truths
    for p in target:
        if p.id == prompt_id:
            p.text = new_text
            _write_store(store)
            return True
    return False


def remove_custom_prompt(guild_id: int, kind: str, prompt_id: str) -> bool:
    store = _read_store()
    conf = _get_or_create(store, guild_id)
    target = conf.custom_actions if kind == "action" else conf.custom_truths
    for i, p in enumerate(target):
        if p.id == prompt_id:
            target.pop(i)
            _write_store(store)
            return True
    return False


def list_custom_prompts(guild_id: int, kind: str) -> List[Tuple[str, str]]:
    store = _read_store()
    conf = _get_or_create(store, guild_id)
    target = conf.custom_actions if kind == "action" else conf.custom_truths
    return [(p.id, p.text) for p in target]


def disable_base_prompt(guild_id: int, kind: str, index: int) -> bool:
    store = _read_store()
    conf = _get_or_create(store, guild_id)
    target = conf.disabled_actions if kind == "action" else conf.disabled_truths
    if index not in target:
        target.append(index)
        _write_store(store)
        return True
    return False


def enable_base_prompt(guild_id: int, kind: str, index: int) -> bool:
    store = _read_store()
    conf = _get_or_create(store, guild_id)
    target = conf.disabled_actions if kind == "action" else conf.disabled_truths
    if index in target:
        target.remove(index)
        _write_store(store)
        return True
    return False


def list_disabled_base(guild_id: int, kind: str) -> List[int]:
    store = _read_store()
    conf = _get_or_create(store, guild_id)
    return list(conf.disabled_actions if kind == "action" else conf.disabled_truths)


def get_combined_actions(guild_id: int, base_actions: List[str]) -> List[str]:
    store = _read_store()
    conf = _get_or_create(store, guild_id)
    disabled = set(conf.disabled_actions)
    combined = [text for i, text in enumerate(base_actions) if i not in disabled]
    combined.extend([p.text for p in conf.custom_actions])
    return combined


def get_combined_truths(guild_id: int, base_truths: List[str]) -> List[str]:
    store = _read_store()
    conf = _get_or_create(store, guild_id)
    disabled = set(conf.disabled_truths)
    combined = [text for i, text in enumerate(base_truths) if i not in disabled]
    combined.extend([p.text for p in conf.custom_truths])
    return combined