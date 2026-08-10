"""allens app icon: a lens over a red allergen dot. Pure stdlib PNG writer."""
import math, os, struct, zlib, sys

SLATE = (0x0f, 0x17, 0x2a)
WHITE = (0xf8, 0xfa, 0xfc)
RED = (0xb9, 0x1c, 0x1c)

# artwork in a unit square, drawn as signed distance fields
LENS_C, LENS_R, RING_W = (0.455, 0.435), 0.235, 0.070
HANDLE_A = (0.455 + 0.235 * 0.707, 0.435 + 0.235 * 0.707)
HANDLE_B = (0.775, 0.755)
DOT_R = 0.095


def _annulus(px, py):
    d = math.hypot(px - LENS_C[0], py - LENS_C[1])
    return abs(d - LENS_R) - RING_W / 2


def _capsule(px, py):
    ax, ay = HANDLE_A
    bx, by = HANDLE_B
    vx, vy = bx - ax, by - ay
    t = ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)
    t = min(1.0, max(0.0, t))
    return math.hypot(px - ax - t * vx, py - ay - t * vy) - RING_W / 2


def _rrect(px, py, half=0.5, r=0.11):
    qx = abs(px - 0.5) - (half - r)
    qy = abs(py - 0.5) - (half - r)
    return math.hypot(max(qx, 0), max(qy, 0)) + min(max(qx, qy), 0) - r


def render(size, *, scale=1.0, tile=None):
    """tile: None = full-bleed slate, 'round' = rounded slate tile, 'clear' = no bg."""
    px = 1.0 / size
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            # sample point, mapped back through the artwork scale
            u = (x + 0.5) / size
            v = (y + 0.5) / size
            au = (u - 0.5) / scale + 0.5
            av = (v - 0.5) / scale + 0.5

            bg_a = {None: 1.0, "clear": 0.0}.get(tile, _cov(_rrect(u, v), px))
            r, g, b = SLATE
            a = bg_a

            spx = px / scale
            r, g, b, a = _over(WHITE, _cov(min(_annulus(au, av), _capsule(au, av)), spx), r, g, b, a)
            dot = math.hypot(au - LENS_C[0], av - LENS_C[1]) - DOT_R
            r, g, b, a = _over(RED, _cov(dot, spx), r, g, b, a)

            row += bytes((round(r), round(g), round(b), round(a * 255)))
        rows.append(bytes(row))
    return b"".join(rows)


def _cov(d, px):
    return min(1.0, max(0.0, 0.5 - d / px))


def _over(src, sa, r, g, b, a):
    if sa <= 0:
        return r, g, b, a
    out_a = sa + a * (1 - sa)
    f = lambda s, d: (s * sa + d * a * (1 - sa)) / out_a
    return f(src[0], r), f(src[1], g), f(src[2], b), out_a


def write_png(path, size, raw, alpha=True):
    if not alpha:  # iOS app icons must not carry an alpha channel
        stride = size * 4 + 1
        raw = b"".join(
            raw[r * stride : r * stride + 1]
            + b"".join(raw[p : p + 3] for p in range(r * stride + 1, (r + 1) * stride, 4))
            for r in range(size)
        )

    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c))

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6 if alpha else 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    open(path, "wb").write(png)
    print(path, size)


if __name__ == "__main__":
    out = sys.argv[1].rstrip("/")
    full = render(1024)
    write_png(f"{out}/icon.png", 1024, full)
    # ios/ is gitignored, so it only exists after a prebuild. When it doesn't,
    # the next prebuild will regenerate the slot from icon.png anyway.
    native = f"{out}/../ios/allens/Images.xcassets/AppIcon.appiconset"
    if os.path.isdir(native):
        write_png(f"{native}/App-Icon-1024x1024@1x.png", 1024, full, alpha=False)
    # adaptive foreground: art shrunk into Android's safe zone, bg comes from app.json
    write_png(f"{out}/adaptive-icon.png", 1024, render(1024, scale=0.62, tile="clear"))
    write_png(f"{out}/splash-icon.png", 512, render(512, scale=0.75, tile="round"))
    write_png(f"{out}/favicon.png", 48, render(48))
