# -*- coding: utf-8 -*-
"""
Aetheria RPG — Cute Isometric Tile Builder
สร้างกระเบื้อง isometric สไตล์ chibi สดใส (pixel-art พาสเทล):
วาดที่ 64x32 ต่อช่อง แล้วขยาย NEAREST x2 -> 128x64 ให้คมแบบพิกเซล
เขียนทับ assets/sprites/flare/tiles.png + อัปเดต "tiles" ใน flare-manifest
(ตัว renderer ใน src/iso.js ใช้ manifest เดิม ไม่ต้องแก้โค้ดเกม)
"""
import os, json, math, random
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "sprites", "flare")

TW, TH = 64, 32          # ขนาดวาด (ก่อนขยาย x2)
SC = 2                   # ตัวคูณขยาย NEAREST

random.seed(7)


def diamond_mask(w, h):
    m = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(m)
    d.polygon([(w // 2, 0), (w - 1, h // 2), (w // 2, h - 1), (0, h // 2)], fill=255)
    return m


def new_tile():
    return Image.new("RGBA", (TW, TH), (0, 0, 0, 0))


def diamond_base(top, left, right, edge=None):
    """ข้าวหลามตัดสามโทน: หน้าบน + ขอบซ้าย/ขวาล่างเข้มกว่าเล็กน้อย (ดูหนานุ่ม)
    วาดล้นขอบ 1px เพื่อให้ต่อกันสนิทไม่มีร่องดำ"""
    im = new_tile()
    d = ImageDraw.Draw(im)
    cx, cy = TW // 2, TH // 2
    d.polygon([(cx, -1), (TW, cy), (cx, TH), (-1, cy)], fill=top)
    # ขอบล่างสองด้าน (เงาอ่อน)
    d.polygon([(-1, cy), (cx, TH), (2, cy + 2)], fill=left)
    d.polygon([(TW, cy), (cx, TH), (TW - 3, cy + 2)], fill=right)
    if edge:
        d.line([(cx, 0), (TW - 1, cy), (cx, TH - 1), (0, cy), (cx, 0)], fill=edge)
    return im


def speckle(im, colors, n, rmax=1):
    """จุดประหญ้า/ดอกไม้แบบสุ่ม (เฉพาะใน diamond)"""
    d = ImageDraw.Draw(im)
    cx, cy = TW // 2, TH // 2
    for _ in range(n):
        x = random.randint(4, TW - 5)
        y = random.randint(2, TH - 3)
        # ต้องอยู่ใน diamond
        if abs(x - cx) / (TW / 2) + abs(y - cy) / (TH / 2) > 0.85:
            continue
        c = random.choice(colors)
        r = random.randint(0, rmax)
        d.ellipse([x - r, y - r, x + r, y + r], fill=c)
    return im


# ---------- พื้น ----------
def t_grass(v):
    base = [(126, 200, 80), (120, 194, 76), (132, 205, 86), (122, 197, 82)][v]
    im = diamond_base(base + (255,), (100, 168, 62, 255), (94, 160, 58, 255))
    speckle(im, [(146, 216, 98, 255), (112, 182, 66, 255)], 26)
    if v % 2 == 0:
        speckle(im, [(255, 255, 255, 255), (255, 224, 120, 255)], 3)
    return im


def t_wild(v):
    im = diamond_base((110, 186, 92, 255), (86, 152, 70, 255), (80, 146, 66, 255))
    speckle(im, [(128, 202, 108, 255), (96, 168, 80, 255)], 24)
    speckle(im, [(255, 130, 160, 255), (255, 210, 90, 255), (190, 140, 255, 255)], 6)
    return im


def t_floor(v):
    base = [(238, 206, 148), (232, 200, 142), (242, 212, 156), (236, 204, 150)][v]
    im = diamond_base(base + (255,), (204, 168, 112, 255), (196, 160, 106, 255))
    speckle(im, [(222, 188, 130, 255), (250, 224, 170, 255)], 16)
    return im


def t_water(v):
    im = diamond_base((90, 190, 245, 255), (60, 150, 215, 255), (54, 142, 208, 255))
    d = ImageDraw.Draw(im)
    for (x, y, ln) in ((14, 12, 7), (34, 8, 6), (40, 20, 8), (22, 22, 5)):
        d.line([(x, y), (x + ln, y)], fill=(190, 235, 255, 255))
    if v % 2 == 0:
        d.point((TW // 2 + 8, 6), fill=(255, 255, 255, 255))
    return im


def t_lava(v):
    im = diamond_base((255, 120, 40, 255), (215, 80, 20, 255), (205, 72, 16, 255))
    d = ImageDraw.Draw(im)
    speckle(im, [(255, 210, 60, 255), (255, 240, 150, 255)], 10, rmax=1)
    d.line([(16, 14), (26, 14)], fill=(255, 230, 120, 255))
    d.line([(36, 18), (46, 18)], fill=(255, 200, 80, 255))
    return im


def t_cave(v):
    im = diamond_base((150, 138, 172, 255), (116, 106, 138, 255), (110, 100, 130, 255))
    speckle(im, [(166, 154, 188, 255), (134, 122, 156, 255)], 18)
    return im


def t_snow(v):
    im = diamond_base((240, 248, 255, 255), (198, 216, 238, 255), (190, 208, 232, 255))
    speckle(im, [(255, 255, 255, 255), (222, 236, 250, 255)], 14)
    return im


def t_ice(v):
    im = diamond_base((170, 226, 250, 255), (128, 188, 226, 255), (120, 180, 220, 255))
    d = ImageDraw.Draw(im)
    d.line([(20, 8), (30, 16)], fill=(230, 248, 255, 255))
    d.line([(38, 12), (44, 18)], fill=(210, 240, 255, 255))
    return im


# ---------- วัตถุสูง (anchor: กลางฐาน) ----------
def obj_canvas(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0)), ImageDraw.Draw(Image.new("RGBA", (1, 1)))


def outline(im, color=(60, 90, 50, 255)):
    """เส้นขอบรอบ silhouette ให้ดูการ์ตูน"""
    px = im.load()
    w, h = im.size
    edge = []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] != 0:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] > 120:
                    edge.append((x, y)); break
    for (x, y) in edge:
        px[x, y] = color
    return im


def t_tree(v):
    w, h = 48, 60
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    greens = [((104, 202, 92), (66, 160, 62)), ((96, 192, 110), (58, 150, 74)),
              ((120, 208, 84), (80, 166, 54)), ((110, 198, 100), (70, 156, 66))][v]
    lite, dark = greens
    # เงา
    d.ellipse([10, h - 8, w - 10, h - 1], fill=(40, 70, 40, 70))
    # ลำต้น
    d.rectangle([w // 2 - 3, h - 22, w // 2 + 3, h - 5], fill=(150, 106, 70, 255))
    d.rectangle([w // 2 - 3, h - 22, w // 2 - 1, h - 5], fill=(122, 84, 54, 255))
    # พุ่มฟู 3 ก้อน
    d.ellipse([4, 14, 30, 40], fill=dark + (255,))
    d.ellipse([18, 12, 44, 38], fill=dark + (255,))
    d.ellipse([9, 4, 39, 34], fill=lite + (255,))
    # ไฮไลต์
    d.ellipse([14, 8, 26, 18], fill=(198, 240, 160, 255))
    if v % 2 == 0:   # ผลไม้เล็กๆ
        for (x, y) in ((12, 26), (32, 22), (24, 33)):
            d.ellipse([x, y, x + 3, y + 3], fill=(255, 108, 120, 255))
    return outline(im, (46, 96, 52, 255))


def t_pine(v):
    w, h = 40, 62
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([8, h - 8, w - 8, h - 1], fill=(40, 70, 40, 70))
    d.rectangle([w // 2 - 2, h - 18, w // 2 + 2, h - 5], fill=(140, 98, 64, 255))
    c1, c2 = (52, 156, 96), (36, 128, 78)
    for i, (yw, yy) in enumerate(((18, 34), (15, 22), (11, 10))):
        col = c1 if i % 2 == 0 else c2
        d.polygon([(w // 2, yy - 8), (w // 2 + yw, yy + 12), (w // 2 - yw, yy + 12)], fill=col + (255,))
    d.polygon([(w // 2, 2), (w // 2 + 8, 14), (w // 2 - 8, 14)], fill=(70, 176, 110, 255))
    if v % 2 == 1:   # หิมะ/ไฟประดับ
        for (x, y) in ((14, 24), (26, 34), (20, 44)):
            d.ellipse([x, y, x + 2, y + 2], fill=(255, 240, 170, 255))
    return outline(im, (30, 96, 60, 255))


def t_rock(v):
    w, h = 34, 26
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([4, h - 7, w - 4, h - 1], fill=(40, 60, 40, 60))
    d.ellipse([3, 4, w - 3, h - 3], fill=(178, 172, 190, 255))
    d.ellipse([6, 6, w - 10, h - 8], fill=(206, 200, 216, 255))
    d.ellipse([10, 8, 18, 13], fill=(232, 228, 240, 255))
    if v == 2:
        d.ellipse([20, 12, 24, 15], fill=(150, 190, 130, 255))   # มอสจุด
    return outline(im, (110, 104, 128, 255))


def t_bush(v):
    w, h = 26, 20
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([3, 5, w - 3, h - 2], fill=(88, 178, 96, 255))
    d.ellipse([6, 3, w - 8, h - 7], fill=(120, 205, 110, 255))
    if v % 2 == 0:
        for (x, y) in ((8, 9), (16, 7), (12, 12)):
            d.ellipse([x, y, x + 2, y + 2], fill=(255, 150, 170, 255))
    return outline(im, (54, 128, 66, 255))


def t_deadtree(v):
    w, h = 34, 46
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([8, h - 6, w - 8, h - 1], fill=(40, 60, 40, 55))
    c = (168, 132, 96, 255)
    d.rectangle([w // 2 - 2, 14, w // 2 + 2, h - 4], fill=c)
    d.line([(w // 2, 20), (8, 10)], fill=c, width=3)
    d.line([(w // 2, 26), (w - 7, 14)], fill=c, width=3)
    d.line([(w // 2, 16), (w // 2 + 5, 5)], fill=c, width=2)
    return outline(im, (110, 82, 58, 255))


def t_fence(v):
    w, h = 42, 24
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c, cs = (222, 178, 122, 255), (188, 146, 96, 255)
    for x in (4, 19, 34):
        d.rectangle([x, 6, x + 4, h - 3], fill=c)
        d.rectangle([x, 6, x + 1, h - 3], fill=cs)
    d.rectangle([2, 10, w - 2, 13], fill=c)
    return outline(im, (150, 112, 70, 255))


def t_grave(v):
    w, h = 24, 30
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([4, h - 6, w - 4, h - 1], fill=(40, 60, 40, 55))
    d.rounded_rectangle([5, 4, w - 5, h - 4], 7, fill=(196, 196, 210, 255))
    d.rounded_rectangle([8, 7, w - 8, h - 7], 5, fill=(216, 216, 230, 255))
    d.line([(w // 2, 12), (w // 2, 20)], fill=(150, 150, 170, 255), width=2)
    d.line([(w // 2 - 4, 15), (w // 2 + 4, 15)], fill=(150, 150, 170, 255), width=2)
    return outline(im, (130, 130, 152, 255))


def t_bones(v):
    w, h = 26, 14
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.line([(4, 9), (20, 5)], fill=(240, 238, 226, 255), width=2)
    d.ellipse([2, 7, 6, 11], fill=(250, 248, 238, 255))
    d.ellipse([18, 3, 22, 7], fill=(250, 248, 238, 255))
    return im


def t_portal(v):
    """วงแหวนพอร์ทัลฟ้าเรืองแสงบนแผ่นหิน"""
    w, h = TW, TH + 6
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, cy = w // 2, h - TH // 2 - 1
    # แผ่นหินกลม
    d.ellipse([cx - 24, cy - 12, cx + 24, cy + 12], fill=(196, 196, 214, 255))
    d.ellipse([cx - 20, cy - 10, cx + 20, cy + 10], fill=(216, 216, 234, 255))
    # วงแหวนเรืองแสง (ฟ้าจัด เห็นชัด)
    d.ellipse([cx - 18, cy - 9, cx + 18, cy + 9], fill=(60, 190, 255, 255))
    d.ellipse([cx - 14, cy - 7, cx + 14, cy + 7], fill=(140, 235, 255, 255))
    d.ellipse([cx - 9, cy - 5, cx + 9, cy + 5], fill=(224, 252, 255, 255))
    d.ellipse([cx - 4, cy - 2, cx + 4, cy + 2], fill=(255, 255, 255, 255))
    # ประกายรอบๆ
    for (x, y) in ((cx - 20, cy - 12), (cx + 18, cy - 10), (cx + 6, cy - 16)):
        d.point((x, y), fill=(180, 245, 255, 255))
    return im


def t_shrine(v):
    w, h = TW, TH + 6
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, cy = w // 2, h - TH // 2 - 1
    d.ellipse([cx - 24, cy - 12, cx + 24, cy + 12], fill=(178, 178, 196, 255))
    d.ellipse([cx - 20, cy - 10, cx + 20, cy + 10], fill=(198, 198, 216, 255))
    d.ellipse([cx - 12, cy - 6, cx + 12, cy + 6], outline=(150, 150, 170, 255), width=2)
    return im


FLOORS = {
    "grass": t_grass, "wild": t_wild, "floor": t_floor, "water": t_water,
    "cave": t_cave, "snow": t_snow, "ice": t_ice, "lava": t_lava,
}
OBJECTS = {
    "tree": (t_tree, 4), "pine": (t_pine, 4), "rock": (t_rock, 3),
    "bush": (t_bush, 3), "deadtree": (t_deadtree, 3), "fence": (t_fence, 2),
    "grave": (t_grave, 2), "bones": (t_bones, 2),
    "portal": (t_portal, 1), "shrine": (t_shrine, 1),
    "wall": (t_rock, 2),     # กำแพง = หินก้อนโต (renderer ขยาย 1.5x)
}


def up(im):
    return im.resize((im.width * SC, im.height * SC), Image.NEAREST)


def main():
    pieces = []   # (kind, img, ox, oy)
    for kind, fn in FLOORS.items():
        for v in range(4):
            im = up(fn(v))
            pieces.append((kind, im, im.width // 2, im.height // 2))
    for kind, (fn, n) in OBJECTS.items():
        for v in range(n):
            im = up(fn(v))
            if kind in ("portal", "shrine"):
                # แผ่นพื้น: จุดกลางแผ่น (ล่าง TH/2)
                pieces.append((kind, im, im.width // 2, im.height - TH * SC // 2 - SC))
            else:
                # วัตถุยืน: กลางฐาน (สูงกว่าขอบล่างนิดเพื่อเหยียบกลางช่อง)
                pieces.append((kind, im, im.width // 2, im.height - 4 * SC))

    MAXW, PAD = 1024, 2
    xx = yy = rowh = 0
    places = []
    for kind, im, ox, oy in pieces:
        if xx + im.width + PAD > MAXW:
            xx = 0; yy += rowh + PAD; rowh = 0
        places.append((kind, im, ox, oy, xx, yy))
        xx += im.width + PAD; rowh = max(rowh, im.height)
    H = yy + rowh + PAD
    atlas = Image.new("RGBA", (MAXW, H), (0, 0, 0, 0))
    entries = {}
    for kind, im, ox, oy, px, py in places:
        atlas.alpha_composite(im, (px, py))
        entries.setdefault(kind, []).append(
            {"x": px, "y": py, "w": im.width, "h": im.height, "ox": ox, "oy": oy})
    atlas.save(os.path.join(OUT, "tiles.png"))
    print("tiles.png (cute)", atlas.size)

    mpath = os.path.join(OUT, "flare-manifest.json")
    with open(mpath, encoding="utf-8") as f:
        manifest = json.load(f)
    manifest["tiles"] = {"file": "tiles.png", "tileW": TW * SC, "tileH": TH * SC,
                         "map": entries}
    with open(mpath, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    with open(os.path.join(OUT, "flare-manifest.js"), "w", encoding="utf-8") as f:
        f.write("window.FLARE_MANIFEST = " + json.dumps(manifest, ensure_ascii=False) + ";\n")
    print("manifest tiles updated:", TW * SC, "x", TH * SC)


if __name__ == "__main__":
    main()
