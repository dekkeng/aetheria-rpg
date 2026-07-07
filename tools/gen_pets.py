# -*- coding: utf-8 -*-
"""
Aetheria RPG — Pet Sprite Sheet Builder
ประกอบ pets.png จาก asset pack CC0 (Kenney tiny-dungeon / tiny-ski)
8 สายพันธุ์ x 2 เฟรม (idle bob) ขนาดช่อง 16px
รันหลัง gen_sprites.py (อ่าน manifest.json แล้วเพิ่มส่วน pets)
"""
import os, json
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "sprites")
VENDOR = os.path.join(ROOT, "assets", "vendor")
C = 16  # ขนาดช่องของแพ็ค

def sheet(pack):
    return Image.open(os.path.join(VENDOR, pack, "Tilemap", "tilemap_packed.png")).convert("RGBA")

def cell(im, gx, gy):
    return im.crop((gx * C, gy * C, gx * C + C, gy * C + C))

dungeon = sheet("tiny-dungeon")
ski = sheet("tiny-ski")

# สายพันธุ์: (id, แหล่งภาพ)
SPECIES = [
    ("slime_pet",  cell(dungeon, 0, 9)),   # สไลม์เขียว
    ("bat_pet",    cell(dungeon, 0, 10)),  # ค้างคาวน้ำตาล
    ("ghost_pet",  cell(dungeon, 1, 10)),  # ผีน้อย
    ("spider_pet", cell(dungeon, 2, 10)),  # แมงมุมจิ๋ว
    ("snake_pet",  cell(dungeon, 3, 10)),  # งูน้อย
    ("rat_pet",    cell(dungeon, 4, 10)),  # หนูภูเขา
    ("snowman_pet", cell(ski, 9, 5)),      # สโนว์แมน
    ("yeti_pet",   cell(ski, 6, 6)),       # เยติจูเนียร์
]

def bob(im):
    """เฟรมที่ 2: ขยับขึ้น 1px (หายใจ)"""
    out = Image.new("RGBA", (C, C), (0, 0, 0, 0))
    out.paste(im, (0, -1), im)
    return out

frames = 2
sheet_out = Image.new("RGBA", (C * frames, C * len(SPECIES)), (0, 0, 0, 0))
rows = {}
for i, (sid, img) in enumerate(SPECIES):
    sheet_out.paste(img, (0, i * C), img)
    b = bob(img)
    sheet_out.paste(b, (C, i * C), b)
    rows[sid] = i
sheet_out.save(os.path.join(OUT, "pets.png"))

# อัปเดต manifest
mpath = os.path.join(OUT, "manifest.json")
with open(mpath, "r", encoding="utf-8") as f:
    manifest = json.load(f)
manifest["pets"] = {"cell": C, "frames": frames, "rows": rows, "idle": [0, 1]}
with open(mpath, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
with open(os.path.join(OUT, "manifest.js"), "w", encoding="utf-8") as f:
    f.write("window.SPRITE_MANIFEST = " + json.dumps(manifest, ensure_ascii=False) + ";\n")

print("pets.png generated:", sheet_out.size, "| species:", len(SPECIES))
