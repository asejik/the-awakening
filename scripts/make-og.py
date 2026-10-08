#!/usr/bin/env python3
"""Rebuilds public/og.jpg (1200x630 link preview) from brand/title-lockup.png.

Needs Pillow and two Google Fonts TTFs passed in (Lilita One, Barlow Condensed Bold Italic):
  python3 scripts/make-og.py LilitaOne-Regular.ttf BarlowCondensed-BoldItalic.ttf
Edit the text lines below for a new event.
"""
import math
import sys

from PIL import Image, ImageDraw, ImageFont

LILITA, BARLOW = sys.argv[1], sys.argv[2]
LINES_BIG = ['OCT. 24TH · 4PM', 'OCT. 25TH · 9AM']
LINES_SMALL = ['FREEDOM DOME, ILESANMI BUS STOP,', 'TANKE, ILORIN']

W, H, S = 1200, 630, 2
cream, ember, maroon, ink, paper = (250, 240, 220), (240, 90, 53), (78, 7, 16), (20, 10, 10), (255, 248, 246)
im = Image.new('RGB', (W * S, H * S), cream)
d = ImageDraw.Draw(im)

cx, cy, R = 350 * S, 315 * S, 420 * S
d.polygon([(cx + (R if i % 2 == 0 else R * 0.62) * math.cos(math.pi * i / 16 - math.pi / 2),
            cy + (R if i % 2 == 0 else R * 0.62) * math.sin(math.pi * i / 16 - math.pi / 2)) for i in range(32)], fill=ember)
d.ellipse((W * S - 170 * S, H * S - 120 * S, W * S + 60 * S, H * S + 90 * S), fill=maroon)
d.ellipse((-80 * S, -70 * S, 110 * S, 90 * S), fill=maroon)

t = Image.open('brand/title-lockup.png').convert('RGBA')
th = 490 * S
tw = int(t.width * th / t.height)
t = t.resize((tw, th), Image.LANCZOS)
im.paste(t, (cx - tw // 2, cy - th // 2 + 10 * S), t)

lil = ImageFont.truetype(LILITA, 56 * S)
big = ImageFont.truetype(BARLOW, 40 * S)
small = ImageFont.truetype(BARLOW, 32 * S)
x = 730 * S
w1 = d.textbbox((0, 0), 'FRESHERS', font=lil)[2]
d.rectangle((x - 18 * S, 70 * S, x + w1 + 18 * S, 206 * S), fill=maroon)
d.text((x, 78 * S), 'FRESHERS', font=lil, fill=cream)
d.text((x + (w1 - d.textbbox((0, 0), 'PLUG IN', font=lil)[2]) // 2, 140 * S), 'PLUG IN', font=lil, fill=cream)
y = 240 * S
for line in LINES_BIG:
    d.text((x, y), line, font=big, fill=ink)
    y += 52 * S
for line in LINES_SMALL:
    d.text((x, y), line, font=small, fill=ink)
    y += 42 * S

cta_font = lil.font_variant(size=44 * S)
cw = d.textbbox((0, 0), 'REGISTER FREE', font=cta_font)[2]
bx, by = x, 465 * S
d.rounded_rectangle((bx + 8 * S, by + 8 * S, bx + cw + 56 * S, by + 88 * S), 18 * S, fill=ink)
d.rounded_rectangle((bx, by, bx + cw + 48 * S, by + 80 * S), 18 * S, fill=paper, outline=ink, width=5 * S)
d.text((bx + 24 * S, by + 14 * S), 'REGISTER FREE', font=cta_font, fill=ink)

im.resize((W, H), Image.LANCZOS).save('public/og.jpg', 'JPEG', quality=84, optimize=True, progressive=True)
