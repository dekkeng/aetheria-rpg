# -*- coding: utf-8 -*-
"""
Aetheria RPG — Detailed Tile Builder
ประกอบ tiles.png จาก asset pack CC0 (Kenney tiny-town / tiny-dungeon / tiny-ski)
map เข้ากับชื่อทายล์ 10 แบบของเกม (16px -> 32px NEAREST)
รันหลัง gen_sprites.py แล้วเขียนทับ tiles.png + อัปเดต manifest
"""
import os, json
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "sprites")
VENDOR = os.path.join(ROOT, "assets", "vendor")
SRC = 16
T = 32

def sheet(pack):
    return Image.open(os.path.join(VENDOR, pack, "Tilemap", "tilemap_packed.png")).convert("RGBA")

town = sheet("tiny-town")
dungeon = sheet("tiny-dungeon")
ski = sheet("tiny-ski")

def crop(im, gx, gy):
    return im.crop((gx * SRC, gy * SRC, gx * SRC + SRC, gy * SRC + SRC))

def up(im):
    return im.resize((T, T), Image.NEAREST)

def water_tile():
    """น้ำ 16px สไตล์เดียวกัน แล้วขยาย"""
    im = Image.new("RGBA", (SRC, SRC), (60, 120, 190, 255))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, SRC, 7], fill=(74, 138, 205, 255))
    for wy in (3, 9, 13):
        d.line([(1, wy), (5, wy)], fill=(150, 200, 235, 255))
        d.line([(9, wy + 1), (14, wy + 1)], fill=(120, 180, 220, 255))
    return im

def lava_tile():
    """ลาวาเรืองแสง 16px"""
    im = Image.new("RGBA", (SRC, SRC), (196, 66, 30, 255))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, SRC, 6], fill=(232, 120, 44, 255))
    for (x, y, r) in ((4, 9, 2), (10, 11, 2), (7, 4, 1), (12, 6, 1)):
        d.ellipse([x, y, x + r, y + r], fill=(255, 210, 90, 255))
    for (x, y) in ((2, 13), (13, 2), (8, 14)):
        d.point((x, y), fill=(150, 40, 24, 255))
    return im

# ทายล์พื้น (ต้องต่อกันไม่มีรอย)
GROUND = {
    "grass":  up(crop(town, 0, 0)),      # หญ้าเขียว
    "wild":   up(crop(town, 2, 0)),      # หญ้ามีดอก (โซนมอนสเตอร์)
    "floor":  up(crop(dungeon, 1, 4)),   # พื้นทราย/ทางเดิน
    "cave":   up(crop(dungeon, 0, 3)),   # พื้นหินดันเจียน
    "snow":   up(crop(ski, 0, 0)),       # หิมะ
    "water":  up(water_tile()),          # น้ำ
}

# ทายล์วัตถุ (ต้นไม้/กำแพง/น้ำแข็ง/ลาวา) — วางทับพื้นหญ้า/หินถ้าโปร่งใส
def on_base(obj16, base16):
    b = base16.copy()
    b.alpha_composite(obj16)
    return up(b)

grass16 = crop(town, 0, 0)
snow16 = crop(ski, 0, 0)
cave16 = crop(dungeon, 0, 3)

OBJECTS = {
    "tree":  on_base(crop(town, 4, 1), grass16),     # ต้นไม้มีลำต้นบนหญ้า
    "wall":  up(crop(dungeon, 9, 4)),                # กำแพงอิฐเทา
    "ice":   on_base(crop(ski, 4, 3), snow16),       # น้ำแข็งบนหิมะ
    "lava":  up(lava_tile()),                        # ลาวาเรืองแสง
}

TILE_KINDS = ["grass", "tree", "water", "floor", "wild", "cave", "wall", "snow", "ice", "lava"]
imgs = {}
imgs.update(GROUND); imgs.update(OBJECTS)

sheet_out = Image.new("RGBA", (T * len(TILE_KINDS), T), (0, 0, 0, 0))
layout = {}
for i, k in enumerate(TILE_KINDS):
    sheet_out.paste(imgs[k], (i * T, 0), imgs[k])
    layout[k] = i
sheet_out.save(os.path.join(OUT, "tiles.png"))

# preview x6
prev = sheet_out.resize((sheet_out.size[0] * 6, sheet_out.size[1] * 6), Image.NEAREST).convert("RGB")
d = ImageDraw.Draw(prev)
for i, k in enumerate(TILE_KINDS):
    d.text((i * T * 6 + 3, 3), k, fill=(255, 255, 0))
prev.save(os.path.join(os.environ.get("TEMP", "/tmp"), "tiles_preview.png"))

# อัปเดต manifest (คง cell=32)
mpath = os.path.join(OUT, "manifest.json")
with open(mpath, "r", encoding="utf-8") as f:
    manifest = json.load(f)
manifest["tiles"] = {"cell": T, "map": layout}
with open(mpath, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
with open(os.path.join(OUT, "manifest.js"), "w", encoding="utf-8") as f:
    f.write("window.SPRITE_MANIFEST = " + json.dumps(manifest, ensure_ascii=False) + ";\n")

print("tiles.png rebuilt from Kenney assets:", sheet_out.size)
print("preview:", os.path.join(os.environ.get("TEMP", "/tmp"), "tiles_preview.png"))
