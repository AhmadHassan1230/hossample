# Credits, sources and status

## Content
- **Portfolio**: *HOUSE OF SULTANA catalog.pdf* (supplied by the owner, 1 Nov 2026). Project names, locations, typologies and years as printed. Images extracted with `tools/pdftool` → `tools/catalog.mjs` into `public/work/`.
- **Products / studio imagery**: public posts on instagram.com/houseofsultana.co, used with the owner's go-ahead for this demo (`tools/media.mjs` → `public/media/`). Usage approval from HoS still pending.
- **Contact**: WhatsApp +92 347 123 7775 (HoS Instagram bio + hosultana.com), confirmed by the owner. Address from hosultana.com.
- Short lines on projects/services are provisional copy written for the demo.

## 3D studio
- Room, furniture and props are built in code (`components/atelier/`). It is an artistic interpretation, not the real HoS office.
- **Poly Haven (CC0, public domain)** in `public/assets/ph/`: herringbone_parquet, plastered_wall_04, white_stucco, oak_veneer_01, wool_boucle, rough_linen, terrazzo_tiles (textures); pachira_aquatica_01, potted_plant_02, calathea_orbifolia_01, ceramic_vase_01 (models); belfast_sunset_puresky (HDRI).

## Fonts
- **BDO Grotesk** by LC Tipografi, SIL Open Font License (`app/fonts/bdo-grotesk/OFL.txt`).
- **Argentum Sans**, SIL Open Font License (via @fontsource/argentum-sans).
- **Bodoni Moda** (Google Fonts, OFL), used only inside the HoS logo mark.

## Debug switches (home page)
`?fx=0` post-processing off · `?ao=0` ambient occlusion off · `?refl=0` floor reflections off · `?dpr=1.5` fixed render scale.
