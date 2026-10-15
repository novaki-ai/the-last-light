# Visual asset provenance

All shipped raster art in `public/assets/images/` was created for this game with the supplied `varlik image` command. No stock art, downloaded images, copied reference images, or other image generator was used. The Novaki reference images were supplied to `varlik` with its `--novaki` option for the hero sprite, title illustration, and ending illustration.

The visual direction is hand-painted ink and gouache storybook fantasy: dark teal forest stone, amber lanterns, cream details, deep blue submerged mosaics, and black iron celestial furnaces. Character identity follows the supplied references: chunky wooden matchstick, oversized charcoal head, smoke curl, round crooked glasses, white gloves, and black shoes.

| File | Dimensions | Role |
| --- | --- | --- |
| `title.webp` | 1792 × 1024 | Wide lantern forest title illustration; clear dark left half for menu text |
| `ending.webp` | 1792 × 1024 | Dawn and rekindled lantern ending illustration; clear left half for text |
| `novaki.png` | 256 × 384 | Transparent full-body hero sprite |
| `boss1.png` | 512 × 512 | Briar Warden, root-and-lantern forest guardian |
| `boss2.png` | 512 × 512 | Mother of Tides, spectral drowned-archive matriarch |
| `boss3.png` | 512 × 512 | Hollow Sun, celestial furnace deity |
| `floor1.webp` | 768 × 768 | Subtle mossy forest flagstone floor |
| `floor2.webp` | 768 × 768 | Subtle submerged blue mosaic floor |
| `floor3.webp` | 768 × 768 | Subtle ash-and-bronze hexagonal furnace floor |
| `prop1.png` | 256 × 384 | Transparent mossy forest lantern shrine |
| `prop2.png` | 256 × 384 | Transparent drowned-archive book shrine |
| `prop3.png` | 256 × 384 | Transparent celestial furnace brazier |
| `enemy-sootling.png` | 256 × 256 | Round charcoal forest imp |
| `enemy-thornling.png` | 256 × 256 | Spiny botanical seed slinger |
| `enemy-embermoth.png` | 256 × 256 | Glowing moth with ember wing markings |
| `enemy-stump.png` | 256 × 256 | Heavy walking root stump |
| `enemy-drownling.png` | 256 × 256 | Pale watery archive ghost |
| `enemy-scribe.png` | 256 × 256 | Haunted flying book |
| `enemy-bell.png` | 256 × 256 | Brass diving bell with jellyfish legs |
| `enemy-jelly.png` | 256 × 256 | Spectral cyan jellyfish |
| `enemy-spark.png` | 256 × 256 | Jagged fiery imp |
| `enemy-sentinel.png` | 256 × 256 | Armored floating sun-shield knight |
| `enemy-comet.png` | 256 × 256 | Fiery dark crystal meteor |
| `enemy-priest.png` | 256 × 256 | Hooded sun cultist |

Transparent sprites used `varlik image --transparent --trim`. Minor residual magenta key spill around their edges was removed with standard chroma decontamination after generation; this changes only keyed edge pixels, not the generated artwork. Opaque backgrounds and illustrations are unchanged generator output.

Each set of four enemy images used its stage boss image as a `--ref` style reference, while asking for simpler silhouettes and exaggerated eyes that remain readable at small gameplay sizes.

Suggested rendering: tile floor textures under a dark color wash, use stage shrines sparingly behind actors, and draw soft contact shadows underneath sprites in code. The floor images were prompted as tileable; edge matching is approximate, so low-contrast treatment is helpful.
