# Third-party Assets

## Kenney — CC0 1.0 (Public Domain)

Tile and pet sprite art is composited from the following packs by Kenney (https://kenney.nl),
released under **Creative Commons CC0 1.0** (public domain — free for any use):

- **Tiny Town**  — grass, flowers, trees  (https://kenney.nl/assets/tiny-town)
- **Tiny Dungeon** — stone floor, brick wall, pet critters  (https://kenney.nl/assets/tiny-dungeon)
- **Tiny Ski**  — snow, ice, snow-creatures  (https://kenney.nl/assets/tiny-ski)

Source sheets are kept in `assets/vendor/*/Tilemap/tilemap_packed.png`.
`tools/gen_tiles.py` and `tools/gen_pets.py` slice/compose them into the game's
`assets/sprites/tiles.png` and `assets/sprites/pets.png`.

CC0 requires no attribution, but credit is included here as good practice.

## Zelda-like tilesets and sprites — CC0 1.0

World tiles (grass, water, cliffs, trees, paths) are adapted from
**"Zelda-like tilesets and sprites"** by **ArMM1998**
(https://opengameart.org/content/zelda-like-tilesets-and-sprites), CC0.
Source kept in `assets/vendor/zelda-like/`; recomposed (upscaled x3,
some color tints for snow/ice/lava/cave) by `tools/build_topdown.py`
into `assets/sprites/td/tiles.png`.

## Ninja Adventure Asset Pack — CC0 1.0

Player characters, NPCs, monsters, bosses, pets, and face portraits are
from the **Ninja Adventure Asset Pack** by **Pixel-boy and AAA**
(https://pixel-boy.itch.io/ninja-adventure-asset-pack), CC0.
Attribution is not required but appreciated — thanks for this fantastic pack!
Source is fetched into `assets/vendor/ninja-adventure-pack/` by
`tools/fetch_topdown_packs.py` (not committed — ~57 MB);
`tools/build_topdown.py` recomposes it into `assets/sprites/td/`.

## Phaser 3 — MIT

The isometric world renderer uses **Phaser 3** (https://phaser.io),
© Photon Storm Ltd, MIT license. Vendored at `assets/vendor/phaser.min.js`.
