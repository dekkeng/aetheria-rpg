# -*- coding: utf-8 -*-
"""
Aetheria RPG — Procedural Pixel-Art Sprite Generator
สร้าง sprite sheet แบบ pixel-art 2.5D: ฮีโร่ 3 อาชีพ (4 ทิศ, idle+walk),
มอนสเตอร์ (idle 2 เฟรม), ไอเทม, และทายล์เซ็ตแบบมีมิติ
ผลลัพธ์: assets/sprites/*.png + manifest.json  (โค้ดต้นฉบับทั้งหมด)
"""
import os, json, math
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "sprites")
os.makedirs(OUT, exist_ok=True)

# ---------------- primitives ----------------
def new_cell(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))

def rect(d, x0, y0, x1, y1, c):
    d.rectangle([x0, y0, x1, y1], fill=c)

def ellipse(d, x0, y0, x1, y1, c):
    d.ellipse([x0, y0, x1, y1], fill=c)

def add_outline(img, color=(26, 22, 38, 255)):
    """เพิ่มเส้นขอบดำรอบ silhouette (pixel ที่โปร่งใสแต่ติดกับ pixel ทึบ)"""
    px = img.load()
    w, h = img.size
    edge = []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] != 0:
                continue
            near = False
            for dx, dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
                nx, ny = x+dx, y+dy
                if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] > 128:
                    near = True; break
            if near:
                edge.append((x, y))
    for (x, y) in edge:
        px[x, y] = color
    return img

def shadow(d, cx, cy, rw, rh, alpha=90):
    ellipse(d, cx-rw, cy-rh, cx+rw, cy+rh, (0, 0, 0, alpha))

# ---------------- palettes ----------------
SKIN   = (245, 205, 165, 255)
SKIN_S = (205, 155, 120, 255)
PAL = {
    "warrior": dict(
        main=(120, 132, 152, 255), main_s=(80, 90, 112, 255), main_h=(180, 192, 208, 255),
        acc=(190, 46, 58, 255), acc_s=(140, 30, 40, 255),
        hair=(92, 60, 40, 255), metal=(205, 212, 222, 255), metal_s=(150,158,170,255),
    ),
    "mage": dict(
        main=(120, 78, 190, 255), main_s=(82, 50, 138, 255), main_h=(162, 120, 228, 255),
        acc=(240, 210, 90, 255), acc_s=(200, 160, 60, 255),
        hair=(60, 45, 70, 255), metal=(150, 100, 55, 255), gem=(95, 225, 255, 255),
    ),
    "archer": dict(
        main=(74, 148, 86, 255), main_s=(48, 104, 58, 255), main_h=(118, 190, 118, 255),
        acc=(150, 108, 60, 255), acc_s=(110, 78, 42, 255),
        hair=(70, 52, 34, 255), metal=(160, 120, 70, 255), string=(230,230,210,255),
    ),
}

S = 48  # ขนาดเซลล์ฮีโร่
DIRS = ["down", "up", "left", "right"]

# ---- โครงร่าง chibi ที่ทุกอาชีพใช้ร่วมกัน (เพื่อให้ overlay อาวุธ/เกราะ ตรงตำแหน่ง) ----
CX = 24
def hero_anim(frame):
    bob  = [0, -1, 0, -1][frame]        # ตัวขยับขึ้นลง (หายใจ)
    legA = [0, 0, -2, 2][frame]         # ก้าวขาซ้าย
    legB = [0, 0, 2, -2][frame]         # ก้าวขาขวา
    arm  = [0, 0, 1, -1][frame]         # แกว่งแขน
    return bob, legA, legB, arm

def hero_body_rect(frame):
    """คืน (x0,y0,x1,y1) ของลำตัว chibi ในเฟรมนั้น — ใช้ให้ overlay เกราะแนบพอดี"""
    bob = hero_anim(frame)[0]
    return (CX-7, 27+bob, CX+7, 40+bob)

def draw_hero(cls, direction, frame):
    """ฮีโร่ chibi: หัวโต ตัวเตี้ย ขาสั้น — ไม่ถืออาวุธ (อาวุธมาเป็น overlay ตอนสวม)"""
    flip = (direction == "left")
    dr = "right" if flip else direction
    img = new_cell(S, S); d = ImageDraw.Draw(img)
    p = PAL[cls]
    bob, legA, legB, arm = hero_anim(frame)
    cx = CX
    boot = (58, 46, 40, 255)

    shadow(d, cx, 45, 10, 3, 95)

    # ---- ขาสั้น + รองเท้า ----
    rect(d, cx-5, 38+bob, cx-1, 43+bob+legA, p["main_s"])
    rect(d, cx+1, 38+bob, cx+5, 43+bob+legB, p["main_s"])
    rect(d, cx-6, 42+bob+legA, cx-1, 45+bob+legA, boot)
    rect(d, cx+1, 42+bob+legB, cx+6, 45+bob+legB, boot)

    by0, by1 = 27+bob, 40+bob
    # ---- เสื้อคลุมหลัง (นักรบ) ----
    if cls == "warrior" and dr != "up":
        d.polygon([(cx-7, by0+1), (cx-10, by1+3), (cx+10, by1+3), (cx+7, by0+1)], fill=p["acc_s"])
    # ---- แขน (หลังลำตัว) ----
    rect(d, cx-9, by0+2+arm, cx-6, by0+9+arm, p["main_s"])
    rect(d, cx+6, by0+2-arm, cx+9, by0+9-arm, p["main_s"])
    rect(d, cx-9, by0+8+arm, cx-6, by0+11+arm, SKIN)   # มือ
    rect(d, cx+6, by0+8-arm, cx+9, by0+11-arm, SKIN)

    # ---- ลำตัว (เสื้อ) ----
    if cls == "mage":                                   # ชายเสื้อบานล่าง
        d.polygon([(cx-7, by1-4), (cx-9, by1+2), (cx+9, by1+2), (cx+7, by1-4)], fill=p["main"])
        rect(d, cx-9, by1, cx+9, by1+2, p["main_s"])
    rect(d, cx-7, by0, cx+7, by1, p["main"])
    rect(d, cx-7, by0, cx+7, by0+3, p["main_h"])        # ไฮไลต์ไหล่
    rect(d, cx-7, by1-3, cx+7, by1, p["main_s"])        # เงาชายเสื้อ
    rect(d, cx-3, by0-1, cx+3, by0+2, p["main_h"])      # คอเสื้อ
    # รายละเอียดต่ออาชีพ
    if cls == "warrior":
        rect(d, cx-7, by1-6, cx+7, by1-4, p["acc"])     # สายคาดแดง
        rect(d, cx-1, by1-6, cx+1, by1-4, p["metal"])   # หัวเข็มขัด
        d.line([(cx, by0+2), (cx, by1-6)], fill=p["main_s"], width=1)
    elif cls == "archer":
        d.line([(cx-6, by0+1), (cx+5, by1-2)], fill=p["acc"], width=2)   # สายสะพายธนู
        rect(d, cx-7, by1-6, cx+7, by1-5, p["acc_s"])   # เข็มขัด
    elif cls == "mage":
        rect(d, cx-1, by0, cx+1, by1, p["main_h"])      # แถบกลางชุด
        rect(d, cx-7, by1-6, cx+7, by1-5, p["acc"])     # ผ้าคาดทอง

    # ---- หัวโต ----
    hr = 10; hcy = 16 + bob
    ellipse(d, cx-hr, hcy-hr, cx+hr, hcy+hr, SKIN)
    rect(d, cx-hr+2, hcy+hr-4, cx+hr-2, hcy+hr, SKIN_S)     # เงาคาง
    ear = SKIN_S
    if dr in ("down", "up"):
        rect(d, cx-hr, hcy-1, cx-hr+1, hcy+2, ear); rect(d, cx+hr-1, hcy-1, cx+hr, hcy+2, ear)

    # ผม/หมวกต่ออาชีพ
    if cls == "warrior":
        d.pieslice([cx-hr, hcy-hr-1, cx+hr, hcy+3], 180, 360, fill=p["hair"])       # ผม
        d.pieslice([cx-hr-1, hcy-hr-2, cx+hr+1, hcy], 180, 360, fill=p["metal"])    # หมวกเหล็ก
        rect(d, cx-hr-1, hcy-3, cx+hr+1, hcy-1, p["metal_s"])                        # ขอบหมวก
        rect(d, cx-1, hcy-hr-3, cx+1, hcy-hr, p["acc"])                              # ยอดขนแดง
    elif cls == "mage":
        d.pieslice([cx-hr, hcy-hr, cx+hr, hcy+2], 180, 360, fill=p["hair"])
        d.polygon([(cx, hcy-hr-11), (cx-hr-1, hcy-2), (cx+hr+1, hcy-2)], fill=p["main"])   # หมวกแหลม
        d.polygon([(cx, hcy-hr-11), (cx, hcy-2), (cx+hr+1, hcy-2)], fill=p["main_s"])
        rect(d, cx-hr-1, hcy-3, cx+hr+1, hcy-1, p["main_h"])
        ellipse(d, cx-2, hcy-hr-13, cx+2, hcy-hr-9, p["acc"])                        # ปอมปอม
    else:  # archer — ฮู้ด
        d.pieslice([cx-hr-2, hcy-hr-2, cx+hr+2, hcy+3], 180, 360, fill=p["main"])
        d.pieslice([cx-hr, hcy-hr, cx+hr, hcy+1], 180, 360, fill=p["hair"])          # ผมลอด
        rect(d, cx-hr-2, hcy-2, cx+hr+2, hcy+1, p["main_s"])

    # หน้า
    eye = (48, 40, 54, 255); shine = (255, 255, 255, 255)
    if dr == "down":
        rect(d, cx-4, hcy, cx-2, hcy+3, eye);  rect(d, cx-4, hcy, cx-3, hcy+1, shine)
        rect(d, cx+2, hcy, cx+4, hcy+3, eye);  rect(d, cx+2, hcy, cx+3, hcy+1, shine)
        rect(d, cx-5, hcy+3, cx-3, hcy+4, (232,150,150,150))   # แก้ม
        rect(d, cx+3, hcy+3, cx+5, hcy+4, (232,150,150,150))
        rect(d, cx-1, hcy+5, cx+1, hcy+6, (170,90,90,255))     # ปาก
    elif dr == "right":
        rect(d, cx+2, hcy, cx+4, hcy+3, eye); rect(d, cx+2, hcy, cx+3, hcy+1, shine)
        rect(d, cx+4, hcy+3, cx+6, hcy+4, (232,150,150,140))
        rect(d, cx+3, hcy+5, cx+5, hcy+6, (170,90,90,255))

    add_outline(img)
    if flip:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    return img

def build_heroes():
    classes = ["warrior", "mage", "archer"]
    cols, frames = 4, 4
    sheet = Image.new("RGBA", (S*frames, S*len(classes)*len(DIRS)), (0,0,0,0))
    layout = {}
    row = 0
    for cls in classes:
        for direction in DIRS:
            for f in range(frames):
                cell = draw_hero(cls, direction, f)
                sheet.paste(cell, (f*S, row*S), cell)
            layout[f"{cls}_{direction}"] = row
            row += 1
    sheet.save(os.path.join(OUT, "heroes.png"))
    return {"cell": S, "frames": frames, "rows": layout,
            "idle": [0, 1], "walk": [2, 0, 3, 0]}

# ---------------- equipment overlays (chibi, ใช้ได้ทุกอาชีพ) ----------------
# key = item id ; วาดแนบกับโครง chibi เดียวกับฮีโร่ (มือขวา/ลำตัว)
WEAPON_LOOK = {
    "wood_sword":  ("sword", (170,122,72,255),  (202,152,98,255),  (96,66,40,255)),
    "iron_sword":  ("sword", (208,214,224,255),  (242,246,252,255), (110,84,52,255)),
    "flame_blade": ("sword", (242,122,54,255),   (255,192,92,255),  (92,40,30,255)),
    "frost_edge":  ("sword", (150,220,240,255),  (214,246,255,255), (70,110,130,255)),
    "mythril_bow": ("bow",   (122,206,216,255),  (206,246,251,255), (232,232,212,255)),
}
ARMOR_LOOK = {
    "leather_armor": ((150,104,60,255),  (192,142,92,255),  (110,74,44,255)),
    "iron_armor":    ((150,160,178,255), (198,208,224,255), (96,104,122,255)),
    "dragon_mail":   ((112,52,52,255),   (172,82,74,255),   (70,30,32,255)),
    "aether_robe":   ((150,110,210,255), (202,172,246,255), (96,66,150,255)),
}

def draw_weapon(look, direction, frame):
    flip = (direction == "left")
    img = new_cell(S, S); d = ImageDraw.Draw(img)
    shape, blade, hi, hilt = WEAPON_LOOK[look]
    bob, legA, legB, arm = hero_anim(frame)
    cx = CX; by0 = 27 + bob
    if shape == "sword":
        hy = by0 + 9 - arm                              # มือขวา
        rect(d, cx+7, hy-15, cx+9, hy, blade)           # ใบดาบ
        rect(d, cx+7, hy-15, cx+7, hy, hi)              # คมสว่าง
        rect(d, cx+6, hy-17, cx+9, hy-14, hi)           # ปลายแหลม
        rect(d, cx+5, hy-1, cx+11, hy+1, hilt)          # การ์ด
        rect(d, cx+7, hy+1, cx+9, hy+4, hilt)           # ด้าม
    else:                                               # ธนู (มือซ้าย)
        hy = by0 + 9 + arm
        d.arc([cx-13, hy-13, cx-3, hy+9], 300, 60, fill=blade, width=2)
        d.line([(cx-4, hy-11), (cx-4, hy+7)], fill=hi, width=1)
    add_outline(img, (26,22,38,210))
    if flip: img = img.transpose(Image.FLIP_LEFT_RIGHT)
    return img

def draw_armor(look, direction, frame):
    flip = (direction == "left")
    img = new_cell(S, S); d = ImageDraw.Draw(img)
    main, hi, sh = ARMOR_LOOK[look]
    bob, legA, legB, arm = hero_anim(frame)
    cx = CX; by0, by1 = 27 + bob, 40 + bob
    if look == "aether_robe":                           # ชุดคลุมยาว
        d.polygon([(cx-7,by1-4),(cx-10,by1+2),(cx+10,by1+2),(cx+7,by1-4)], fill=main)
        rect(d, cx-10, by1, cx+10, by1+2, sh)
    rect(d, cx-7, by0, cx+7, by1-1, main)               # อกเกราะ
    rect(d, cx-7, by0, cx+7, by0+3, hi)                 # ไฮไลต์บน
    rect(d, cx-7, by1-3, cx+7, by1-1, sh)               # เงาล่าง
    rect(d, cx-9, by0+1, cx-6, by0+5, main); rect(d, cx-9, by0+1, cx-6, by0+2, hi)   # บ่าซ้าย
    rect(d, cx+6, by0+1, cx+9, by0+5, main); rect(d, cx+6, by0+1, cx+9, by0+2, hi)   # บ่าขวา
    if look == "aether_robe":
        rect(d, cx-1, by0, cx+1, by1-1, (240,210,90,255))          # แถบทอง
    elif look == "dragon_mail":
        for yy in range(by0+3, by1-2, 3):
            d.line([(cx-6, yy), (cx+6, yy)], fill=sh, width=1)      # เกล็ด
    else:
        d.line([(cx, by0+2), (cx, by1-3)], fill=sh, width=1)
    add_outline(img, (26,22,38,190))
    if flip: img = img.transpose(Image.FLIP_LEFT_RIGHT)
    return img

def build_gear(kind, looks, drawfn):
    order = list(looks.keys()); rows = {}
    sheet = Image.new("RGBA", (S*4, S*len(order)*len(DIRS)), (0,0,0,0))
    r = 0
    for look in order:
        for direction in DIRS:
            for f in range(4):
                sheet.paste(drawfn(look, direction, f), (f*S, r*S), drawfn(look, direction, f))
            rows[f"{look}_{direction}"] = r; r += 1
    sheet.save(os.path.join(OUT, kind + ".png"))
    return {"cell": S, "frames": 4, "rows": rows, "idle": [0, 1], "walk": [2, 0, 3, 0]}

# ---- overlay เพิ่ม: หมวก(หัว) / โล่(มือซ้าย) / เกราะขา / รองเท้า ----
HELMET_LOOK = {  # main, hi, shadow
    "leather_cap": ((150,104,60,255), (192,142,92,255), (110,74,44,255)),
    "iron_helm":   ((172,180,194,255), (216,222,234,255), (110,118,134,255)),
}
SHIELD_LOOK = {  # face, rim, boss
    "wooden_shield": ((162,118,74,255), (110,80,48,255), (206,166,96,255)),
    "tower_shield":  ((152,162,180,255), (100,108,126,255), (216,222,234,255)),
}
LEGS_LOOK = {    # main, hi, shadow
    "padded_legs":  ((172,152,122,255), (202,184,152,255), (128,110,84,255)),
    "iron_greaves": ((150,160,178,255), (200,210,226,255), (96,104,122,255)),
}
BOOTS_LOOK = {   # main, hi, accent(ปีก/None)
    "leather_boots": ((112,82,52,255), (152,112,74,255), None),
    "swift_boots":   ((88,150,210,255), (152,202,240,255), (244,222,120,255)),
}

def draw_helmet(look, direction, frame):
    flip = (direction == "left"); dr = "right" if flip else direction
    img = new_cell(S, S); d = ImageDraw.Draw(img)
    main, hi, sh = HELMET_LOOK[look]
    bob = hero_anim(frame)[0]; cx = CX; hcy = 16 + bob; hr = 10
    d.pieslice([cx-hr-1, hcy-hr-2, cx+hr+1, hcy+3], 180, 360, fill=main)   # โดม
    d.pieslice([cx-hr-1, hcy-hr-2, cx+hr+1, hcy-1], 180, 360, fill=hi)     # ไฮไลต์บน
    rect(d, cx-hr-1, hcy-1, cx+hr+2, hcy+1, sh)                            # ขอบหมวก
    if look == "iron_helm":
        if dr == "down":
            rect(d, cx-1, hcy-1, cx+1, hcy+5, sh)                          # แกนป้องกันจมูก
        rect(d, cx-1, hcy-hr-2, cx+1, hcy-hr+1, hi)                        # สันหมวก
    else:
        ellipse(d, cx-2, hcy-hr-1, cx+1, hcy-hr+2, hi)                     # ปุ่มบนหมวกผ้า
    add_outline(img, (26,22,38,200))
    if flip: img = img.transpose(Image.FLIP_LEFT_RIGHT)
    return img

def draw_shield(look, direction, frame):
    flip = (direction == "left"); dr = "right" if flip else direction
    img = new_cell(S, S); d = ImageDraw.Draw(img)
    face, rim, boss = SHIELD_LOOK[look]
    bob, legA, legB, arm = hero_anim(frame)
    cx = CX; by0 = 27 + bob
    scx = cx - 9; scy = by0 + 7 + arm                     # ตำแหน่งมือซ้าย
    if look == "tower_shield":
        rect(d, scx-4, scy-8, scx+3, scy+8, face)         # โล่หอคอย (ยาว)
        rect(d, scx-4, scy-8, scx-2, scy+8, boss)         # แถบกลางสว่าง
        rect(d, scx-4, scy-8, scx+3, scy-7, rim); rect(d, scx-4, scy+7, scx+3, scy+8, rim)
    else:
        ellipse(d, scx-5, scy-6, scx+4, scy+6, face)      # โล่กลม
        d.arc([scx-5, scy-6, scx+4, scy+6], 0, 360, fill=rim, width=1)
        ellipse(d, scx-2, scy-2, scx+1, scy+1, boss)      # ปุ่มกลาง
    add_outline(img, (26,22,38,200))
    if flip: img = img.transpose(Image.FLIP_LEFT_RIGHT)
    return img

def draw_legs(look, direction, frame):
    flip = (direction == "left")
    img = new_cell(S, S); d = ImageDraw.Draw(img)
    main, hi, sh = LEGS_LOOK[look]
    bob, legA, legB, arm = hero_anim(frame); cx = CX
    rect(d, cx-5, 37+bob, cx-1, 43+bob+legA, main)        # ขาซ้าย
    rect(d, cx+1, 37+bob, cx+5, 43+bob+legB, main)        # ขาขวา
    rect(d, cx-5, 37+bob, cx-3, 43+bob+legA, hi)          # ไฮไลต์
    rect(d, cx+1, 37+bob, cx+3, 43+bob+legB, hi)
    rect(d, cx-5, 42+bob+legA, cx-1, 43+bob+legA, sh)
    rect(d, cx+1, 42+bob+legB, cx+5, 43+bob+legB, sh)
    add_outline(img, (26,22,38,190))
    if flip: img = img.transpose(Image.FLIP_LEFT_RIGHT)
    return img

def draw_boots(look, direction, frame):
    flip = (direction == "left")
    img = new_cell(S, S); d = ImageDraw.Draw(img)
    main, hi, acc = BOOTS_LOOK[look]
    bob, legA, legB, arm = hero_anim(frame); cx = CX
    rect(d, cx-6, 42+bob+legA, cx-1, 45+bob+legA, main)   # รองเท้าซ้าย
    rect(d, cx+1, 42+bob+legB, cx+6, 45+bob+legB, main)   # รองเท้าขวา
    rect(d, cx-6, 42+bob+legA, cx-1, 43+bob+legA, hi)
    rect(d, cx+1, 42+bob+legB, cx+6, 43+bob+legB, hi)
    if acc:                                               # ปีกข้างรองเท้า (swift)
        d.polygon([(cx-6,43+bob+legA),(cx-9,42+bob+legA),(cx-6,45+bob+legA)], fill=acc)
        d.polygon([(cx+6,43+bob+legB),(cx+9,42+bob+legB),(cx+6,45+bob+legB)], fill=acc)
    add_outline(img, (26,22,38,190))
    if flip: img = img.transpose(Image.FLIP_LEFT_RIGHT)
    return img

# ---------------- enemies ----------------
E = 48
def draw_enemy(kind, frame):
    img = new_cell(E, E); d = ImageDraw.Draw(img)
    cx = 24
    sq = 2 if frame == 1 else 0     # squash idle
    shadow(d, cx, 43, 12, 3, 95)
    if kind == "slime":
        g, gs, gh = (86,196,96,255),(56,150,66,255),(150,235,150,255)
        d.pieslice([cx-13, 20+sq, cx+13, 46], 180, 360, fill=g)
        rect(d, cx-13, 33, cx+13, 44-sq, g)
        d.pieslice([cx-13, 40-sq, cx+13, 47], 0, 180, fill=g)
        d.pieslice([cx-11, 22+sq, cx+11, 36], 180, 360, fill=gh)
        rect(d, cx-13, 40-sq, cx+13, 44-sq, gs)
        rect(d, cx-6, 30, cx-3, 34, (255,255,255,255)); rect(d, cx-5, 31, cx-4, 33,(30,30,40,255))
        rect(d, cx+3, 30, cx+6, 34, (255,255,255,255)); rect(d, cx+4, 31, cx+5, 33,(30,30,40,255))
        rect(d, cx-3, 37, cx+3, 38, gs)
    elif kind == "bat":
        b, bs = (108,88,140,255),(72,58,98,255)
        wy = 18 if frame==0 else 12
        d.polygon([(cx-4,26),(cx-20,wy),(cx-16,30),(cx-6,30)], fill=b)
        d.polygon([(cx+4,26),(cx+20,wy),(cx+16,30),(cx+6,30)], fill=b)
        d.polygon([(cx-4,26),(cx-18,wy+2),(cx-8,29)], fill=bs)
        d.polygon([(cx+4,26),(cx+18,wy+2),(cx+8,29)], fill=bs)
        ellipse(d, cx-6, 22, cx+6, 34, b)
        d.polygon([(cx-5,22),(cx-2,15),(cx-1,23)], fill=b)  # หู
        d.polygon([(cx+5,22),(cx+2,15),(cx+1,23)], fill=b)
        rect(d, cx-4, 26, cx-2, 28, (255,220,90,255)); rect(d, cx+2, 26, cx+4, 28,(255,220,90,255))
        rect(d, cx-2, 31, cx+2, 32, (255,255,255,255))
    elif kind == "wolf":
        w, ws, wh = (120,124,140,255),(84,88,104,255),(168,172,186,255)
        legdx = 2 if frame==1 else 0
        rect(d, cx-14+legdx, 38, cx-10+legdx, 44, ws)
        rect(d, cx+9-legdx, 38, cx+13-legdx, 44, ws)
        rect(d, cx-9-legdx, 38, cx-5-legdx, 44, w)
        rect(d, cx+4+legdx, 38, cx+8+legdx, 44, w)
        ellipse(d, cx-14, 26, cx+12, 40, w)                # ลำตัว
        ellipse(d, cx-14, 26, cx+10, 34, wh)
        d.polygon([(cx+8,24),(cx+20,22),(cx+18,34),(cx+8,34)], fill=w)  # หัว
        d.polygon([(cx+9,22),(cx+12,15),(cx+13,24)], fill=w)           # หู
        d.polygon([(cx+15,20),(cx+18,15),(cx+18,24)], fill=w)
        rect(d, cx+17, 27, cx+20, 29, (255,215,70,255))               # ตา
        d.polygon([(cx-14,30),(cx-22,34),(cx-14,36)], fill=ws)         # หาง
    elif kind == "goblin":
        g, gs = (110,158,78,255),(76,116,52,255)
        legs = 1 if frame==1 else 0
        rect(d, cx-5, 36, cx-1, 44-legs, gs); rect(d, cx+1, 36, cx+5, 44+legs-1, gs)
        ellipse(d, cx-8, 22, cx+8, 40, g)                  # ตัว
        rect(d, cx-8, 30, cx+8, 40, g)
        ellipse(d, cx-7, 12, cx+7, 26, g)                  # หัว
        d.polygon([(cx-7,18),(cx-14,10),(cx-6,16)], fill=g)  # หูแหลม
        d.polygon([(cx+7,18),(cx+14,10),(cx+6,16)], fill=g)
        rect(d, cx-5, 18, cx-2, 21, (240,60,60,255)); rect(d, cx+2, 18, cx+5, 21,(240,60,60,255))
        rect(d, cx-3, 24, cx+3, 25, (60,40,30,255))
        rect(d, cx+7, 20, cx+9, 40, (120,90,50,255))       # กระบอง
        ellipse(d, cx+5, 14, cx+13, 22, (90,66,40,255))
    elif kind == "golem":
        r, rs, rh = (128,120,110,255),(92,86,78,255),(168,160,148,255)
        off = 1 if frame==1 else 0
        rect(d, cx-12, 20-off, cx+12, 42, r)               # ตัวหิน
        rect(d, cx-12, 20-off, cx+12, 26-off, rh)
        rect(d, cx-12, 36, cx+12, 42, rs)
        rect(d, cx-16, 24, cx-12, 38, rs); rect(d, cx+12, 24, cx+16, 38, rs)  # แขน
        rect(d, cx-8, 12-off, cx+8, 22-off, r)             # หัว
        rect(d, cx-6, 15-off, cx-2, 18-off, (120,230,255,255))
        rect(d, cx+2, 15-off, cx+6, 18-off, (120,230,255,255))
        # รอยแตก
        d.line([(cx-4,26),(cx+2,34)], fill=rs, width=1)
        d.line([(cx+6,24),(cx+4,40)], fill=rs, width=1)
    elif kind == "drake":
        r, rs, rh = (196,66,52,255),(140,40,32,255),(235,120,90,255)
        wy = 8 if frame==0 else 4
        # ปีก
        d.polygon([(cx-6,24),(cx-22,wy),(cx-20,26),(cx-8,30)], fill=rs)
        d.polygon([(cx+6,24),(cx+22,wy),(cx+20,26),(cx+8,30)], fill=rs)
        d.polygon([(cx-6,24),(cx-19,wy+3),(cx-9,29)], fill=r)
        d.polygon([(cx+6,24),(cx+19,wy+3),(cx+9,29)], fill=r)
        ellipse(d, cx-10, 22, cx+10, 44, r)                # ตัว
        ellipse(d, cx-8, 24, cx+8, 36, rh)
        # หาง
        d.polygon([(cx-8,40),(cx-20,44),(cx-16,38)], fill=rs)
        # คอ+หัว
        rect(d, cx+2, 12, cx+8, 26, r)
        ellipse(d, cx+4, 6, cx+18, 18, r)
        d.polygon([(cx+16,8),(cx+22,10),(cx+16,13)], fill=rh)  # ปาก
        d.polygon([(cx+6,6),(cx+9,0),(cx+10,7)], fill=rs)      # เขา
        rect(d, cx+11, 9, cx+14, 11, (255,220,60,255))        # ตา
        # หนามหลัง
        for i in range(3):
            d.polygon([(cx-6+i*5,22),(cx-3+i*5,16),(cx+i*5,22)], fill=rs)
    elif kind == "bramblewrath":
        # ทรีนต์เน่ายักษ์ (บอสป่า)
        b, bs, bh = (86,60,40,255),(58,40,28,255),(120,86,54,255)
        rect(d, cx-6, 22, cx+6, 46, b)                     # ลำต้น
        rect(d, cx-6, 22, cx-2, 46, bh)
        d.line([(cx,26),(cx,44)], fill=bs, width=1)
        for (ax,ay) in ((cx-6,26),(cx+6,28)):              # กิ่งแขน
            d.line([(ax,ay),(ax+(-8 if ax<cx else 8),ay-8)], fill=bs, width=3)
        ellipse(d, cx-16, 2, cx+16, 26, (56,96,52,255))    # พุ่มหัว
        ellipse(d, cx-13, 4, cx+11, 22, (76,126,66,255))
        dither(d, cx-16, 2, cx+16, 24, (40,76,40,255), 3)
        rect(d, cx-6, 30, cx-2, 34, (255,210,60,255))      # ตาเรือง
        rect(d, cx+2, 30, cx+6, 34, (255,210,60,255))
        d.arc([cx-5,36,cx+5,42], 200, 340, fill=bs, width=1)  # ปากไม้
        for i in range(3): d.polygon([(cx-10+i*8,44),(cx-8+i*8,50),(cx-6+i*8,44)], fill=bs)  # ราก
    elif kind == "bog_horror":
        # อสูรบึง (หนวด+ตา)
        g, gs, gh = (70,96,72,255),(46,66,50,255),(110,140,100,255)
        for i,tx in enumerate((cx-14,cx-7,cx+1,cx+8)):     # หนวด
            sway = 3 if (frame+i)%2 else -3
            d.line([(tx,44),(tx+sway,30),(tx,20)], fill=gs, width=3)
        ellipse(d, cx-14, 16, cx+14, 44, g)                # ตัว
        ellipse(d, cx-11, 18, cx+9, 34, gh)
        dither(d, cx-13, 18, cx+13, 42, (54,76,58,255), 3)
        for (ex,ey,r) in ((cx-6,26,3),(cx+3,24,4),(cx-1,32,2)):  # ตาหลายดวง
            ellipse(d, ex,ey,ex+r+2,ey+r+2,(230,240,120,255))
            ellipse(d, ex+1,ey+1,ex+r,ey+r,(30,40,30,255))
        for i in range(5): d.polygon([(cx-10+i*5,40),(cx-8+i*5,45),(cx-6+i*5,40)], fill=(220,230,210,255))  # ฟัน
    elif kind == "nyx_duel":
        # นิกซ์ — นักลอบสังหารคลุมฮู้ด ถือกริชคู่
        r, rs = (44,40,66,255),(28,26,44,255)
        shadow(d, cx, 44, 10, 3, 90)
        rect(d, cx-5, 32, cx-1, 43, rs); rect(d, cx+1, 32, cx+5, 43, rs)   # ขา
        rect(d, cx-7, 16, cx+7, 34, r)                     # ตัว/เสื้อคลุม
        d.polygon([(cx-7,16),(cx-10,34),(cx-7,34)], fill=rs)
        d.polygon([(cx+7,16),(cx+10,34),(cx+7,34)], fill=rs)
        d.pieslice([cx-8, 2, cx+8, 20], 180, 360, fill=r)  # ฮู้ด
        rect(d, cx-8, 10, cx+8, 15, rs)
        ellipse(d, cx-5, 8, cx+5, 16, (20,18,30,255))      # เงาในฮู้ด
        rect(d, cx-4, 11, cx-1, 13, (150,240,255,255))     # ตาเรือง
        rect(d, cx+1, 11, cx+4, 13, (150,240,255,255))
        # กริชคู่
        d.line([(cx-9,20),(cx-13,10)], fill=(210,220,235,255), width=2)
        d.line([(cx+9,20),(cx+13,30)], fill=(210,220,235,255), width=2)
    elif kind == "vheron":
        # ราชันเถ้าธุลี — เกราะดำ มงกุฎ เสื้อคลุม
        a, as_, ah = (60,56,74,255),(40,36,52,255),(96,90,116,255)
        shadow(d, cx, 45, 12, 3, 100)
        d.polygon([(cx-9,16),(cx-14,44),(cx,40),(cx+14,44),(cx+9,16)], fill=(70,20,28,255))  # เสื้อคลุมแดงเถ้า
        rect(d, cx-8, 14, cx+8, 40, a)                     # เกราะ
        rect(d, cx-8, 14, cx+8, 20, ah)
        rect(d, cx-8, 34, cx+8, 40, as_)
        rect(d, cx-2, 18, cx+2, 38, (150,40,44,255))       # แกนเรืองแดง
        rect(d, cx-11, 18, cx-8, 34, as_); rect(d, cx+8, 18, cx+11, 34, as_)  # แขน
        ellipse(d, cx-6, 2, cx+6, 16, (46,42,58,255))      # หมวกเกราะ/หน้า
        rect(d, cx-4, 8, cx-1, 11, (255,90,70,255)); rect(d, cx+1, 8, cx+4, 11, (255,90,70,255))  # ตาแดง
        # มงกุฎ
        for i in range(5):
            d.polygon([(cx-6+i*3,3),(cx-5+i*3,-3),(cx-4+i*3,3)], fill=(240,210,90,255))
        rect(d, cx-6, 2, cx+6, 4, (240,210,90,255))
    elif kind == "the_hollow":
        # ความว่างเปล่า — โพรงดำมีตาและวงแหวนแสง
        for rad in range(22, 6, -3):                       # วงแหวนพลัง
            col = (90+rad*3, 60, 140, 90)
            d.ellipse([cx-rad, cy_off(24)-rad, cx+rad, cy_off(24)+rad], outline=col, width=1)
        ellipse(d, cx-16, 8, cx+16, 40, (12,8,20,255))     # แกนดำ
        ellipse(d, cx-13, 11, cx+13, 37, (4,2,10,255))
        for (ex,ey,r) in ((cx-6,20,3),(cx+4,18,4),(cx-1,28,3),(cx+6,30,2)):  # ตาในความมืด
            ellipse(d, ex,ey,ex+r,ey+r,(180,120,255,255))
        # ริ้วพลังพุ่งออก
        for ang in (0,60,120,180,240,300):
            import math as _m
            dx=int(18*_m.cos(_m.radians(ang))); dy=int(18*_m.sin(_m.radians(ang)))
            d.line([(cx,24),(cx+dx,24+dy)], fill=(120,80,200,120), width=1)
    add_outline(img)
    return img

def cy_off(v): return v  # helper สำหรับความชัดเจน

ENEMY_KINDS = ["slime", "bat", "wolf", "goblin", "golem", "drake",
               "bramblewrath", "bog_horror", "nyx_duel", "vheron", "the_hollow"]
def build_enemies():
    cols = 2
    sheet = Image.new("RGBA", (E*cols, E*len(ENEMY_KINDS)), (0,0,0,0))
    layout = {}
    for i, k in enumerate(ENEMY_KINDS):
        for f in range(cols):
            cell = draw_enemy(k, f)
            sheet.paste(cell, (f*E, i*E), cell)
        layout[k] = i
    sheet.save(os.path.join(OUT, "enemies.png"))
    return {"cell": E, "frames": cols, "rows": layout, "idle": [0, 1]}

# ---------------- items ----------------
I = 32
def draw_item(item_id):
    img = new_cell(I, I); d = ImageDraw.Draw(img); c = 16
    if item_id in ("potion","hi_potion","ether","antidote"):
        liquid = {"potion":(230,60,80,255),"hi_potion":(240,120,60,255),
                  "ether":(80,150,240,255),"antidote":(110,200,110,255)}[item_id]
        rect(d, c-5, 12, c+5, 26, (210,225,235,180))       # ขวด
        d.pieslice([c-5,20,c+5,30], 0, 180, fill=(210,225,235,180))
        rect(d, c-5, 16, c+5, 26, liquid)
        d.pieslice([c-5,22,c+5,30], 0, 180, fill=liquid)
        rect(d, c-3, 17, c-1, 22, (255,255,255,150))       # ไฮไลต์
        rect(d, c-2, 8, c+2, 12, (150,110,70,255))         # จุก
        rect(d, c-3, 6, c+3, 8, (110,80,50,255))
    elif item_id in ("wood_sword","iron_sword"):
        blade = (150,110,70,255) if item_id=="wood_sword" else (205,212,222,255)
        bs = (110,80,50,255) if item_id=="wood_sword" else (150,158,170,255)
        for i in range(14):
            d.line([(c-6+i, 26-i),(c-4+i,26-i)], fill=blade)
        d.line([(24,4),(24,6)], fill=(255,255,255,200))
        rect(d, c-8, 20, c+2, 22, (120,90,50,255))         # การ์ด
        rect(d, c-6, 22, c-2, 28, (90,65,40,255))          # ด้าม
        rect(d, c-9, 26, c+1, 28, (90,65,40,255))
    elif item_id == "mythril_bow":
        d.arc([8,4,26,28], 300, 60, fill=(120,200,210,255), width=3)
        d.line([(22,7),(22,25)], fill=(235,235,215,255), width=1)
    elif item_id in ("leather_armor","iron_armor"):
        col = (150,100,60,255) if item_id=="leather_armor" else (120,132,152,255)
        colh = (190,140,90,255) if item_id=="leather_armor" else (180,192,208,255)
        cols_ = (110,74,44,255) if item_id=="leather_armor" else (80,90,112,255)
        d.polygon([(c,6),(c-9,10),(c-8,22),(c,28),(c+8,22),(c+9,10)], fill=col)
        d.polygon([(c,6),(c-9,10),(c-4,10),(c,16)], fill=colh)
        d.polygon([(c,16),(c+8,22),(c,28)], fill=cols_)
        rect(d, c-1, 10, c+1, 26, cols_)
    elif item_id == "slime_gel":
        d.pieslice([c-9,10,c+9,26], 180, 360, fill=(96,206,106,220))
        rect(d, c-9, 18, c+9, 24, (96,206,106,220))
        d.pieslice([c-9,20,c+9,28], 0, 180, fill=(96,206,106,220))
        ellipse(d, c-5,13,c-1,17,(190,255,190,230))
    elif item_id == "wolf_fang":
        d.polygon([(c,6),(c-4,24),(c,20),(c+4,24)], fill=(240,240,225,255))
        d.polygon([(c,6),(c,20),(c+4,24)], fill=(200,200,185,255))
    add_outline(img, (26,22,38,255))
    return img

ITEM_IDS = ["potion","hi_potion","ether","antidote","wood_sword","iron_sword",
            "mythril_bow","leather_armor","iron_armor","slime_gel","wolf_fang"]
def build_items():
    cols = 6
    rows = (len(ITEM_IDS)+cols-1)//cols
    sheet = Image.new("RGBA", (I*cols, I*rows), (0,0,0,0))
    layout = {}
    for i, iid in enumerate(ITEM_IDS):
        cx, cy = i % cols, i // cols
        cell = draw_item(iid)
        sheet.paste(cell, (cx*I, cy*I), cell)
        layout[iid] = [cx, cy]
    sheet.save(os.path.join(OUT, "items.png"))
    return {"cell": I, "cols": cols, "map": layout}

# ---------------- NPCs ----------------
def shade(c, f):
    return (min(255, int(c[0]*f)), min(255, int(c[1]*f)), min(255, int(c[2]*f)), c[3] if len(c) > 3 else 255)

def draw_npc(spec, frame):
    """NPC chibi (idle 2 เฟรม) — โครงเดียวกับฮีโร่ ปรับแต่งตาม spec"""
    img = new_cell(S, S); d = ImageDraw.Draw(img)
    body = spec["body"]; bs = spec.get("body_s", shade(body, .68)); bh = spec.get("body_h", shade(body, 1.25))
    sc = spec.get("skin", SKIN); scs = spec.get("skin_s", SKIN_S)
    bob = [0, -1][frame]
    cx = CX
    yo = spec.get("yoff", 0)               # ตัวเตี้ย (เด็ก/คนแคระ)
    hr = 9 if yo else 10
    hcy = 16 + bob + yo                     # จุดกลางหัว
    by0, by1 = 28 + bob + yo, 41 + bob      # ลำตัว
    boot = (58, 46, 40, 255)

    shadow(d, cx, 45, 10, 3, 92)
    # เป้สะพายหลัง (วาดก่อนตัว)
    if spec.get("acc") == "pack":
        rect(d, cx-9, by0+1, cx+9, by1-1, (110,78,44,255))
        rect(d, cx-9, by0+1, cx+9, by0+4, (140,100,60,255))
    # ขาสั้น + รองเท้า
    rect(d, cx-5, 38+bob, cx-1, 44+bob, bs); rect(d, cx+1, 38+bob, cx+5, 44+bob, bs)
    rect(d, cx-6, 43+bob, cx-1, 45+bob, boot); rect(d, cx+1, 43+bob, cx+6, 45+bob, boot)
    # เสื้อคลุม (วีรอน)
    if spec.get("cape"):
        d.polygon([(cx-7,by0),(cx-10,by1+3),(cx,by1),(cx+10,by1+3),(cx+7,by0)], fill=spec["cape"])
    # แขน + มือ
    rect(d, cx-9, by0+2, cx-6, by0+9, bs); rect(d, cx+6, by0+2, cx+9, by0+9, bs)
    rect(d, cx-9, by0+8, cx-6, by0+11, sc); rect(d, cx+6, by0+8, cx+9, by0+11, sc)
    # ลำตัว / เสื้อคลุมยาว
    if spec.get("robe"):
        d.polygon([(cx-7,by1-5),(cx-9,by1+2),(cx+9,by1+2),(cx+7,by1-5)], fill=body)
        rect(d, cx-9, by1, cx+9, by1+2, bs)
    rect(d, cx-7, by0, cx+7, by1, body)
    rect(d, cx-7, by0, cx+7, by0+3, bh)
    rect(d, cx-7, by1-3, cx+7, by1, bs)
    rect(d, cx-3, by0-1, cx+3, by0+2, bh)         # คอเสื้อ
    if spec.get("belt"):
        rect(d, cx-7, by1-6, cx+7, by1-4, spec["belt"])

    # หัวโต
    hx0, hy0, hx1, hy1 = cx-hr, hcy-hr, cx+hr, hcy+hr
    ellipse(d, hx0, hy0, hx1, hy1, sc)
    rect(d, hx0+2, hy1-4, hx1-2, hy1, scs)        # เงาคาง
    rect(d, hx0, hcy-1, hx0+1, hcy+2, scs); rect(d, hx1-1, hcy-1, hx1, hcy+2, scs)  # หู

    # ทรงผม/หมวก
    hs = spec.get("head", "hair"); hair = spec.get("hair", (90,60,40,255))
    if hs == "hood":
        d.pieslice([hx0-2, hy0-2, hx1+2, hy1+2], 180, 360, fill=body)
        rect(d, hx0-2, hcy-2, hx1+2, hcy+1, bs)
    elif hs == "hat_point":
        d.polygon([(cx, hcy-hr-12),(hx0-1, hcy-2),(hx1+1, hcy-2)], fill=body)
        d.polygon([(cx, hcy-hr-12),(cx, hcy-2),(hx1+1, hcy-2)], fill=bs)
        rect(d, hx0-1, hcy-3, hx1+1, hcy-1, bh)
    elif hs == "hat_wide":
        ellipse(d, hx0-4, hcy-2, hx1+4, hcy+3, shade(hair,1.0))
        d.pieslice([hx0, hy0-3, hx1, hy1-3], 180, 360, fill=hair)
    elif hs == "helm":
        d.pieslice([hx0-1, hy0-2, hx1+1, hy1], 180, 360, fill=(150,158,170,255))
        rect(d, hx0-1, hcy-3, hx1+1, hcy-1, (120,128,140,255))
        rect(d, cx-1, hcy-hr-2, cx+1, hcy-1, (120,128,140,255))   # สันหมวก
        if spec.get("plume"):
            rect(d, cx-1, hcy-hr-6, cx+1, hcy-hr-1, spec["plume"])
    elif hs == "cap":
        d.pieslice([hx0, hy0-1, hx1, hy1-3], 180, 360, fill=hair)
        rect(d, hx0, hcy-2, hx1+3, hcy, shade(hair,1.15))         # ปีกหมวก
    elif hs == "crown":
        d.pieslice([hx0-1, hy0-2, hx1+1, hy1], 180, 360, fill=(46,42,58,255))
        for i in range(5):
            d.polygon([(cx-6+i*3, hcy-hr),(cx-5+i*3, hcy-hr-5),(cx-4+i*3, hcy-hr)], fill=(240,210,90,255))
        rect(d, cx-6, hcy-hr, cx+6, hcy-hr+2, (240,210,90,255))
    else:  # hair
        d.pieslice([hx0-1, hy0-1, hx1+1, hy1], 180, 360, fill=hair)

    # เครา
    if spec.get("beard"):
        bc = spec["beard"]; blen = min(spec.get("beard_len", 6), 7)
        d.polygon([(cx-5, hcy+2),(cx+5, hcy+2),(cx+4, hcy+2+blen),(cx-4, hcy+2+blen)], fill=bc)
        rect(d, cx-5, hcy+1, cx+5, hcy+3, bc)
    # ตา
    eyes = spec.get("eyes", (44,38,52,255))
    if eyes == "blind":
        rect(d, cx-5, hcy, cx+5, hcy+2, (220,220,230,255))       # ผ้าปิดตา
    else:
        rect(d, cx-4, hcy, cx-2, hcy+2, eyes); rect(d, cx-4, hcy, cx-3, hcy+1, (255,255,255,255))
        rect(d, cx+2, hcy, cx+4, hcy+2, eyes); rect(d, cx+2, hcy, cx+3, hcy+1, (255,255,255,255))

    # อุปกรณ์ประจำตัว (มือขวา)
    acc = spec.get("acc")
    if acc == "staff":
        rect(d, cx+9, hcy-4, cx+11, by1, (140,95,55,255))
        oc = spec.get("orb", (95,225,255,255))
        ellipse(d, cx+7, hcy-9, cx+13, hcy-3, oc); ellipse(d, cx+8, hcy-8, cx+11, hcy-5, (230,255,255,255))
    elif acc == "sword":
        rect(d, cx+9, hcy, cx+11, by1-2, (205,212,222,255))
        rect(d, cx+7, by1-3, cx+13, by1-1, (120,90,50,255)); rect(d, cx+9, by1-1, cx+11, by1+3, (90,65,40,255))
    elif acc == "bow":
        d.arc([cx-13, hcy-4, cx-3, by1], 300, 60, fill=(150,110,60,255), width=2)
        d.line([(cx-4, hcy-2),(cx-4, by1-2)], fill=(230,230,210,255), width=1)
    elif acc == "hammer":
        rect(d, cx+9, hcy+2, cx+11, by1, (110,80,50,255))
        rect(d, cx+6, hcy-2, cx+14, hcy+4, (120,128,140,255)); rect(d, cx+6, hcy-2, cx+14, hcy, (170,178,190,255))
    elif acc == "crystal":
        d.polygon([(cx+10,hcy-6),(cx+7,hcy),(cx+10,hcy+6),(cx+13,hcy)], fill=(150,240,255,220))
        d.polygon([(cx+10,hcy-6),(cx+10,hcy+6),(cx+13,hcy)], fill=(90,180,220,220))
    elif acc == "dagger":
        d.line([(cx-9,by0+6),(cx-13,by0-2)], fill=(210,220,235,255), width=2)
        d.line([(cx+9,by0+6),(cx+13,by0+12)], fill=(210,220,235,255), width=2)
    add_outline(img)
    return img

NPC_SPECS = {
    "elder":   {"body": (92,104,150,255), "robe": True, "head": "hair", "hair": (235,235,240,255),
                "beard": (235,235,240,255), "beard_len": 9, "acc": "staff", "orb": (120,200,255,255), "belt": (60,50,90,255)},
    "guard":   {"body": (120,132,152,255), "head": "helm", "plume": (200,50,60,255),
                "beard": (90,66,44,255), "beard_len": 4, "acc": "sword", "belt": (70,60,50,255)},
    "merchant":{"body": (156,112,70,255), "head": "cap", "hair": (70,120,80,255),
                "beard": (80,60,40,255), "beard_len": 3, "acc": "pack"},
    "healer":  {"body": (232,226,208,255), "robe": True, "head": "hood",
                "acc": "staff", "orb": (255,225,120,255), "belt": (200,180,120,255)},
    "pip":     {"body": (92,158,96,255), "head": "cap", "hair": (200,70,60,255), "yoff": 5,
                "eyes": (40,35,45,255)},
    "isolde":  {"body": (74,148,86,255), "head": "hood", "acc": "bow", "belt": (90,66,40,255)},
    "grimm":   {"body": (150,100,60,255), "head": "hair", "hair": (120,90,60,255),
                "beard": (150,110,70,255), "beard_len": 11, "acc": "hammer", "belt": (90,66,40,255)},
    "maeve":   {"body": (120,78,190,255), "robe": True, "head": "hood", "eyes": "blind",
                "acc": "crystal", "belt": (200,180,90,255)},
    "nyx":     {"body": (48,44,72,255), "head": "hood", "eyes": (140,240,255,255), "acc": "dagger"},
    "vheron":  {"body": (60,56,74,255), "head": "crown", "cape": (110,30,38,255),
                "eyes": (255,90,70,255), "belt": (150,40,44,255)},
}
NPC_ORDER = ["elder","guard","merchant","healer","pip","isolde","grimm","maeve","nyx","vheron"]
def build_npcs():
    cols = 2
    sheet = Image.new("RGBA", (S*cols, S*len(NPC_ORDER)), (0,0,0,0))
    layout = {}
    for i, key in enumerate(NPC_ORDER):
        for f in range(cols):
            cell = draw_npc(NPC_SPECS[key], f)
            sheet.paste(cell, (f*S, i*S), cell)
        layout[key] = i
    sheet.save(os.path.join(OUT, "npcs.png"))
    return {"cell": S, "frames": cols, "rows": layout, "idle": [0, 1]}

# ---------------- tiles (2.5D) ----------------
T = 32
def dither(d, x0, y0, x1, y1, c, step=4):
    for y in range(y0, y1):
        for x in range(x0, x1):
            if (x + y) % step == 0:
                d.point((x, y), fill=c)

def draw_tile(kind):
    img = new_cell(T, T); d = ImageDraw.Draw(img)
    if kind == "grass":
        rect(d, 0,0,T,T,(74,132,72,255))
        dither(d,0,0,T,T,(90,152,84,255),3); dither(d,0,0,T,T,(60,112,60,255),5)
        for gx in (6,14,22,26):
            d.line([(gx,24),(gx,20)], fill=(110,176,96,255))
    elif kind == "wild":
        rect(d, 0,0,T,T,(88,120,58,255))
        dither(d,0,0,T,T,(104,140,68,255),3); dither(d,0,0,T,T,(70,100,46,255),4)
        for gx in (5,11,19,25):
            d.line([(gx,26),(gx,18)], fill=(130,160,80,255))
            d.line([(gx+2,26),(gx+2,20)], fill=(110,140,66,255))
    elif kind == "floor":
        rect(d, 0,0,T,T,(176,150,108,255))
        for by in range(0,T,8):
            for bx in range(0,T,8):
                ox = 4 if (by//8)%2 else 0
                d.rectangle([bx+ox,by,bx+ox+7,by+7], outline=(140,116,80,255))
        dither(d,0,0,T,T,(190,166,124,255),5)
    elif kind == "cave":
        rect(d, 0,0,T,T,(58,52,66,255))
        dither(d,0,0,T,T,(70,64,80,255),3); dither(d,0,0,T,T,(44,40,54,255),4)
        for (rx,ry) in ((6,8),(20,18),(12,24)):
            ellipse(d, rx,ry,rx+5,ry+3,(80,74,90,255))
    elif kind == "water":
        rect(d, 0,0,T,T,(52,110,178,255))
        rect(d, 0,0,T,T//2,(64,126,196,255))
        for wy in (6,16,26):
            d.arc([2,wy,14,wy+6],200,340,fill=(150,200,235,255),width=1)
            d.arc([18,wy+3,30,wy+9],200,340,fill=(120,180,220,255),width=1)
    elif kind == "tree":
        # ฐานหญ้า + ต้นไม้แบบมีมิติ (2.5D)
        rect(d, 0,0,T,T,(74,132,72,255)); dither(d,0,0,T,T,(60,112,60,255),4)
        ellipse(d, 6,26,26,31,(0,0,0,70))                  # เงา
        rect(d, 14,18,18,28,(96,66,42,255))                # ลำต้น
        rect(d, 14,18,15,28,(120,86,56,255))
        ellipse(d, 4,2,28,22,(48,116,58,255))              # พุ่ม
        ellipse(d, 6,3,22,17,(70,150,74,255))
        ellipse(d, 8,4,16,12,(96,180,96,255))
        dither(d,4,2,28,20,(40,100,50,255),3)
    elif kind == "wall":
        # บล็อกหินยกสูง 2.5D: หน้าบน + ด้านข้างเข้ม
        rect(d, 0,6,T,T,(74,72,92,255))                    # หน้าหน้า
        rect(d, 0,0,T,8,(104,102,124,255))                 # หน้าบน
        rect(d, 0,T-4,T,T,(52,50,68,255))                  # เงาล่าง
        rect(d, T-4,6,T,T,(56,54,72,255))                  # ด้านขวาเข้ม
        for by in range(8,T,8):
            d.line([(0,by),(T,by)], fill=(52,50,68,255))
        for i,bx in enumerate(range(0,T,10)):
            off = 5 if i%2 else 0
            d.line([(bx+off,8),(bx+off,T)], fill=(52,50,68,255))
    elif kind == "lava":
        # ลาวาเรืองแสง (เอมเบอร์พีค) — มีมิติด้วยขอบหินเข้ม + ฟองไฟ
        rect(d, 0,0,T,T,(70,40,32,255))                    # ขอบหินรอบ
        rect(d, 3,3,T-3,T-3,(196,66,30,255))               # เนื้อลาวา
        rect(d, 3,3,T-3,10,(240,140,50,255))               # ผิวบนสว่าง
        for (lx,ly,r) in ((8,14,3),(20,20,4),(14,24,2),(24,10,2)):
            ellipse(d, lx,ly,lx+r,ly+r,(255,210,90,255))   # ฟองไฟ
        dither(d,3,10,T-3,T-3,(150,40,24,255),3)
    elif kind == "snow":
        # หิมะ (ฟรอสต์สไปร์)
        rect(d, 0,0,T,T,(206,218,232,255))
        rect(d, 0,0,T,T//2,(224,234,246,255))              # ผิวบนสว่าง (2.5D)
        dither(d,0,0,T,T,(236,244,252,255),3); dither(d,0,0,T,T,(180,196,214,255),5)
        for (sx,sy) in ((7,20),(18,25),(24,16)):
            ellipse(d, sx,sy,sx+3,sy+2,(190,204,222,255))  # ก้อนหิมะ
    elif kind == "ice":
        # น้ำแข็งกั้นทาง — บล็อกยกสูง 2.5D โปร่งแสง
        rect(d, 0,6,T,T,(120,170,208,255))                 # หน้าหน้า
        rect(d, 0,0,T,8,(170,210,238,255))                 # หน้าบนสว่าง
        rect(d, 0,T-4,T,T,(88,130,168,255))                # เงาล่าง
        rect(d, T-4,6,T,T,(96,142,182,255))                # ด้านขวา
        d.line([(6,10),(14,26)], fill=(210,236,250,220), width=1)   # ประกายแวว
        d.line([(20,8),(24,24)], fill=(210,236,250,180), width=1)
    add_outline(img, (30,28,42,120))
    return img

TILE_KINDS = ["grass","tree","water","floor","wild","cave","wall","snow","ice","lava"]
def build_tiles():
    sheet = Image.new("RGBA", (T*len(TILE_KINDS), T), (0,0,0,0))
    layout = {}
    for i, k in enumerate(TILE_KINDS):
        cell = draw_tile(k)
        sheet.paste(cell, (i*T, 0), cell)
        layout[k] = i
    sheet.save(os.path.join(OUT, "tiles.png"))
    return {"cell": T, "map": layout}

# ---------------- run ----------------
manifest = {
    "heroes": build_heroes(),
    "weapons": build_gear("weapons", WEAPON_LOOK, draw_weapon),
    "armor": build_gear("armor", ARMOR_LOOK, draw_armor),
    "helmets": build_gear("helmets", HELMET_LOOK, draw_helmet),
    "shields": build_gear("shields", SHIELD_LOOK, draw_shield),
    "legs": build_gear("legs", LEGS_LOOK, draw_legs),
    "boots": build_gear("boots", BOOTS_LOOK, draw_boots),
    "enemies": build_enemies(),
    "items": build_items(),
    "npcs": build_npcs(),
    "tiles": build_tiles(),
}
with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
# emit เป็น JS ด้วย เพื่อให้ทำงานได้แม้เปิดแบบ file:// (fetch ใช้ไม่ได้)
with open(os.path.join(OUT, "manifest.js"), "w", encoding="utf-8") as f:
    f.write("window.SPRITE_MANIFEST = " + json.dumps(manifest, ensure_ascii=False) + ";\n")

# รันตัวประกอบทายล์ Kenney + สัตว์เลี้ยง ต่อท้าย (เขียนทับ tiles.png + เพิ่ม pets)
import subprocess, sys
_here = os.path.dirname(os.path.abspath(__file__))
for _t in ("gen_tiles.py", "gen_pets.py"):
    _p = os.path.join(_here, _t)
    if os.path.exists(_p):
        subprocess.run([sys.executable, _p], check=True)

print("Sprite sheets generated in", OUT)
for name in ("heroes","enemies","items","npcs","tiles"):
    im = Image.open(os.path.join(OUT, name+".png"))
    print(f"  {name}.png  {im.size[0]}x{im.size[1]}")
