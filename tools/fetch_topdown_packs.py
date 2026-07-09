# -*- coding: utf-8 -*-
"""
Aetheria RPG — Top-down pack fetcher
ดาวน์โหลด asset ต้นทาง (ไม่ commit ลง git เพราะขนาดใหญ่):
  1) Zelda-like tilesets and sprites (ArMM1998, CC0) จาก OpenGameArt
  2) Ninja Adventure Asset Pack (Pixel-boy & AAA, CC0) จาก mirror GitHub
รันก่อน tools/build_topdown.py
"""
import os, subprocess, urllib.request, zipfile, shutil, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VENDOR = os.path.join(ROOT, "assets", "vendor")

ZELDA_URL = "https://opengameart.org/sites/default/files/gfx_3.zip"
NA_MIRROR = "https://github.com/MarioLDD/Kuroshiro-adventure.git"


def fetch_zelda():
    dest = os.path.join(VENDOR, "zelda-like")
    if os.path.exists(os.path.join(dest, "gfx", "Overworld.png")):
        print("zelda-like: cached")
        return
    os.makedirs(dest, exist_ok=True)
    zp = os.path.join(dest, "gfx.zip")
    urllib.request.urlretrieve(ZELDA_URL, zp)
    with zipfile.ZipFile(zp) as z:
        z.extractall(dest)
    print("zelda-like: downloaded")


def fetch_na():
    dest = os.path.join(VENDOR, "ninja-adventure-pack")
    if os.path.exists(os.path.join(dest, "Actor", "Characters")):
        print("ninja-adventure: cached")
        return
    tmp = tempfile.mkdtemp()
    subprocess.run(["git", "clone", "--depth", "1", "--filter=blob:none",
                    "--sparse", NA_MIRROR, tmp], check=True)
    subprocess.run(["git", "-C", tmp, "sparse-checkout", "set",
                    "Assets/NinjaAdventure"], check=True)
    src = os.path.join(tmp, "Assets", "NinjaAdventure")

    def ig(_d, names):
        return [n for n in names if n.endswith(".meta") or n in ("Musics", "Sounds")]
    if os.path.exists(dest):
        shutil.rmtree(dest)
    shutil.copytree(src, dest, ignore=ig)
    shutil.rmtree(tmp, ignore_errors=True)
    print("ninja-adventure: downloaded ->", dest)


if __name__ == "__main__":
    fetch_zelda()
    fetch_na()
