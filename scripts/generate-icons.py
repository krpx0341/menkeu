#!/usr/bin/env python3
"""Regenerate Menkeu app icons from Han's supplied icon.

Source: public/brand/menkeu-icon-source.jpg — a red rounded square on a
black background (1125x1125). The black margin is NOT part of the icon, so
this script auto-crops to the red square's bounding box (non-black pixels),
then renders every size the app actually uses:

  src/app/icon.png            512x512  (Next.js app icon / favicon fallback)
  src/app/apple-icon.png      180x180  (iOS home-screen icon; iOS masks it)
  src/app/favicon.ico         16/32/48 (browser tab icon)
  public/icons/icon-192.png   192x192
  public/icons/icon-512.png   512x512
  public/icons/icon-maskable-192.png / icon-maskable-512.png
    (maskable = same full-bleed crop; the sprout/coin artwork sits centred,
    well inside Android's 80% safe zone, so the system crop only eats red)

Run from the repo root:  python3 scripts/generate-icons.py
Requires: Pillow (pip install Pillow). No other dependencies.
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "brand", "menkeu-icon-source.jpg")


def cropped_icon():
    im = Image.open(SRC).convert("RGB")
    # Bounding box of everything that is not (near-)black.
    gray = im.convert("L")
    bbox = gray.point(lambda p: 255 if p > 30 else 0).getbbox()
    if not bbox:
        raise SystemExit("source icon looks all-black, refusing to crop")
    x0, y0, x1, y1 = bbox
    # Force a square crop so no size gets a stretched icon.
    side = min(x1 - x0, y1 - y0)
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    return im.crop((cx - side // 2, cy - side // 2, cx + side // 2, cy + side // 2))


def save_png(im, rel_path, size):
    out = os.path.join(ROOT, rel_path)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.resize((size, size), Image.LANCZOS).save(out, "PNG")
    print(f"{rel_path}  {size}x{size}")


def main():
    icon = cropped_icon()
    print(f"cropped to {icon.size[0]}x{icon.size[0]}")
    save_png(icon, "src/app/icon.png", 512)
    save_png(icon, "src/app/apple-icon.png", 180)
    save_png(icon, "public/icons/icon-192.png", 192)
    save_png(icon, "public/icons/icon-512.png", 512)
    save_png(icon, "public/icons/icon-maskable-192.png", 192)
    save_png(icon, "public/icons/icon-maskable-512.png", 512)
    # Next.js/Turbopack decodes the ICO's embedded PNGs and requires RGBA —
    # an RGB ICO fails the build ("The PNG is not in RGBA format!").
    ico = os.path.join(ROOT, "src", "app", "favicon.ico")
    icon.convert("RGBA").resize((48, 48), Image.LANCZOS).save(
        ico, "ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"src/app/favicon.ico  16/32/48 (RGBA)")


if __name__ == "__main__":
    main()
