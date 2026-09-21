#!/usr/bin/env python3
"""Generate the brand artwork SiteForge ships with: hero panel, gallery stills, social card.

    node tools/art-spec.mjs preset barber > /tmp/spec.json
    python3 tools/make-preset-art.py /tmp/spec.json

    node tools/art-spec.mjs client peaky-barbers > /tmp/spec.json
    python3 tools/make-preset-art.py /tmp/spec.json

Deliberately NOT photographs. These are brand panels built from the preset's own
colours, so a demo looks designed rather than templated, and nothing pretends a stock
photo is the business's own work. Real photos (or generated stills) drop into the same
slots: assets/clients/<slug>/ for one client, assets/presets/<preset>/ for a whole trade.

Needs Pillow, and only ever runs at asset-prep time. The build itself stays
zero-dependency: it just copies whatever is already in these folders.
"""
import json
import os
import random
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_DIR = "/usr/share/fonts/truetype/ubuntu"
FONT_CANDIDATES = {
    "bold": [f"{FONT_DIR}/Ubuntu-B.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"],
    "medium": [f"{FONT_DIR}/Ubuntu-M.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"],
    "regular": [f"{FONT_DIR}/Ubuntu-R.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"],
}


# --- colour helpers -------------------------------------------------------


def hex_to_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def mix(a, weight, b):
    """weight is how much of b to blend in, matching build.mjs mix()."""
    ca, cb = hex_to_rgb(a), hex_to_rgb(b)
    return tuple(round(ca[i] + (cb[i] - ca[i]) * weight) for i in range(3))


def luminance(colour):
    r, g, b = [c / 255 for c in colour]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def readable_on(background):
    return (255, 255, 255) if luminance(background) < 0.55 else (17, 17, 17)


WHITE = (255, 255, 255)


def rgba(colour, alpha):
    return (colour[0], colour[1], colour[2], max(0, min(255, int(alpha))))


def font(kind, size):
    for path in FONT_CANDIDATES[kind]:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


# --- canvas helpers -------------------------------------------------------


def gradient(size, top, bottom, vertical=True):
    w, h = size
    strip = Image.new("RGB", (1, h) if vertical else (w, 1))
    px = strip.load()
    for i in range(h if vertical else w):
        t = i / max(1, (h - 1) if vertical else (w - 1))
        colour = tuple(round(top[c] + (bottom[c] - top[c]) * t) for c in range(3))
        if vertical:
            px[0, i] = colour
        else:
            px[i, 0] = colour
    return strip.resize(size, Image.BILINEAR)


def glow(size, colour, radius_ratio=0.75, strength=0.55):
    """Soft accent bloom, pasted with a radial mask."""
    w, h = size
    radius = int(max(w, h) * radius_ratio)
    mask = Image.radial_gradient("L").resize((radius, radius), Image.BILINEAR)
    mask = mask.point(lambda v: int(255 * strength * (1 - v / 255) ** 2.1))
    layer = Image.new("RGBA", size, rgba(colour, 0))
    bloom = Image.new("RGBA", (radius, radius), rgba(colour, 255))
    bloom.putalpha(mask)
    return layer, bloom


def paste_bloom(canvas, bloom, centre):
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    x = int(centre[0] - bloom.width / 2)
    y = int(centre[1] - bloom.height / 2)
    layer.paste(bloom, (x, y), bloom)
    return Image.alpha_composite(canvas, layer)


def hairlines(canvas, spacing, alpha, colour=(255, 255, 255), vertical=True, width=1):
    w, h = canvas.size
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    span = w if vertical else h
    for pos in range(0, span, spacing):
        if vertical:
            draw.line([(pos, 0), (pos, h)], fill=rgba(colour, alpha), width=width)
        else:
            draw.line([(0, pos), (w, pos)], fill=rgba(colour, alpha), width=width)
    return Image.alpha_composite(canvas, layer)


def grain(canvas, sigma=7, alpha=16):
    noise = Image.effect_noise(canvas.size, sigma).convert("L")
    layer = Image.merge("RGBA", (noise, noise, noise, Image.new("L", canvas.size, alpha)))
    return Image.alpha_composite(canvas, layer)


def vignette(canvas, strength=110):
    w, h = canvas.size
    mask = Image.radial_gradient("L").resize((w, h), Image.BILINEAR)
    dark = Image.new("RGBA", (w, h), (0, 0, 0, 255))
    mask = mask.point(lambda v: int(strength * (v / 255) ** 2.4))
    dark.putalpha(mask)
    return Image.alpha_composite(canvas, dark)


def rounded_rect(draw, box, radius, **kwargs):
    draw.rounded_rectangle(box, radius=radius, **kwargs)


# --- motif line art (faceless, no fake results) ---------------------------


def draw_scissors(draw, cx, cy, scale, colour, width, rotation=0):
    """Simplified shears: two blades, two finger rings."""
    import math

    def rot(x, y):
        a = math.radians(rotation)
        dx, dy = x - cx, y - cy
        return (cx + dx * math.cos(a) - dy * math.sin(a), cy + dx * math.sin(a) + dy * math.cos(a))

    blade = scale * 1.0
    draw.line([rot(cx - blade * 0.1, cy - blade), rot(cx - scale * 0.02, cy + scale * 0.35)],
              fill=colour, width=width)
    draw.line([rot(cx + blade * 0.1, cy - blade), rot(cx + scale * 0.02, cy + scale * 0.35)],
              fill=colour, width=width)
    for side in (-1, 1):
        ring = scale * 0.30
        rcx, rcy = rot(cx + side * scale * 0.30, cy + scale * 0.62)
        draw.ellipse([rcx - ring, rcy - ring, rcx + ring, rcy + ring], outline=colour, width=width)


def draw_razor(draw, cx, cy, scale, colour, width):
    draw.line([(cx - scale, cy + scale * 0.55), (cx + scale, cy - scale * 0.35)],
              fill=colour, width=width)
    draw.line([(cx - scale * 0.62, cy + scale * 0.30), (cx + scale * 0.66, cy - scale * 0.62)],
              fill=colour, width=width)


def draw_comb(draw, cx, cy, scale, colour, width):
    draw.line([(cx - scale, cy - scale * 0.4), (cx + scale, cy - scale * 0.4)], fill=colour, width=width)
    teeth = 14
    for i in range(teeth + 1):
        x = cx - scale + (2 * scale) * i / teeth
        draw.line([(x, cy - scale * 0.4), (x, cy + scale * 0.4)], fill=colour, width=max(1, width - 1))


def draw_arcs(draw, cx, cy, count, start, end, colour, width, radius_step, gap=0):
    box_size = 0
    for i in range(count):
        r = radius_step * (i + 1) + gap * i
        draw.arc([cx - r, cy - r, cx + r, cy + r], start=start, end=end, fill=colour, width=width)
        box_size = r
    return box_size


# --- dimensional solids ----------------------------------------------------
# The panels used to be flat fills with 2px outlines, which is exactly how they
# read: a printed sheet. These helpers give the motif actual form. Every object is
# a solid with a light source, a cast shadow, and a place in depth, because the
# eye reads dimension from shading and occlusion long before it reads a picture.

LIGHT = (-0.45, -0.89)  # from above and slightly left, like a window


def centroid(points):
    n = len(points)
    return (sum(p[0] for p in points) / n, sum(p[1] for p in points) / n)


def shade(colour, factor):
    """Multiply toward black (factor < 1) or toward white (factor > 1)."""
    if factor <= 1:
        return tuple(max(0, min(255, round(c * factor))) for c in colour)
    t = min(1.0, factor - 1.0)
    return tuple(round(c + (255 - c) * t) for c in colour)


def wall_brightness(points, index):
    """Lambert-ish shading for the wall between two points of a polygon."""
    a, b = points[index], points[(index + 1) % len(points)]
    ex, ey = b[0] - a[0], b[1] - a[1]
    length = (ex * ex + ey * ey) ** 0.5 or 1.0
    # outward normal for a clockwise polygon, flipped to face away from the centre
    nx, ny = ey / length, -ex / length
    cx, cy = centroid(points)
    mx, my = (a[0] + b[0]) / 2 - cx, (a[1] + b[1]) / 2 - cy
    if nx * mx + ny * my < 0:
        nx, ny = -nx, -ny
    lit = max(0.0, -(nx * LIGHT[0] + ny * LIGHT[1]))
    return 0.42 + 0.78 * lit


def slab(draw, points, depth, base, tint=1.0):
    """A polygon with thickness: extruded walls plus a lit top face."""
    dx, dy = depth
    shifted = [(x + dx, y + dy) for x, y in points]
    draw.polygon(shifted, fill=shade(base, 0.30 * tint))
    for i in range(len(points)):
        a, b = points[i], points[(i + 1) % len(points)]
        quad = [a, b, (b[0] + dx, b[1] + dy), (a[0] + dx, a[1] + dy)]
        draw.polygon(quad, fill=shade(base, wall_brightness(points, i) * tint))
    draw.polygon(points, fill=shade(base, 1.16 * tint))


def disc_slab(draw, centre, radius, depth, base, hole=0.0, hole_colour=None):
    """A puck. `hole` punches a ring out of the top face, which is how the finger
    loops of a pair of shears get their form."""
    cx, cy = centre
    dx, dy = depth
    steps = 48
    import math

    ring = [(cx + radius * math.cos(2 * math.pi * i / steps), cy + radius * math.sin(2 * math.pi * i / steps))
            for i in range(steps)]
    slab(draw, ring, (dx, dy), base)
    if hole:
        inner = [(cx + radius * hole * math.cos(2 * math.pi * i / steps),
                  cy + radius * hole * math.sin(2 * math.pi * i / steps)) for i in range(steps)]
        draw.polygon([(x + dx, y + dy) for x, y in inner], fill=shade(base, 0.24))
        draw.polygon(inner, fill=hole_colour or shade(base, 0.55))
        draw.arc([cx - radius, cy - radius, cx + radius, cy + radius], 200, 340,
                 fill=shade(base, 1.55), width=max(2, int(radius // 7)))


def with_shadow(size, blur, alpha, offset, painter):
    """Draw a silhouette into its own layer, blur it, and lay it behind."""
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    painter(layer)
    alpha_band = layer.split()[3].point(lambda v: int(v * alpha / 255))
    layer.putalpha(alpha_band)
    if blur:
        layer = layer.filter(ImageFilter.GaussianBlur(blur))
    shadow = Image.new("RGBA", size, (0, 0, 0, 0))
    shadow.paste((8, 10, 14, 255), (0, 0), layer.split()[3])
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    out.paste(shadow, (int(offset[0]), int(offset[1])), shadow)
    return out


def shears(size, cx, cy, scale, depth, base, hole=None, rotation=0):
    """Extruded shears: two blades and two finger loops, drawn as solids."""
    import math

    def rot(x, y):
        a = math.radians(rotation)
        px, py = x - cx, y - cy
        return (cx + px * math.cos(a) - py * math.sin(a), cy + px * math.sin(a) + py * math.cos(a))

    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    art = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(art)

    blade_len, blade_w = scale * 1.02, scale * 0.115
    for side in (-1, 1):
        # A wider V at the tips: two narrow blades almost parallel read as a pole.
        tipx, tipy = rot(cx + side * scale * 0.30, cy - blade_len)
        basex, basey = rot(cx + side * scale * 0.035, cy + scale * 0.28)
        nx, ny = -(tipy - basey), (tipx - basex)
        ln = (nx * nx + ny * ny) ** 0.5 or 1.0
        nx, ny = nx / ln * blade_w, ny / ln * blade_w
        quad = [(basex + nx, basey + ny), (tipx + nx * 0.30, tipy + ny * 0.30),
                (tipx - nx * 0.30, tipy - ny * 0.30), (basex - nx, basey - ny)]
        slab(draw, quad, depth, base)
        # specular along the lit edge, so the blade is steel and not a bar
        edge = [(basex + nx * 0.86, basey + ny * 0.86), (tipx + nx * 0.24, tipy + ny * 0.24),
                (tipx + nx * 0.10, tipy + ny * 0.10), (basex + nx * 0.62, basey + ny * 0.62)]
        draw.polygon([(x + depth[0] * 0.6, y + depth[1] * 0.6) for x, y in edge], fill=shade(base, 1.75))

    # pivot
    pivot = rot(cx, cy + scale * 0.26)
    disc_slab(draw, pivot, scale * 0.075, depth, base)

    for side in (-1, 1):
        loop = rot(cx + side * scale * 0.32, cy + scale * 0.70)
        disc_slab(draw, loop, scale * 0.235, depth, base, hole=0.55,
                  hole_colour=hole or shade(base, 0.55))

    art = Image.alpha_composite(art, Image.new("RGBA", size, (0, 0, 0, 0)))
    layer = Image.alpha_composite(layer, art)
    return layer


def comb(size, cx, cy, scale, depth, base, hole=None, rotation=0):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    spine = [(cx - scale, cy - scale * 0.30), (cx + scale, cy - scale * 0.30),
             (cx + scale, cy + scale * 0.02), (cx - scale, cy + scale * 0.02)]
    slab(draw, spine, depth, base)
    teeth = 15
    for i in range(teeth):
        x = cx - scale * 0.94 + (scale * 1.88) * i / (teeth - 1)
        w = scale * 0.026
        tooth = [(x - w, cy + scale * 0.02), (x + w, cy + scale * 0.02),
                 (x + w * 0.7, cy + scale * 0.52), (x - w * 0.7, cy + scale * 0.52)]
        slab(draw, tooth, (depth[0] * 0.4, depth[1] * 0.4), base)
    return layer


def razor(size, cx, cy, scale, depth, base, hole=None, rotation=0):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    blade = [(cx - scale, cy + scale * 0.34), (cx + scale * 0.72, cy - scale * 0.06),
             (cx + scale * 0.86, cy - scale * 0.30), (cx - scale * 0.86, cy + scale * 0.12)]
    slab(draw, blade, depth, base)
    handle = [(cx - scale * 0.30, cy + scale * 0.22), (cx + scale * 0.52, cy + scale * 0.62),
              (cx + scale * 0.40, cy + scale * 0.80), (cx - scale * 0.42, cy + scale * 0.40)]
    slab(draw, handle, (depth[0] * 0.7, depth[1] * 0.7), shade(base, 0.82))
    return layer


# --- compositions ---------------------------------------------------------


def staged(canvas, size, ink, accent, hero_object, scale, centre, depth, hole=None, rotation=0,
           layers=(1.0, 0.32, 0.10)):
    """Composite an object three times: a blurred far copy, the subject, and a
    crisp near copy carrying the highlight. Depth of field is the cue that does
    the heavy lifting here, more than any single shadow."""
    w, h = size
    cx, cy = centre
    focus, mid_a, near_a = layers

    far_scale = scale * 0.72 * focus
    far_centre = (cx - w * 0.06, cy - h * 0.10)
    far = hero_object(size, far_centre[0], far_centre[1], far_scale, (depth[0] * 0.6, depth[1] * 0.6), ink, hole,
                      rotation=rotation)
    far.putalpha(far.split()[3].point(lambda v: int(v * mid_a)))
    canvas = Image.alpha_composite(canvas, far.filter(ImageFilter.GaussianBlur(16)))

    def silhouette(layer):
        shape = hero_object(size, cx, cy, scale, depth, ink, hole, rotation=rotation)
        layer.paste(shape, (0, 0), shape)

    shadow = with_shadow(size, 26, 150, (w * 0.02, h * 0.05), silhouette)
    canvas = Image.alpha_composite(canvas, shadow)

    subject = hero_object(size, cx, cy, scale, depth, ink, hole, rotation=rotation)
    canvas = Image.alpha_composite(canvas, subject.filter(ImageFilter.GaussianBlur(2.2)))

    near = hero_object(size, cx - w * 0.012, cy - h * 0.018, scale * 0.99, depth, accent, hole,
                       rotation=rotation)
    near.putalpha(near.split()[3].point(lambda v: int(v * near_a)))
    canvas = Image.alpha_composite(canvas, near)
    return canvas


def build_hero(spec):
    w, h = 1200, 800
    brand = spec["brand"]
    primary = hex_to_rgb(brand["primary"])
    accent = hex_to_rgb(brand["accent"])
    light = mix(brand["primary"], 0.16, "#ffffff")
    ink = mix(brand["primary"], 0.30, "#ffffff")

    canvas = gradient((w, h), mix(brand["primary"], 0.58, "#000000"), light).convert("RGBA")

    _, bloom = glow((w, h), accent, radius_ratio=0.85, strength=0.52)
    canvas = paste_bloom(canvas, bloom, (w * 0.84, h * 0.9))
    _, bloom2 = glow((w, h), accent, radius_ratio=0.5, strength=0.2)
    canvas = paste_bloom(canvas, bloom2, (w * 0.1, h * 0.08))
    canvas = hairlines(canvas, spacing=24, alpha=9)
    canvas = hairlines(canvas, spacing=120, alpha=15, width=2)

    canvas = staged(canvas, (w, h), ink, accent, shears, 240, (w * 0.71, h * 0.6), (32, 19),
                    hole=shade(hex_to_rgb(brand['primary']), 0.5), rotation=-16)

    art = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(art)
    draw_arcs(draw, w * 1.04, h * 0.04, 5, 120, 250, rgba(accent, 96), 5, 76, gap=22)
    draw.line([(w * 0.055, h * 0.15), (w * 0.055, h * 0.15 + 152)], fill=rgba(accent, 240), width=8)
    canvas = Image.alpha_composite(canvas, art)

    canvas = grain(canvas, sigma=6, alpha=14)
    return vignette(canvas, 84).convert("RGB")


def build_still(spec, variant):
    w, h = 800, 600
    brand = spec["brand"]
    accent = hex_to_rgb(brand["accent"])
    light = mix(brand["primary"], 0.12, "#ffffff")
    ink = mix(brand["primary"], 0.34, "#ffffff")

    canvas = gradient((w, h), mix(brand["primary"], 0.66, "#000000"), light).convert("RGBA")
    _, bloom = glow((w, h), accent, radius_ratio=0.72, strength=0.36)
    centre = [(w * 0.24, h * 0.84), (w * 0.82, h * 0.24), (w * 0.5, h * 0.5)][variant % 3]
    canvas = paste_bloom(canvas, bloom, centre)
    canvas = hairlines(canvas, spacing=28, alpha=8)

    if variant % 3 == 0:
        for i in range(9):
            t = i / 8
            x = w * 0.06 + i * w * 0.062
            draw_over = Image.new("RGBA", (w, h), (0, 0, 0, 0))
            ImageDraw.Draw(draw_over).line([(x, h * 1.05), (x + w * 0.34, -h * 0.05)],
                                           fill=rgba(accent, int(126 * (1 - t) + 18)),
                                           width=max(2, int(15 * (1 - t)) + 2))
            canvas = Image.alpha_composite(canvas, draw_over.filter(ImageFilter.GaussianBlur(1.4)))
        canvas = staged(canvas, (w, h), ink, accent, shears, 132, (w * 0.74, h * 0.46), (20, 12))
    elif variant % 3 == 1:
        art = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw_arcs(ImageDraw.Draw(art), w * 0.96, h * 0.1, 7, 95, 265, rgba(accent, 104), 5, 50, gap=15)
        canvas = Image.alpha_composite(canvas, art)
        canvas = staged(canvas, (w, h), ink, accent, razor, 150, (w * 0.36, h * 0.62), (22, 13))
    else:
        canvas = staged(canvas, (w, h), ink, accent, comb, 205, (w * 0.5, h * 0.46), (18, 11))
        art = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(art).line([(w * 0.24, h * 0.76), (w * 0.76, h * 0.76)], fill=rgba(accent, 170), width=5)
        canvas = Image.alpha_composite(canvas, art)

    canvas = grain(canvas, sigma=6, alpha=13)
    return vignette(canvas, 78).convert("RGB")


def build_card(spec):
    """The link preview. Typographic on purpose: legible when it is 300px wide in a text."""
    w, h = 1200, 630
    brand = spec["brand"]
    primary = hex_to_rgb(brand["primary"])
    accent = hex_to_rgb(brand["accent"])
    name = spec["business"]["name"]

    canvas = gradient((w, h), mix(brand["primary"], 0.52, "#000000"), mix(brand["primary"], 0.16, "#ffffff"))
    canvas = canvas.convert("RGBA")
    _, bloom = glow((w, h), accent, radius_ratio=0.8, strength=0.4)
    canvas = paste_bloom(canvas, bloom, (w * 0.9, h * 1.02))
    canvas = hairlines(canvas, spacing=30, alpha=8)

    art = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(art)
    # a faint oversized shears mark, cropped at the right edge
    draw_scissors(draw, w * 1.02, h * 0.26, 150, rgba(accent, 34), 7, rotation=-20)
    draw_arcs(draw, w * 0.02, h * 1.06, 4, 190, 350, rgba(accent, 30), 3, 62, gap=14)

    ink = readable_on(primary)
    muted = tuple(round(ink[i] + (primary[i] - ink[i]) * 0.42) for i in range(3))

    draw.line([(84, 74), (84, 74 + 54)], fill=rgba(accent, 255), width=8)
    letterspaced(draw, (110, 80), spec["label"].upper(), font("medium", 25), rgba(accent, 235), 3.4)

    name_font = font("bold", 74 if len(name) <= 18 else 60)
    draw.text((78, 156), name, font=name_font, fill=rgba(ink, 255))

    head_font = font("medium", 40)
    lines = wrap(draw, spec["hero"]["headline"], head_font, 900)[:2]
    y = 156 + name_font.size + 30
    for line in lines:
        draw.text((80, y), line, font=head_font, fill=rgba(ink, 205))
        y += 52

    chips = [t for t in spec.get("trust", [])][:4]
    chip_font = font("regular", 25)
    x = 80
    for label in chips:
        tw = draw.textlength(label, font=chip_font)
        rounded_rect(draw, [x, h - 116, x + tw + 40, h - 62], 27, fill=rgba(ink, 16), outline=rgba(accent, 90), width=2)
        draw.text((x + 20, h - 103), label, font=chip_font, fill=rgba(ink, 215))
        x += tw + 58

    phone = spec["business"].get("phone") or ""
    if phone:
        draw.text((80, h - 168), phone, font=font("bold", 31), fill=rgba(accent, 245))

    canvas = Image.alpha_composite(canvas, art)
    canvas = grain(canvas, sigma=6, alpha=12)
    return vignette(canvas, 120).convert("RGB")


# --- output ---------------------------------------------------------------


def save(image, path, fmt, **kwargs):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    image.save(path, fmt, **kwargs)
    size = os.path.getsize(path)
    rel = os.path.relpath(path, ROOT)
    print(f"  {rel:<52} {size / 1024:6.1f} KB")
    return {"file": os.path.basename(path), "width": image.width, "height": image.height, "bytes": size}


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    with open(sys.argv[1], "r", encoding="utf-8") as fh:
        spec = json.load(fh)

    random.seed(7)
    total = 0
    manifest = {"key": spec["key"], "mode": spec["mode"], "generated_by": "tools/make-preset-art.py"}
    print(f"\n{spec['mode']}: {spec['key']}")

    if spec["mode"] == "preset":
        out = os.path.join(ROOT, "assets", "presets", spec["key"])
        hero = save(build_hero(spec), os.path.join(out, "hero.webp"), "WEBP", quality=78, method=6)
        craft = [
            save(build_still(spec, variant), os.path.join(out, f"craft-{variant + 1}.webp"),
                 "WEBP", quality=76, method=6)
            for variant in range(3)
        ]
        total += hero["bytes"] + sum(item["bytes"] for item in craft)
        manifest["hero"] = hero
        manifest["craft"] = craft
    else:
        out = os.path.join(ROOT, "assets", "clients", spec["key"])
        og = save(build_card(spec), os.path.join(out, "og.jpg"), "JPEG", quality=84, optimize=True, progressive=True)
        total += og["bytes"]
        manifest["og"] = og

    # Dimensions sidecar, so the build can emit width/height (and so avoid layout
    # shift) without an image library or header parsing of its own.
    with open(os.path.join(out, "images.json"), "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
        fh.write("\n")

    print(f"  {'total':<52} {total / 1024:6.1f} KB")
    print(f"  {'manifest':<52} images.json\n")


if __name__ == "__main__":
    main()
