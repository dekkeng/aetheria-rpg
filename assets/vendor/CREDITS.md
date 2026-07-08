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

## Flare (flare-game) — CC-BY-SA 3.0

Isometric world art — tilesets (grassland, cave, dungeon, snowplains),
hero/equipment paper-doll layers, NPC and enemy sprites — is adapted from
**Flare: Empyrean Campaign** (https://github.com/flareteam/flare-game),
art by **Clint Bellanger** and the Flare team,
licensed under **Creative Commons Attribution-ShareAlike 3.0**
(https://creativecommons.org/licenses/by-sa/3.0/).

- Source atlases are fetched into `assets/vendor/flare/` by `tools/fetch_flare.py`
  (not committed — ~150 MB).
- `tools/build_flare_sheets.py` and `tools/build_flare_tiles.py` recompose them
  into the game's sheets under `assets/sprites/flare/`.
- Changes made: frame extraction/re-gridding, downscaling, color tints,
  and repacking into atlases. These derived sheets remain **CC-BY-SA 3.0**.

## Phaser 3 — MIT

The isometric world renderer uses **Phaser 3** (https://phaser.io),
© Photon Storm Ltd, MIT license. Vendored at `assets/vendor/phaser.min.js`.
