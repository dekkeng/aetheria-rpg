# -*- coding: utf-8 -*-
"""
Aetheria RPG — Equipment overlay builder (top-down)
Ninja Adventure ไม่มีเลเยอร์ชุดเกราะแบบ paper-doll — สร้างเองทับตัวละคร:
  - อาวุธ (hand_r): ใช้ภาพอาวุธจริงของ NA วางในมือตาม 4 ทิศ (ย้อมสีตามระดับ)
  - หมวก/โล่/เกราะ/สนับขา/รองเท้า: วาด pixel-art ทับตำแหน่งร่างกาย
ทุกชิ้นทำเป็น sheet 4 ทิศ x 5 เฟรม (idle+เดิน4) ขนาดเซลล์ 16px -> x3 = 48px
โดยเลื่อนตาม bob ของตัวละคร (อ้างอิงจาก Knight) ให้แนบพอดีทุกเฟรม
เอาต์พุต: assets/sprites/td/gear_<item>.png + เติม "gear" ใน td-manifest
รันหลัง build_topdown.py
"""
import os, json
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NA = os.path.join(ROOT, "assets", "vendor", "ninja-adventure-pack")
OUT = os.path.join(ROOT, "assets", "sprites", "td")
SC = 3
T = 16

# คอลัมน์ทิศ: 0=ลง 1=ขึ้น 2=ซ้าย 3=ขวา  (ตามลำดับ NA)
DIRS = ["down", "up", "left", "right"]

# ---------- อ้างอิง bob จาก Knight (เลื่อนแนวตั้งต่อเฟรม) ----------
def ref_bob():
    idle = Image.open(os.path.join(NA, "Actor/Characters/Knight/SeparateAnim/Idle.png")).convert("RGBA")
    walk = Image.open(os.path.join(NA, "Actor/Characters/Knight/SeparateAnim/Walk.png")).convert("RGBA")

    def top_opaque(im, cx):
        px = im.load()
        for y in range(im.height):
            for x in range(cx, cx + T):
                if px[x, y][3] > 40:
                    return y
        return 0
    bob = [[0] * 5 for _ in range(4)]
    for d in range(4):
        base = top_opaque(idle, d * T)
        bob[d][0] = 0
        for f in range(4):
            cell = walk.crop((d * T, f * T, d * T + T, f * T + T))
            row = 0
            px = cell.load()
            found = False
            for y in range(T):
                for x in range(T):
                    if px[x, y][3] > 40:
                        row = y; found = True; break
                if found:
                    break
            bob[d][f + 1] = row - base
    return bob

BOB = ref_bob()

# ---------- primitives ----------
from PIL import ImageDraw

def cell():
    return Image.new("RGBA", (T, T), (0, 0, 0, 0))

def outline(im, color=(30, 26, 40, 255)):
    px = im.load()
    edge = []
    for y in range(T):
        for x in range(T):
            if px[x, y][3] != 0:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < T and 0 <= ny < T and px[nx, ny][3] > 120:
                    edge.append((x, y)); break
    for (x, y) in edge:
        px[x, y] = color
    return im

def tint_na(im, rgb, boost=1.0):
    r, g, b = rgb
    out = im.copy(); px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            pr, pg, pb, pa = px[x, y]
            if pa == 0:
                continue
            lum = (pr * 3 + pg * 5 + pb * 2) / 10 * boost
            px[x, y] = (min(255, int(lum * r / 255)), min(255, int(lum * g / 255)),
                        min(255, int(lum * b / 255)), pa)
    return out

# ---------- อาวุธ (ใช้ภาพ NA) ----------
NA_WEAPON = {
    "wood_sword":  ("Sword",    (190, 140, 90)),
    "iron_sword":  ("Sword2",   (210, 218, 230)),
    "flame_blade": ("BigSword", (255, 150, 90)),
    "frost_edge":  ("Katana",   (150, 220, 255)),
    "mythril_bow": ("Bow",      (200, 235, 210)),
}

def load_weapon(name):
    p = os.path.join(NA, "Items", "Weapons", name, "Sprite.png")
    return Image.open(p).convert("RGBA")

def draw_weapon(item, d):
    """คืนภาพอาวุธ 16px วางในมือ ตามทิศ d (0..3)"""
    naname, rgb = NA_WEAPON[item]
    spr = tint_na(load_weapon(naname), rgb, boost=1.05)
    im = cell()
    # ย่ออาวุธให้สูงราว 11px (พอดีตัว chibi)
    h = 11
    w = max(3, round(spr.width * h / spr.height))
    blade = spr.resize((w, h), Image.NEAREST)
    if d == 0:      # ลง: มือขวา(จอขวา) ดาบตั้งตรง ปลายขึ้น
        im.alpha_composite(blade, (11, 3))
    elif d == 1:    # ขึ้น: มือซ้าย(จอซ้าย) ดาบหลังตัว
        im.alpha_composite(blade, (2, 3))
    elif d == 2:    # ซ้าย: ดาบชี้ซ้าย (หมุน 90° ทวนเข็ม)
        rot = blade.rotate(90, expand=True)
        im.alpha_composite(rot, (0, 8))
    else:           # ขวา: ดาบชี้ขวา (หมุน 90° ตามเข็ม)
        rot = blade.rotate(-90, expand=True)
        im.alpha_composite(rot, (T - rot.width, 8))
    return im

# ---------- ชิ้นส่วนวาดเอง ----------
def helmet(d, main, edge):
    im = cell(); dd = ImageDraw.Draw(im)
    cx = 8
    # ครอบหัวโค้ง y0-3
    dd.rectangle([cx - 4, 1, cx + 3, 3], fill=main)
    dd.rectangle([cx - 4, 0, cx + 3, 1], fill=edge)
    if d in (0, 2, 3):     # ยอด/กระบัง (ไม่โชว์ตอนหันหลัง)
        dd.point((cx - 1, 0), fill=edge); dd.point((cx, 0), fill=edge)
    if d == 2:
        dd.rectangle([cx - 5, 2, cx - 4, 3], fill=main)
    if d == 3:
        dd.rectangle([cx + 4, 2, cx + 5, 3], fill=main)
    return outline(im)

def shield(d, main, edge):
    im = cell(); dd = ImageDraw.Draw(im)
    # มือซ้าย = ตรงข้ามอาวุธ
    if d == 0:    x = 2
    elif d == 1:  x = 11
    elif d == 2:  x = 9
    else:         x = 4
    dd.rounded_rectangle([x, 7, x + 4, 12], 1, fill=main)
    dd.rectangle([x + 1, 8, x + 3, 11], fill=edge)
    dd.point((x + 2, 9), fill=(255, 255, 255, 255))
    return outline(im)

def armor(d, main, hi):
    im = cell(); dd = ImageDraw.Draw(im)
    # ไหล่ + อกช่วง y6-10
    dd.rectangle([4, 6, 11, 9], fill=main)
    dd.rectangle([4, 6, 11, 6], fill=hi)      # ไฮไลต์ไหล่
    if d in (0, 1):
        dd.rectangle([7, 7, 8, 9], fill=hi)   # แถบกลางอก
    return outline(im)

def legs(d, main, hi):
    im = cell(); dd = ImageDraw.Draw(im)
    dd.rectangle([5, 11, 10, 13], fill=main)
    dd.rectangle([5, 11, 10, 11], fill=hi)
    return outline(im)

def boots(d, main):
    im = cell(); dd = ImageDraw.Draw(im)
    dd.rectangle([4, 13, 6, 15], fill=main)
    dd.rectangle([9, 13, 11, 15], fill=main)
    return outline(im)

# ---------- นิยามชิ้นเกราะ (สี main/edge) ----------
GEAR = {
    # helmet
    "leather_cap":  ("helmet", (150, 108, 66, 255),  (110, 78, 46, 255)),
    "iron_helm":    ("helmet", (200, 208, 220, 255), (140, 148, 162, 255)),
    # shield
    "wooden_shield":("shield", (168, 120, 72, 255),  (120, 84, 50, 255)),
    "tower_shield": ("shield", (196, 204, 218, 255), (130, 138, 152, 255)),
    # armor (body)
    "leather_armor":("armor",  (156, 112, 70, 255),  (198, 150, 100, 255)),
    "iron_armor":   ("armor",  (176, 186, 202, 255), (220, 228, 240, 255)),
    "dragon_mail":  ("armor",  (120, 170, 110, 255), (170, 220, 150, 255)),
    "aether_robe":  ("armor",  (150, 120, 220, 255), (200, 175, 255, 255)),
    # legs
    "padded_legs":  ("legs",   (120, 110, 150, 255), (160, 150, 190, 255)),
    "iron_greaves": ("legs",   (170, 178, 194, 255), (210, 218, 234, 255)),
    # boots
    "leather_boots":("boots",  (110, 78, 50, 255),   None),
    "swift_boots":  ("boots",  (120, 210, 170, 255), None),
}
DRAW = {"helmet": helmet, "shield": shield, "armor": armor, "legs": legs, "boots": boots}


def apply_bob(base16, d, row):
    """เลื่อนภาพ 16px ตาม bob ของเฟรม (row 0=idle, 1..4=เดิน)"""
    dy = BOB[d][row]
    if dy == 0:
        return base16
    out = cell()
    out.alpha_composite(base16, (0, dy))
    return out


def make_sheet(kind_fn, item=None, colors=None):
    """สร้าง sheet 4 col x 5 row (64x80) แล้ว x3"""
    sheet = Image.new("RGBA", (T * 4, T * 5), (0, 0, 0, 0))
    for d in range(4):
        # ภาพฐาน (idle) ต่อทิศ
        if item is not None:            # อาวุธ
            base = draw_weapon(item, d)
        else:
            base = kind_fn(d, *colors)
        for row in range(5):
            frame = apply_bob(base, d, row)
            sheet.paste(frame, (d * T, row * T), frame)
    return sheet.resize((sheet.width * SC, sheet.height * SC), Image.NEAREST)


def main():
    mpath = os.path.join(OUT, "td-manifest.json")
    with open(mpath, encoding="utf-8") as f:
        man = json.load(f)
    man["gear"] = {}
    # slot ที่ใช้แสดงบนตัว (necklace/ring/earring เป็นเครื่องประดับเล็ก ไม่วาด)
    SLOT = {
        "wood_sword": "hand_r", "iron_sword": "hand_r", "flame_blade": "hand_r",
        "frost_edge": "hand_r", "mythril_bow": "hand_r",
        "wooden_shield": "hand_l", "tower_shield": "hand_l",
        "leather_cap": "head", "iron_helm": "head",
        "leather_armor": "body", "iron_armor": "body", "dragon_mail": "body", "aether_robe": "body",
        "padded_legs": "legs", "iron_greaves": "legs",
        "leather_boots": "boots", "swift_boots": "boots",
    }
    # อาวุธ
    for item in NA_WEAPON:
        sheet = make_sheet(None, item=item)
        sheet.save(os.path.join(OUT, "gear_%s.png" % item))
        man["gear"][item] = {"file": "gear_%s.png" % item, "slot": SLOT[item]}
        print("weapon", item)
    # ชิ้นวาดเอง
    for item, (kind, *cols) in GEAR.items():
        cols = [c for c in cols if c is not None] if kind == "boots" else cols
        sheet = make_sheet(DRAW[kind], colors=cols)
        sheet.save(os.path.join(OUT, "gear_%s.png" % item))
        man["gear"][item] = {"file": "gear_%s.png" % item, "slot": SLOT[item]}
        print("gear", item, kind)

    with open(mpath, "w", encoding="utf-8") as f:
        json.dump(man, f, ensure_ascii=False, indent=1)
    with open(os.path.join(OUT, "td-manifest.js"), "w", encoding="utf-8") as f:
        f.write("window.TD_MANIFEST = " + json.dumps(man, ensure_ascii=False) + ";\n")
    print("gear sheets + manifest done")


if __name__ == "__main__":
    main()
