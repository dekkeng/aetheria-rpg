# -*- coding: utf-8 -*-
"""
Aetheria RPG — Top-down sheet builder (Zelda-like + Ninja Adventure)
ประกอบ art จากสองแพ็ค CC0:
  - ไทล์โลก: Zelda-like (ArMM1998) Overworld.png  [16px -> x3 = 48px]
  - ตัวละคร/มอนสเตอร์/NPC/บอส/สัตว์เลี้ยง/หน้า: Ninja Adventure (pixel-boy)
เอาต์พุต: assets/sprites/td/*  + td-manifest.js/json
เลย์เอาต์ sheet ตัวละคร: คอลัมน์ = ทิศ 4 ทิศ (ตามลำดับของ NA),
แถว = [idle, walk1..walk4]  เซลล์ 48px
"""
import os, json
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZE = os.path.join(ROOT, "assets", "vendor", "zelda-like", "gfx")
NA = os.path.join(ROOT, "assets", "vendor", "ninja-adventure-pack")
OUT = os.path.join(ROOT, "assets", "sprites", "td")
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.join(OUT, "faces"), exist_ok=True)

SC = 3          # 16px -> 48px
T = 16

over = Image.open(os.path.join(ZE, "Overworld.png")).convert("RGBA")

def tile(gx, gy, w=1, h=1, src=None, key_black=False):
    im = (src or over).crop((gx * T, gy * T, (gx + w) * T, (gy + h) * T))
    if key_black:
        # วัตถุใน Overworld.png ใช้พื้นหลังดำทึบ -> ทำให้โปร่งใส
        px = im.load()
        for y in range(im.height):
            for x in range(im.width):
                r, g, b, a = px[x, y]
                if r < 9 and g < 9 and b < 9:
                    px[x, y] = (0, 0, 0, 0)
    return im.resize((im.width * SC, im.height * SC), Image.NEAREST)

def tint(im, rgb, keep=0.35):
    """ย้อมสีทับ (คงรายละเอียดบางส่วน)"""
    r, g, b = rgb
    out = im.copy(); px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            pr, pg, pb, pa = px[x, y]
            lum = (pr * 3 + pg * 5 + pb * 2) / 10
            px[x, y] = (int(pr * keep + lum * r / 255 * (1 - keep) + r * .25),
                        int(pg * keep + lum * g / 255 * (1 - keep) + g * .25),
                        int(pb * keep + lum * b / 255 * (1 - keep) + b * .25), pa)
    # clamp
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            p = px[x, y]
            px[x, y] = (min(255, p[0]), min(255, p[1]), min(255, p[2]), p[3])
    return out

def overlay(base, top):
    b = base.copy()
    b.alpha_composite(top)
    return b

def portal_img():
    """วงพอร์ทัลเรืองแสง 48px (โปร่งใส วางบนพื้นได้ทุกแบบ)"""
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([2, 3, 13, 12], outline=(70, 200, 255, 255), width=2)
    d.ellipse([5, 6, 10, 10], fill=(190, 245, 255, 230))
    d.point((7, 2), fill=(200, 250, 255, 255))
    d.point((13, 8), fill=(160, 235, 255, 255))
    d.point((3, 12), fill=(160, 235, 255, 255))
    return im.resize((T * SC, T * SC), Image.NEAREST)

# ---------- ไทล์พื้น (พิกัดช่อง 16px ใน Overworld.png) ----------
grass0 = tile(0, 0)
water0 = tile(4, 3)
floor0 = tile(1, 4)

TILES = {
    "grass":  [tile(0, 0), tile(0, 3), tile(2, 3), tile(0, 5)],
    "wild":   [overlay(tile(0, 0), tile(0, 8)), overlay(tile(0, 0), tile(1, 8)),
               overlay(tile(0, 3), tile(0, 8))],
    "floor":  [tile(1, 4)],
    "water":  [tile(4, 3), tile(5, 3), tile(4, 4), tile(5, 4)],
    "wall":   [tile(4, 14), tile(5, 14), tile(6, 14)],
    "snow":   [tint(tile(0, 0), (235, 244, 255), keep=0.10),
               tint(tile(0, 3), (228, 240, 252), keep=0.10)],
    "ice":    [tint(tile(4, 3), (170, 230, 255), keep=0.25)],
    "lava":   [tint(tile(4, 3), (255, 110, 30), keep=0.12),
               tint(tile(5, 3), (255, 130, 40), keep=0.12)],
    "cave":   [tint(tile(1, 4), (150, 130, 175), keep=0.30),
               tint(tile(1, 4), (138, 120, 162), keep=0.30)],
    "portal": [portal_img()],
}
# วัตถุสูง (วาดทับพื้น, จัด depth ตามแถว)
OBJECTS = {
    "tree":  [tile(5, 16, 2, 2, key_black=True)],       # ต้นไม้ใหญ่ 2x2
    "bush":  [tile(2, 14, key_black=True)],
    "rock":  [tile(4, 1, 2, 2, key_black=True)],        # กองหิน 2x2
}

# ---------- ตัวละคร Ninja Adventure ----------
HEROES = {"warrior": "Knight", "mage": "SorcererOrange", "archer": "Hunter"}
NPCS = {
    "elder": "OldMan", "guard": "Samurai", "merchant": "Villager",
    "healer": "Monk", "pip": "Boy", "isolde": "Princess",
    "grimm": "Master", "maeve": "Woman", "nyx": "NinjaDark", "vheron": "RedSamurai",
}
MONSTERS = {   # ศัตรูธรรมดา: Actor/Monsters/<X>/<X>.png (4 ทิศ x 4 เฟรม)
    "slime": ("Slime", "Slime"), "bat": ("Eye", "Eye"), "wolf": ("Beast", "Beast2"),
    "goblin": ("KappaGreen", "KappaGreen"), "golem": ("Cyclope", "Cyclope"),
    "drake": ("Dragon", "Dragon"),
}
BOSSES = {     # บอส: Actor/Boss/<X>/Idle40x40.png (5 เฟรมหันหน้า)
    "bramblewrath": "GiantRacoon", "bog_horror": "GiantFrog",
    "nyx_duel": "TenguBlue", "vheron": "GiantRedSamurai", "the_hollow": "GiantSpirit",
}
PETS = {
    "slime_pet": "Slime2", "bat_pet": "Butterfly", "ghost_pet": "Spirit",
    "spider_pet": "SpiderRed", "snake_pet": "Snake", "rat_pet": "Mouse",
    "snowman_pet": "AxolotBlue", "yeti_pet": "Beast2",
}


def char_sheet(name):
    """ประกอบ [idle + walk4] จาก SeparateAnim ของตัวละคร -> 192x240"""
    base = os.path.join(NA, "Actor", "Characters", name, "SeparateAnim")
    idle = Image.open(os.path.join(base, "Idle.png")).convert("RGBA")     # 64x16
    walk = Image.open(os.path.join(base, "Walk.png")).convert("RGBA")     # 64x64
    sheet = Image.new("RGBA", (64, 16 + 64), (0, 0, 0, 0))
    sheet.paste(idle, (0, 0))
    sheet.paste(walk, (0, 16))
    return sheet.resize((64 * SC, 80 * SC), Image.NEAREST)


def monster_sheet(name):
    """มอนสเตอร์ 64x64 (4 ทิศ x 4 เฟรม) — บางตัวชื่อ <X>.png บางตัว SpriteSheet.png"""
    cands = [os.path.join(NA, "Actor", "Monsters", name, name + ".png"),
             os.path.join(NA, "Actor", "Monsters", name, "SpriteSheet.png"),
             os.path.join(NA, "Actor", "Monsters", name + ".png")]
    p = next((c for c in cands if os.path.exists(c)), None)
    if p is None:
        raise FileNotFoundError(name)
    im = Image.open(p).convert("RGBA")
    return im.resize((im.width * SC, im.height * SC), Image.NEAREST)


def boss_sheet(name):
    """บอส: Idle strip แนวนอน (เซลล์จัตุรัส = ความสูงภาพ, จำนวนเฟรมแปรผัน)"""
    for f in ("Idle.png", "Idle40x40.png"):
        p = os.path.join(NA, "Actor", "Boss", name, f)
        if os.path.exists(p):
            break
    im = Image.open(p).convert("RGBA")
    return im.resize((im.width * SC, im.height * SC), Image.NEAREST)


def faceset(kind, name, out_key):
    p = os.path.join(NA, "Actor", kind, name, "Faceset.png")
    if not os.path.exists(p):
        return False
    im = Image.open(p).convert("RGBA")
    im = im.resize((im.width * 2, im.height * 2), Image.NEAREST)
    im.save(os.path.join(OUT, "faces", out_key + ".png"))
    return True


def main():
    man = {"cell": T * SC,
           "anims": {"idleRow": 0, "walkRows": [1, 2, 3, 4], "walkMs": 135},
           "heroes": {}, "npcs": {}, "enemies": {}, "pets": {}, "tiles": {}, "objects": {}}

    # ---- tiles atlas ----
    pieces = []
    for kind, lst in TILES.items():
        for i, im in enumerate(lst):
            pieces.append(("t", kind, i, im))
    for kind, lst in OBJECTS.items():
        for i, im in enumerate(lst):
            pieces.append(("o", kind, i, im))
    MAXW, PAD = 1024, 2
    xx = yy = rowh = 0
    places = []
    for typ, kind, i, im in pieces:
        if xx + im.width + PAD > MAXW:
            xx = 0; yy += rowh + PAD; rowh = 0
        places.append((typ, kind, i, im, xx, yy))
        xx += im.width + PAD; rowh = max(rowh, im.height)
    atlas = Image.new("RGBA", (MAXW, yy + rowh + PAD), (0, 0, 0, 0))
    for typ, kind, i, im, px, py in places:
        atlas.alpha_composite(im, (px, py))
        dst = man["tiles"] if typ == "t" else man["objects"]
        dst.setdefault(kind, []).append({"x": px, "y": py, "w": im.width, "h": im.height})
    atlas.save(os.path.join(OUT, "tiles.png"))
    print("tiles.png", atlas.size)

    # ---- heroes ----
    for cls, name in HEROES.items():
        sheet = char_sheet(name)
        sheet.save(os.path.join(OUT, "hero_%s.png" % cls))
        man["heroes"][cls] = {"file": "hero_%s.png" % cls}
        faceset("Characters", name, "hero_" + cls)
        print("hero", cls, "<-", name)

    # ---- npcs ----
    for nid, name in NPCS.items():
        sheet = char_sheet(name)
        sheet.save(os.path.join(OUT, "npc_%s.png" % nid))
        man["npcs"][nid] = {"file": "npc_%s.png" % nid}
        faceset("Characters", name, "npc_" + nid)
        print("npc", nid, "<-", name)

    # ---- monsters ----
    for eid, (name, _alt) in MONSTERS.items():
        sheet = monster_sheet(name)
        sheet.save(os.path.join(OUT, "enemy_%s.png" % eid))
        man["enemies"][eid] = {"file": "enemy_%s.png" % eid, "cell": T * SC,
                               "frames": 4, "boss": False}
        faceset("Monsters", name, "enemy_" + eid)
        print("enemy", eid, "<-", name)

    # ---- bosses ----
    for eid, name in BOSSES.items():
        sheet = boss_sheet(name)
        cell = sheet.height
        sheet.save(os.path.join(OUT, "enemy_%s.png" % eid))
        man["enemies"][eid] = {"file": "enemy_%s.png" % eid, "cell": cell,
                               "frames": sheet.width // cell, "boss": True}
        faceset("Boss", name, "enemy_" + eid)
        print("boss", eid, "<-", name)

    # ---- pets (มอนสเตอร์ตัวจิ๋ว) ----
    for pid, name in PETS.items():
        sheet = monster_sheet(name)
        sheet.save(os.path.join(OUT, "pet_%s.png" % pid))
        man["pets"][pid] = {"file": "pet_%s.png" % pid, "cell": T * SC, "frames": 4}
        print("pet", pid, "<-", name)

    with open(os.path.join(OUT, "td-manifest.json"), "w", encoding="utf-8") as f:
        json.dump(man, f, ensure_ascii=False, indent=1)
    with open(os.path.join(OUT, "td-manifest.js"), "w", encoding="utf-8") as f:
        f.write("window.TD_MANIFEST = " + json.dumps(man, ensure_ascii=False) + ";\n")
    print("manifest written")


if __name__ == "__main__":
    main()
