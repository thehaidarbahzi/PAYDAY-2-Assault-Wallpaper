#!/usr/bin/env python3
"""Render the static PAYDAY alert title as a transparent texture strip."""

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


# Start each tile with the title so the first letters enter from the right;
# the marker follows, and the trailing gap separates it from the next title.
TEXT = "POLICE ASSAULT IN PROGRESS       ///"
TRAILING_GAP = "       "


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--font", type=Path,
                        default=root / "assets/DINEngschrift.ttf",
                        help="DIN 1451 Engschrift .ttf/.otf file")
    parser.add_argument("--output", type=Path,
                        default=root / "assets/payday2-assault-banner-spaced-7.png")
    parser.add_argument("--width", type=int, default=4096,
                        help="maximum tile width in pixels")
    parser.add_argument("--height", type=int, default=256)
    parser.add_argument("--width-fill", type=float, default=0.93,
                        help="fraction of texture width occupied by the rendered text")
    parser.add_argument("--height-fill", type=float, default=0.58,
                        help="fraction of texture height occupied by the title")
    args = parser.parse_args()

    if not args.font.is_file():
        parser.error(f"font file not found: {args.font}")
    if args.width < 256 or args.height < 64:
        parser.error("texture dimensions must be at least 256x64")

    # Render large, then fit the glyph bounds to the reference's tall,
    # condensed title proportions while retaining antialiased edges.
    scale = 3
    font = ImageFont.truetype(str(args.font), args.height * scale)
    scratch = Image.new("RGBA", (args.width * scale * 3, args.height * scale * 2), (0, 0, 0, 0))
    draw = ImageDraw.Draw(scratch)
    bounds = draw.textbbox((0, 0), TEXT, font=font, stroke_width=0)
    draw.text((-bounds[0], -bounds[1]), TEXT, font=font, fill=(255, 255, 255, 255))
    glyph = scratch.crop((0, 0, bounds[2] - bounds[0], bounds[3] - bounds[1]))

    # Scale only vertically to set title height. Keep DIN's natural glyph
    # width, then append a fixed seven-space transparent gap. The image width
    # matches this tile exactly, so repeated copies have uniform spacing.
    target_height = round(args.height * args.height_fill)
    scale_to_target = target_height / glyph.height
    glyph = glyph.resize((round(glyph.width * scale_to_target), target_height), Image.Resampling.LANCZOS)
    gap_width = round(draw.textlength(TRAILING_GAP, font=font) * scale_to_target)
    gap_width = max(gap_width, 1)
    tile_width = glyph.width + gap_width
    max_width = round(args.width * args.width_fill)
    if tile_width > max_width:
        parser.error(f"rendered tile ({tile_width}px) exceeds width limit ({max_width}px); lower --height-fill")
    image = Image.new("RGBA", (tile_width, args.height), (0, 0, 0, 0))
    image.alpha_composite(glyph, (0, (args.height - glyph.height) // 2))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    image.save(args.output)
    print(f"Wrote {args.output} ({tile_width}x{args.height}) using {args.font}")


if __name__ == "__main__":
    main()
