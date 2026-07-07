# -*- coding: utf-8 -*-
"""
Aetheria RPG — Social Cover / OG Image Generator
สร้างภาพปกโซเชียล 1200x630 (og:image) + favicon PNG
โทนสีตามธีมเกม: ม่วงราตรี + ทองอีเธอร์ พร้อมมงกุฎที่แตกสลาย (The Sundered Crown)
ผลลัพธ์: assets/og-cover.png, assets/favicon-256.png
"""
import os, math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets")
os.makedirs(OUT, exist_ok=True)

W, H = 1200, 630

# ---- palette (จากธีมเกม) ----
BG      = (11, 10, 22)
GLOW1   = (36, 31, 69)
GLOW2   = (58, 44, 110)
GOLD_HI = (255, 224, 138)
GOLD    = (255, 204, 85)
GOLD_LO = (206, 150, 52)
ACCENT  = (166, 139, 255)
ACCENT2 = (123, 92, 255)
TEXT    = (236, 233, 255)
MUTED   = (154, 148, 196)

FONTS_DIR = r"C:\Windows\Fonts"

def font(candidates, size):
    for name in candidates:
        p = os.path.join(FONTS_DIR, name)
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

F_TITLE = font(["georgiab.ttf", "seguibl.ttf", "constanb.ttf", "impact.ttf"], 150)
F_SUB   = font(["georgiaz.ttf", "georgiai.ttf", "seguisbi.ttf", "georgia.ttf"], 40)
F_TAG   = font(["leelawui.ttf", "leelawad.ttf", "tahomabd.ttf", "tahoma.ttf"], 32)
F_BADGE = font(["leelawui.ttf", "tahoma.ttf", "segoeui.ttf"], 22)
F_URL   = font(["seguisb.ttf", "segoeui.ttf", "tahoma.ttf"], 22)

# ---------------- helpers ----------------
def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def text_w_tracked(draw, text, fnt, tracking):
    w = 0
    for ch in text:
        w += draw.textlength(ch, font=fnt) + tracking
    return w - tracking if text else 0

def draw_tracked(img_draw, xy, text, fnt, fill, tracking, center=True):
    """วาดข้อความพร้อม letter-spacing; คืน (x_start, width)"""
    total = text_w_tracked(img_draw, text, fnt, tracking)
    x, y = xy
    if center:
        x -= total / 2
    x0 = x
    for ch in text:
        img_draw.text((x, y), ch, font=fnt, fill=fill)
        x += img_draw.textlength(ch, font=fnt) + tracking
    return x0, total

def gradient_text(base, center_x, y, text, fnt, tracking, top, bot, glow=None):
    """วาดข้อความไล่เฉดแนวตั้ง + เรืองแสง ลงบน base (RGBA)"""
    tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    draw_tracked(td, (center_x, y), text, fnt, (255, 255, 255, 255), tracking, center=True)
    alpha = tmp.split()[3]
    bbox = alpha.getbbox()
    if not bbox:
        return
    # ไล่เฉดทอง
    grad = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gpx = grad.load()
    y0, y1 = bbox[1], bbox[3]
    for yy in range(y0, y1):
        t = (yy - y0) / max(1, (y1 - y0))
        c = lerp(top, bot, t)
        for xx in range(bbox[0], bbox[2]):
            gpx[xx, yy] = (c[0], c[1], c[2], 255)
    grad.putalpha(alpha)
    if glow:
        gl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        gd = ImageDraw.Draw(gl)
        draw_tracked(gd, (center_x, y), text, fnt, glow + (255,), tracking, center=True)
        gl = gl.filter(ImageFilter.GaussianBlur(18))
        base.alpha_composite(gl)
        base.alpha_composite(gl)
    base.alpha_composite(grad)

def radial_glow(size, color, strength=1.0):
    """สร้างจุดเรืองแสงวงกลมนุ่ม ๆ (วาดวงในเว้นขอบ เพื่อให้เบลอเป็นวงกลมจริง)"""
    g = Image.new("L", (size, size), 0)
    gd = ImageDraw.Draw(g)
    inset = size * 0.28
    gd.ellipse([inset, inset, size - inset, size - inset], fill=int(255 * strength))
    g = g.filter(ImageFilter.GaussianBlur(size * 0.16))
    col = Image.new("RGBA", (size, size), color + (0,))
    col.putalpha(g)
    return col

# ---------------- background ----------------
img = Image.new("RGBA", (W, H), BG + (255,))

# radial อีเธอร์กลางบน
glow = radial_glow(1500, GLOW2, 0.6)
img.alpha_composite(glow, (W // 2 - 750, -430))
glow2 = radial_glow(950, GLOW1, 0.8)
img.alpha_composite(glow2, (W // 2 - 475, -300))

# starfield / ผงอีเธอร์
import random
random.seed(7)
sd = ImageDraw.Draw(img)
for _ in range(140):
    x = random.randint(0, W); y = random.randint(0, H)
    r = random.choice([1, 1, 1, 2])
    c = random.choice([ACCENT, GOLD, ACCENT2, TEXT])
    a = random.randint(30, 140)
    sd.ellipse([x, y, x + r, y + r], fill=c + (a,))
# ผงเรืองแสงเม็ดใหญ่ไม่กี่เม็ด (วงกลมนุ่ม โปร่งบาง)
for _ in range(9):
    x = random.randint(90, W - 90); y = random.randint(70, H - 130)
    sz = random.randint(70, 130)
    img.alpha_composite(radial_glow(sz, random.choice([GOLD, ACCENT, ACCENT2]), 0.22),
                        (x - sz // 2, y - sz // 2))

# ---------------- The Sundered Crown ----------------
def crown_half(sign, s):
    """คืนจุดขอบครึ่งมงกุฎ (sign=-1 ซ้าย, +1 ขวา) รอบจุดกำเนิด (0,0) ที่ฐานกลาง
       s = scale (px). แกน y ชี้ลง"""
    bw = 170 * s      # ความกว้างครึ่งฐาน
    bh = 52 * s       # ความสูงแถบฐาน
    p_out = -96 * s   # ยอดแหลมด้านนอก
    p_mid = -150 * s  # ยอดแหลมกลาง (สูงสุด)
    v = -34 * s       # ก้นหว่างยอด
    # ไล่จากกลาง (บน) ออกไปด้านนอกแล้ววกลงฐาน — คูณ sign เพื่อมิเรอร์
    outline = [
        (0, p_mid),                # ยอดกลาง
        (bw * 0.30, v),            # หว่าง
        (bw * 0.62, p_out),        # ยอดนอก
        (bw, v * 0.4),             # ไหล่นอก
        (bw, bh),                  # มุมล่างนอก
        (0, bh),                   # มุมล่างกลาง
    ]
    return [(sign * x, y) for (x, y) in outline]

def draw_crown(base, cx, base_y, scale=1.0, split=14):
    """มงกุฎทองแตกเป็นสองซีก เยื้องออกจากกัน + อัญมณีอีเธอร์เรืองแสงตรงรอยแตก"""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for sign in (-1, 1):
        dx = cx + sign * split
        pts = [(dx + int(x), base_y + int(y)) for (x, y) in crown_half(sign, scale)]
        d.polygon(pts, fill=GOLD)
        # แถบฐานเข้มกว่าเล็กน้อย
        bw = int(170 * scale); bh = int(52 * scale)
        d.polygon([(dx, base_y + int(-6 * scale)), (dx + sign * bw, base_y + int(15 * scale)),
                   (dx + sign * bw, base_y + bh), (dx, base_y + bh)], fill=GOLD_LO)
        # ไฮไลต์ขอบบนสัน
        d.line(pts[:4], fill=GOLD_HI, width=max(2, int(3 * scale)))
    # ลูกแก้วทองบนยอดแหลม
    tips = []
    for sign in (-1, 1):
        dx = cx + sign * split
        for (x, y) in [crown_half(sign, scale)[0], crown_half(sign, scale)[2]]:
            tips.append((dx + int(x), base_y + int(y)))
    for (tx, ty) in tips:
        r = int(9 * scale)
        d.ellipse([tx - r, ty - r, tx + r, ty + r], fill=GOLD_HI)
        d.ellipse([tx - r + 2, ty - r + 2, tx + r - 3, ty + r - 3], fill=GOLD)
    base.alpha_composite(layer)
    # แสงอัญมณีอีเธอร์ตรงรอยแตก
    gs = int(300 * scale)
    base.alpha_composite(radial_glow(gs, ACCENT, 0.85), (cx - gs // 2, base_y - gs // 2 - int(20 * scale)))
    gd = ImageDraw.Draw(base)
    gr = int(24 * scale); gy = base_y - int(14 * scale)
    gd.polygon([(cx, gy - gr - int(14 * scale)), (cx + gr, gy),
                (cx, gy + gr + int(6 * scale)), (cx - gr, gy)], fill=ACCENT2)
    gd.polygon([(cx, gy - gr - int(14 * scale)), (cx + int(gr * 0.5), gy),
                (cx, gy + int(gr * 0.5)), (cx - int(gr * 0.5), gy)], fill=ACCENT)
    gd.line([(cx, gy - gr - int(14 * scale)), (cx, gy + gr + int(6 * scale))],
            fill=GOLD_HI + (150,), width=2)

draw_crown(img, W // 2, 150, scale=0.62, split=13)

# ---------------- title ----------------
gradient_text(img, W // 2, 250, "AETHERIA", F_TITLE, tracking=14,
              top=GOLD_HI, bot=GOLD_LO, glow=(150, 110, 40))

# subtitle
sd2 = ImageDraw.Draw(img)
draw_tracked(sd2, (W // 2, 420), "The Sundered Crown", F_SUB, ACCENT + (255,), 6, center=True)

# tagline (ไทย)
tag = "ตำนานผู้กล้าแห่งดินแดนอีเธอเรีย"
draw_tracked(sd2, (W // 2, 478), tag, F_TAG, TEXT + (235,), 1, center=True)

# ---------------- feature badges ----------------
badges = ["เว็บเกม RPG", "แฟนตาซีมืดหม่น", "มัลติเพลเยอร์เรียลไทม์"]
bd = ImageDraw.Draw(img)
gap = 16
widths = [text_w_tracked(bd, b, F_BADGE, 0) + 44 for b in badges]
total = sum(widths) + gap * (len(badges) - 1)
x = (W - total) / 2
by = 545
for b, bw in zip(badges, widths):
    bd.rounded_rectangle([x, by, x + bw, by + 40], radius=20,
                         fill=(123, 92, 255, 34), outline=ACCENT2 + (160,), width=1)
    tw = text_w_tracked(bd, b, F_BADGE, 0)
    bd.text((x + (bw - tw) / 2, by + 8), b, font=F_BADGE, fill=(200, 186, 255, 255))
    x += bw + gap

# ---------------- vignette ----------------
vig = Image.new("L", (W, H), 0)
vd = ImageDraw.Draw(vig)
vd.ellipse([-W * 0.25, -H * 0.3, W * 1.25, H * 1.3], fill=255)
vig = vig.filter(ImageFilter.GaussianBlur(120))
dark = Image.new("RGBA", (W, H), (5, 4, 12, 255))
dark.putalpha(Image.eval(vig, lambda p: 210 - int(p * 0.82)))
img.alpha_composite(dark)

# เส้นขอบทองบาง ๆ
bd2 = ImageDraw.Draw(img)
bd2.rectangle([6, 6, W - 7, H - 7], outline=(255, 204, 85, 40), width=2)

# ---------------- export ----------------
final = img.convert("RGB")
cover_path = os.path.join(OUT, "og-cover.png")
final.save(cover_path, "PNG", optimize=True)
print("saved:", cover_path, final.size)

# ---------------- favicon 256 (มงกุฎ+อัญมณีบนพื้นเข้ม) ----------------
fav = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
fd = ImageDraw.Draw(fav)
fd.rounded_rectangle([8, 8, 248, 248], radius=56, fill=(20, 17, 46, 255),
                     outline=(123, 92, 255, 255), width=6)
# มงกุฎ
cx, cy = 128, 150
pts = [(52, cy), (78, 96), (104, cy - 12), (128, 80),
       (152, cy - 12), (178, 96), (204, cy)]
fd.polygon(pts + [(204, cy + 34), (52, cy + 34)], fill=GOLD)
fd.rectangle([52, cy + 20, 204, cy + 44], fill=GOLD_LO)
for px, py in [(52, cy), (128, 80), (204, cy)]:
    fd.ellipse([px - 9, py - 9, px + 9, py + 9], fill=GOLD_HI)
# อัญมณี
fav.alpha_composite(radial_glow(150, ACCENT, 0.9), (128 - 75, cy - 75))
fd = ImageDraw.Draw(fav)
fd.polygon([(128, cy - 24), (150, cy + 4), (128, cy + 30), (106, cy + 4)], fill=ACCENT2)
fd.polygon([(128, cy - 24), (139, cy + 4), (128, cy + 16), (117, cy + 4)], fill=ACCENT)
fav_path = os.path.join(OUT, "favicon-256.png")
fav.save(fav_path, "PNG")
print("saved:", fav_path)
