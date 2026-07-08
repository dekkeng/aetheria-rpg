# -*- coding: utf-8 -*-
"""
Aetheria RPG — Flare tile atlas builder
เลือกกระเบื้อง isometric จาก flare-game tilesets มาแพ็คเป็น atlas เดียว
ต่อชนิดทายล์ของเกม (grass/tree/water/floor/wild/cave/wall/snow/ice/lava)
เอาต์พุต: assets/sprites/flare/tiles.png + เติม "tiles" ใน flare-manifest
พิกัด anchor: จุดกึ่งกลางสี่เหลี่ยมข้าวหลามตัดบนจอ, วาดที่ (cx-ox, cy-oy)
รันหลัง tools/build_flare_sheets.py (ต้องมี flare-manifest.json อยู่แล้ว)
"""
import os, json
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "vendor", "flare")
OUT = os.path.join(ROOT, "assets", "sprites", "flare")


def parse_multi(name):
    tiles, img = {}, None
    with open(os.path.join(SRC, "tilesetdefs", name + ".txt")) as f:
        for line in f:
            line = line.strip()
            if line.startswith("img="):
                img = os.path.basename(line[4:])
            elif line.startswith("tile="):
                n = [int(x) for x in line[5:].split(",")]
                tiles[n[0]] = (img,) + tuple(n[1:])
    return tiles


G = parse_multi("tileset_grassland")
C = parse_multi("tileset_cave")
D = parse_multi("tileset_dungeon")
S = parse_multi("tileset_snowplains")

# ชนิดทายล์ของเกม -> รายการ (defs, id, tint|None)
# หลาย id = หลาย variant (world เลือกด้วย hash ให้พื้นดูไม่ซ้ำ)
PICK = {
    "grass":  [(G, i, None) for i in (16, 17, 18, 19)],
    "wild":   [(G, i, None) for i in (22, 23, 24, 25)],
    "floor":  [(G, i, None) for i in (36, 37, 38, 39)],
    "water":  [(G, i, (110, 170, 255)) for i in (176, 177, 178, 179)],   # น้ำอมฟ้าสว่างขึ้น
    "cave":   [(C, i, None) for i in (16, 17, 18, 19)],
    "snow":   [(S, i, None) for i in (16, 17, 18, 19)],
    "ice":    [(S, i, None) for i in (347, 350, 351, 358)],
    "lava":   [(G, i, (255, 130, 45)) for i in (176, 177, 178, 179)],  # น้ำย้อมลาวา
    "tree":   [(G, i, None) for i in (252, 253, 254, 255)],
    "pine":   [(G, i, None) for i in (248, 249, 250, 251)],
    "wall":   [(G, i, None) for i in (48, 52)],          # หน้าผาหิน (สูง)
    "portal": [(G, 265, None)],                          # วงแหวนพอร์ทัลเรืองแสง
    "shrine": [(G, 264, None)],                          # แท่นหินวงกลม
    "rock":   [(G, i, None) for i in (128, 129, 130)],
    "bush":   [(G, i, None) for i in (117, 120, 122)],
    "fence":  [(G, i, None) for i in (104, 107)],
    "grave":  [(G, i, None) for i in (140, 141)],
    "deadtree": [(G, i, None) for i in (244, 245, 246)],
    "bones":  [(C, i, None) for i in (44, 45)],
}

SCALE = 0.6667   # 192x96 -> 128x64 (จอเกมใช้ tile ~96-128px กว้าง)

# ทับ offset (ก่อน scale): น้ำ/ลาวาของ Flare จมลง 48px (ไว้ใช้ในหุบผา)
# แผนที่เราแบน — ให้วางเสมอพื้นเหมือนกระเบื้องปกติ
OFFSET_OVERRIDE = {"water": (96, 48), "lava": (96, 48)}


def tint_image(img, rgb, boost=2.6):
    """ย้อมสี + เร่งความสว่าง (แหล่งน้ำ/ลาวาของ Flare มืดมาก)"""
    r, g, b = rgb
    px = img.load()
    out = img.copy(); po = out.load()
    for y in range(img.height):
        for x in range(img.width):
            pr, pg, pb, pa = px[x, y]
            lum = (pr * 3 + pg * 5 + pb * 2) / 10 * boost
            po[x, y] = (min(255, int(lum * r / 255)), min(255, int(lum * g / 255)),
                        min(255, int(lum * b / 255)), pa)
    return out


def main():
    imgs = {}
    def getimg(n):
        if n not in imgs:
            imgs[n] = Image.open(os.path.join(SRC, "tilesets", n)).convert("RGBA")
        return imgs[n]

    # ตัดทุกชิ้น + ย่อ
    pieces = []   # (kind, variantIdx, img, ox, oy)
    for kind, lst in PICK.items():
        for vi, (defs, tid, tint) in enumerate(lst):
            if tid not in defs:
                print("!! missing", kind, tid); continue
            src, x, y, w, h, ox, oy = defs[tid]
            if kind in OFFSET_OVERRIDE:
                ox, oy = OFFSET_OVERRIDE[kind]
            piece = getimg(src).crop((x, y, x + w, y + h))
            if tint:
                piece = tint_image(piece, tint)
            piece = piece.resize((max(1, round(w * SCALE)), max(1, round(h * SCALE))), Image.LANCZOS)
            pieces.append((kind, vi, piece, round(ox * SCALE), round(oy * SCALE)))

    # แพ็คเรียงแถวง่ายๆ (กว้างสุด 2048)
    MAXW, PAD = 2048, 2
    entries = {}
    xx = yy = rowh = 0
    # จัดขนาดผืนก่อน
    places = []
    for kind, vi, piece, ox, oy in pieces:
        w, h = piece.size
        if xx + w + PAD > MAXW:
            xx = 0; yy += rowh + PAD; rowh = 0
        places.append((kind, vi, piece, ox, oy, xx, yy))
        xx += w + PAD; rowh = max(rowh, h)
    H = yy + rowh + PAD
    atlas = Image.new("RGBA", (MAXW, H), (0, 0, 0, 0))
    for kind, vi, piece, ox, oy, px, py in places:
        atlas.alpha_composite(piece, (px, py))
        entries.setdefault(kind, []).append(
            {"x": px, "y": py, "w": piece.width, "h": piece.height, "ox": ox, "oy": oy})
    atlas.save(os.path.join(OUT, "tiles.png"))
    print("tiles.png", atlas.size)

    mpath = os.path.join(OUT, "flare-manifest.json")
    with open(mpath, encoding="utf-8") as f:
        manifest = json.load(f)
    manifest["tiles"] = {"file": "tiles.png",
                         "tileW": round(192 * SCALE), "tileH": round(96 * SCALE),
                         "map": entries}
    with open(mpath, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    with open(os.path.join(OUT, "flare-manifest.js"), "w", encoding="utf-8") as f:
        f.write("window.FLARE_MANIFEST = " + json.dumps(manifest, ensure_ascii=False) + ";\n")
    print("manifest updated; tile size", round(192 * SCALE), "x", round(96 * SCALE))


if __name__ == "__main__":
    main()
