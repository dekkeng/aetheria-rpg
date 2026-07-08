# -*- coding: utf-8 -*-
"""
Aetheria RPG — Flare sheet builder
แปลง packed atlas ของ flare-game (CC-BY-SA) เป็น sprite sheet แบบตาราง:
  แถว = ทิศ 8 ทิศ (ตามลำดับของ Flare), คอลัมน์ = เฟรม [stance 4, run 8]
เอาต์พุต: assets/sprites/flare/*.png + flare-manifest.json(.js)
รันหลัง tools/fetch_flare.py
"""
import os, json, re
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "vendor", "flare")
OUT = os.path.join(ROOT, "assets", "sprites", "flare")
os.makedirs(OUT, exist_ok=True)

SCALE = 0.75          # 128px logical -> 96px (พอสำหรับ tile จอ ~96px)

# ---------- parse Flare animation definition ----------
def parse_anim(path):
    """คืน dict: {section: {frames:n, duration:ms, frames_list:[(idx,dir,x,y,w,h,ox,oy)], image:file}}"""
    anims, cur = {}, None
    default_img = None
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("["):
                cur = line.strip("[]")
                anims.setdefault(cur, {"frames": 0, "duration": 0, "list": [], "image": None})
                continue
            k, _, v = line.partition("=")
            if k == "image":
                # image=path[,section]
                parts = v.split(",")
                if len(parts) == 2:
                    sec = parts[1].strip()
                    anims.setdefault(sec, {"frames": 0, "duration": 0, "list": [], "image": None})
                    anims[sec]["image"] = os.path.basename(parts[0].strip())
                else:
                    default_img = os.path.basename(parts[0].strip())
            elif cur and k == "frames":
                anims[cur]["frames"] = int(v)
            elif cur and k == "duration":
                anims[cur]["duration"] = int(re.sub(r"\D", "", v))
            elif cur and k == "frame":
                # frame=idx,dir,x,y,w,h,ox,oy[,imageKey]
                nums = [int(x) for x in v.split(",")[:8]]
                anims[cur]["list"].append(tuple(nums))
    for sec in anims.values():
        if sec["image"] is None:
            sec["image"] = default_img
    return anims

def load_img(folder, name, cache={}):
    key = folder + "/" + name
    if key not in cache:
        cache[key] = Image.open(os.path.join(SRC, folder, name)).convert("RGBA")
    return cache[key]

def sample(frames_list, want):
    """เลือกเฟรมให้ได้จำนวน want (สุ่มเว้นระยะเท่าๆ กัน)"""
    idxs = sorted(set(f[0] for f in frames_list))
    if len(idxs) <= want:
        return idxs
    step = len(idxs) / want
    return [idxs[int(i * step)] for i in range(want)]

def anim_frames(anims, section, want):
    """คืน [(frameIdx order), {(idx,dir): (x,y,w,h,ox,oy)}] ของ section"""
    sec = anims.get(section)
    if not sec or not sec["list"]:
        return None
    chosen = sample(sec["list"], want)
    table = {}
    for (idx, d, x, y, w, h, ox, oy) in sec["list"]:
        table[(idx, d)] = (x, y, w, h, ox, oy)
    return chosen, table, sec["image"]

# ---------- คำนวณ cell ครอบทุกเฟรม แล้วประกอบ sheet ----------
def build_sheet(layers, sections, cell=None, root=None, tint=None, scale=SCALE):
    """layers: [(folder, name)] ซ้อนล่างขึ้นบน (ใช้ anim def ของแต่ละ layer เอง)
       sections: [("stance",4),("run",8)] — ต่อคอลัมน์กัน
       คืน (sheet, cell, root, cols, meta)"""
    parsed = []
    for folder, name in layers:
        anims = parse_anim(os.path.join(SRC, folder, name + ".txt"))
        parsed.append((folder, name, anims))

    # หา extents รอบ root ครอบทุก layer/section/frame/dir
    L = T = R = B = 0
    plan = []   # [(sec, want, [per-layer (chosen, table, img)])]
    for sec, want in sections:
        per_layer = []
        for folder, name, anims in parsed:
            got = anim_frames(anims, sec, want)
            per_layer.append((folder, got))
        # ต้องมี layer หลัก (อันแรก) เป็นตัวกำหนดเฟรม
        if per_layer[0][1] is None:
            continue
        plan.append((sec, want, per_layer))
        for folder, got in per_layer:
            if got is None:
                continue
            chosen, table, _img = got
            for (idx, d), (x, y, w, h, ox, oy) in table.items():
                if idx not in chosen:
                    continue
                L = min(L, -ox); T = min(T, -oy)
                R = max(R, w - ox); B = max(B, h - oy)
    if cell is None:
        cw, ch = R - L, B - T
        root = (-L, -T)
        cell = (cw, ch)
    cols = sum(want for _s, want, _p in plan)

    sheet = Image.new("RGBA", (cell[0] * cols, cell[1] * 8), (0, 0, 0, 0))
    col0 = 0
    meta_secs = {}
    for sec, want, per_layer in plan:
        n = len(per_layer[0][1][0])
        meta_secs[sec] = {"start": col0, "frames": n}
        for li, (folder, got) in enumerate(per_layer):
            if got is None:
                continue
            chosen, table, imgname = got
            img = load_img(folder, imgname)
            lt = tint[li] if tint else None
            for ci, idx in enumerate(chosen):
                for d in range(8):
                    fr = table.get((idx, d))
                    if fr is None:
                        continue
                    x, y, w, h, ox, oy = fr
                    piece = img.crop((x, y, x + w, y + h))
                    if lt:
                        piece = tint_image(piece, lt)
                    px = (col0 + ci) * cell[0] + root[0] - ox
                    py = d * cell[1] + root[1] - oy
                    sheet.alpha_composite(piece, (max(0, px), max(0, py)))
        col0 += n

    if scale != 1.0:
        # ปัด cell เป็นจำนวนเต็มก่อน แล้ว resize ผืนเป็นทวีคูณพอดี
        # (กัน Phaser หั่นเฟรมเพี้ยนสะสมทีละครึ่ง px)
        ncell = (max(1, round(cell[0] * scale)), max(1, round(cell[1] * scale)))
        root = (round(root[0] * scale * ncell[0] / (cell[0] * scale)),
                round(root[1] * scale * ncell[1] / (cell[1] * scale)))
        cell = ncell
        sheet = sheet.resize((cell[0] * cols, cell[1] * 8), Image.LANCZOS)
    return sheet, cell, root, cols, meta_secs

def tint_image(img, rgb):
    """ย้อมสีทั้งชิ้น (คูณ) — ใช้แยกร่างตัวละครที่ใช้ sheet ร่วมกัน"""
    r, g, b = rgb
    px = img.load()
    out = img.copy(); po = out.load()
    for y in range(img.height):
        for x in range(img.width):
            pr, pg, pb, pa = px[x, y]
            po[x, y] = (pr * r // 255, pg * g // 255, pb * b // 255, pa)
    return out

# ---------- นิยามสิ่งที่ต้อง build ----------
HERO_SECTIONS = [("stance", 4), ("run", 8)]

BODY = [("avatar", "default_chest"), ("avatar", "default_legs"),
        ("avatar", "default_hands"), ("avatar", "default_feet")]

HEROES = {
    "warrior": BODY + [("avatar", "cloth_pants"), ("avatar", "cloth_shirt"),
                       ("avatar", "cloth_sandals"), ("avatar", "head_short")],
    "mage":    BODY + [("avatar", "mage_skirt"), ("avatar", "mage_vest"),
                       ("avatar", "cloth_sandals"), ("avatar", "head_bald")],
    "archer":  BODY + [("avatar", "leather_pants"), ("avatar", "cloth_shirt"),
                       ("avatar", "cloth_sandals"), ("avatar", "head_short")],
}
HERO_TINT = {   # ย้อมเฉพาะเสื้อ (index หลัง BODY: 0=กางเกง,1=เสื้อ)
    "warrior": {5: (255, 150, 140)},   # เสื้อแดงอิฐ
    "mage":    {},                     # ชุดเมจของแท้
    "archer":  {5: (150, 220, 150)},   # เสื้อเขียวป่า
}

GEAR = {   # game item id -> flare avatar layer
    "wood_sword":   "club",
    "iron_sword":   "shortsword",
    "flame_blade":  "greatsword",
    "frost_edge":   "longsword",
    "mythril_bow":  "greatbow",
    "leather_armor": "leather_chest",
    "iron_armor":    "chain_cuirass",
    "dragon_mail":   "plate_cuirass",
    "aether_robe":   "mage_vest",
    "leather_cap":  "leather_hood",
    "iron_helm":    "chain_coif",
    "wooden_shield": "buckler",
    "tower_shield":  "kite_shield",
    "padded_legs":  "cloth_pants",
    "iron_greaves": "chain_greaves",
    "leather_boots": "leather_boots",
    "swift_boots":   "chain_boots",
}
GEAR_TINT = {
    "flame_blade": (255, 160, 110),    # ดาบเพลิงอมส้ม
    "frost_edge":  (150, 200, 255),    # ดาบน้ำแข็งอมฟ้า
    "aether_robe": (190, 160, 255),    # เสื้อคลุมอีเธอร์อมม่วง
    "swift_boots": (150, 230, 190),
}

ENEMY_SECTIONS = [("stance", 4)]
ENEMIES = {   # game enemy id -> (folder, name, tint|None)
    "slime":        ("enemies", "antlion_small", (140, 230, 140)),
    "bat":          ("enemies", "wyvern_air", None),
    "wolf":         ("enemies", "antlion", None),
    "goblin":       ("enemies", "goblin", None),
    "golem":        ("enemies", "minotaur", (170, 175, 190)),
    "drake":        ("enemies", "wyvern_fire", None),
    "bramblewrath": ("enemies", "cursed_grave", (150, 220, 130)),
    "bog_horror":   ("enemies", "zombie", (170, 220, 160)),
    "nyx_duel":     ("enemies", "skeleton_mage", None),
    "vheron":       ("npcs", "knight", (220, 130, 120)),
    "the_hollow":   ("enemies", "skeleton_mage", (170, 140, 255)),
}

NPC_SECTIONS = [("stance", 4)]
NPCS = {
    "elder":    ("npcs", "peasant_man2", None),
    "guard":    ("npcs", "knight", None),
    "merchant": ("npcs", "wandering_trader", None),
    "healer":   ("npcs", "peasant_woman1", None),
    "pip":      ("npcs", "peasant_man1", None),
    "isolde":   ("npcs", "peasant_woman2", None),
    "grimm":    ("npcs", "guild_man", None),
    "maeve":    ("npcs", "peasant_woman1", (255, 200, 170)),
    "nyx":      ("npcs", "peasant_woman2", (170, 150, 220)),
    "vheron":   ("npcs", "knight", (220, 130, 120)),
}

PETS = {   # ใช้ sheet ศัตรู ย่อเล็กใน JS — เก็บเฉพาะ mapping
    "slime_pet": "slime", "bat_pet": "bat", "ghost_pet": "the_hollow",
    "spider_pet": "wolf", "snake_pet": "slime", "rat_pet": "wolf",
    "snowman_pet": "slime", "yeti_pet": "golem",
}


def main():
    manifest = {"cellNote": "rows = 8 flare directions", "heroes": {}, "gear": {},
                "enemies": {}, "npcs": {}, "pets": PETS,
                "anims": {"stance": {"frames": 4, "ms": 800},
                          "run": {"frames": 8, "ms": 533}}}

    # ---- ฮีโร่ + อุปกรณ์: ต้องใช้ cell/root เดียวกันเพื่อ overlay ตรงกัน ----
    # คำนวณ extents ร่วมจากทุก layer ที่เกี่ยว (base + gear ทุกชิ้น)
    all_layers = set()
    for lys in HEROES.values():
        all_layers.update(lys)
    for g in GEAR.values():
        all_layers.add(("avatar", g))
    _sheet, cell, root, _cols, _meta = build_sheet(
        sorted(all_layers), HERO_SECTIONS, scale=1.0)
    print("hero cell:", cell, "root:", root)

    for cls, layers in HEROES.items():
        tint = {i: c for i, c in HERO_TINT[cls].items()}
        tl = [tint.get(i) for i in range(len(layers))]
        sheet, c2, r2, cols, secs = build_sheet(layers, HERO_SECTIONS,
                                                cell=cell, root=root,
                                                tint=tl if any(tl) else None)
        sheet.save(os.path.join(OUT, "hero_%s.png" % cls))
        manifest["heroes"][cls] = {"file": "hero_%s.png" % cls}
        print("hero_%s.png" % cls, sheet.size)
    manifest["heroCell"] = {"w": c2[0], "h": c2[1], "rootX": r2[0], "rootY": r2[1],
                            "cols": cols, "secs": secs}

    for item, layer in GEAR.items():
        tint = GEAR_TINT.get(item)
        sheet, _c, _r, _cols, _secs = build_sheet(
            [("avatar", layer)], HERO_SECTIONS, cell=cell, root=root,
            tint=[tint] if tint else None)
        sheet.save(os.path.join(OUT, "gear_%s.png" % item))
        manifest["gear"][item] = {"file": "gear_%s.png" % item}
        print("gear_%s.png" % item, sheet.size)

    # ---- ศัตรู: cell แยกของใครของมัน ----
    for eid, (folder, name, tint) in ENEMIES.items():
        sheet, c, r, cols, secs = build_sheet(
            [(folder, name)], ENEMY_SECTIONS, tint=[tint] if tint else None)
        sheet.save(os.path.join(OUT, "enemy_%s.png" % eid))
        manifest["enemies"][eid] = {"file": "enemy_%s.png" % eid,
                                    "w": c[0], "h": c[1], "rootX": r[0], "rootY": r[1],
                                    "cols": cols, "secs": secs}
        print("enemy_%s.png" % eid, sheet.size)

    # ---- NPC ----
    for nid, (folder, name, tint) in NPCS.items():
        sheet, c, r, cols, secs = build_sheet(
            [(folder, name)], NPC_SECTIONS, tint=[tint] if tint else None)
        sheet.save(os.path.join(OUT, "npc_%s.png" % nid))
        manifest["npcs"][nid] = {"file": "npc_%s.png" % nid,
                                 "w": c[0], "h": c[1], "rootX": r[0], "rootY": r[1],
                                 "cols": cols, "secs": secs}
        print("npc_%s.png" % nid, sheet.size)

    with open(os.path.join(OUT, "flare-manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    with open(os.path.join(OUT, "flare-manifest.js"), "w", encoding="utf-8") as f:
        f.write("window.FLARE_MANIFEST = " + json.dumps(manifest, ensure_ascii=False) + ";\n")
    print("manifest written")


if __name__ == "__main__":
    main()
