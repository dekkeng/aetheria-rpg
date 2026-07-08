# -*- coding: utf-8 -*-
"""
Aetheria RPG — Flare asset fetcher
ดาวน์โหลด art จาก flare-game (CC-BY-SA 3.0, Clint Bellanger & team)
เก็บใน assets/vendor/flare/ เพื่อให้ build_flare_sheets.py ประกอบเป็น sheet ของเกม
รัน: python tools/fetch_flare.py
"""
import os
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(ROOT, "assets", "vendor", "flare")
BASE = "https://raw.githubusercontent.com/flareteam/flare-game/master/mods/fantasycore"

# layer อุปกรณ์ hero ที่เกมใช้ (paper-doll) — ภาพ + นิยามแอนิเมชันคู่กัน
AVATAR = [
    "default_chest", "default_feet", "default_hands", "default_legs",
    "head_short", "head_bald",
    "cloth_shirt", "cloth_pants", "cloth_sandals",
    "leather_chest", "leather_pants", "leather_boots", "leather_hood",
    "chain_cuirass", "chain_greaves", "chain_boots", "chain_coif",
    "plate_cuirass", "plate_helm",
    "mage_vest", "mage_skirt", "mage_hood", "mage_boots",
    "club", "shortsword", "longsword", "greatsword",
    "staff", "greatstaff", "wand",
    "shortbow", "greatbow",
    "buckler", "kite_shield",
]
ENEMIES = [
    "antlion", "antlion_small", "fire_ant", "ice_ant",
    "goblin", "goblin_elite",
    "skeleton", "skeleton_archer", "skeleton_mage",
    "zombie", "cursed_grave",
    "wyvern", "wyvern_air", "wyvern_fire", "wyvern_water",
    "minotaur",
]
NPCS = ["peasant_man1", "peasant_man2", "peasant_woman1", "peasant_woman2",
        "knight", "wandering_trader", "guild_man"]
TILESETS = ["tileset_grassland", "tileset_grassland_water", "tileset_cave",
            "tileset_dungeon", "tileset_snowplains", "tileset_snowplains_ice",
            "tileset_snowplains_water"]
TILEDEFS = ["tileset_grassland", "tileset_cave", "tileset_dungeon",
            "tileset_cave_and_dungeon", "tileset_snowplains"]


def fetch(rel, out):
    path = os.path.join(DEST, out.replace("/", os.sep))
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return False
    os.makedirs(os.path.dirname(path), exist_ok=True)
    url = BASE + "/" + rel
    urllib.request.urlretrieve(url, path)
    return True


def main():
    jobs = []
    for n in AVATAR:
        jobs.append(("images/avatar/male/%s.png" % n, "avatar/%s.png" % n))
        jobs.append(("animations/avatar/male/%s.txt" % n, "avatar/%s.txt" % n))
    for n in ENEMIES:
        # minotaur / wyvern* เป็นโฟลเดอร์แยกทิศ — ข้ามภาพเดี่ยว ใช้เฉพาะตัวที่เป็นไฟล์เดียว
        if n in ("minotaur", "wyvern", "wyvern_air", "wyvern_fire", "wyvern_water"):
            jobs.append(("animations/enemies/%s.txt" % n, "enemies/%s.txt" % n))
            continue
        jobs.append(("images/enemies/%s.png" % n, "enemies/%s.png" % n))
        jobs.append(("animations/enemies/%s.txt" % n, "enemies/%s.txt" % n))
    for n in NPCS:
        jobs.append(("images/npcs/%s.png" % n, "npcs/%s.png" % n))
        jobs.append(("animations/npcs/%s.txt" % n, "npcs/%s.txt" % n))
    for n in TILESETS:
        jobs.append(("images/tilesets/%s.png" % n, "tilesets/%s.png" % n))
    for n in TILEDEFS:
        jobs.append(("tilesetdefs/%s.txt" % n, "tilesetdefs/%s.txt" % n))

    ok = skip = err = 0
    for rel, out in jobs:
        try:
            if fetch(rel, out):
                ok += 1
                print("GET ", rel)
            else:
                skip += 1
        except Exception as e:
            err += 1
            print("ERR ", rel, "-", e)
    print("done: %d downloaded, %d cached, %d errors" % (ok, skip, err))


if __name__ == "__main__":
    main()
