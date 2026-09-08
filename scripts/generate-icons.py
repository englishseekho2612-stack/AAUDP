#!/usr/bin/env python3
"""
Generate high-quality icon assets for Windows Electron build.
Outputs:
- electron/assets/icon.png (512x512)
- electron/assets/icon.ico (Windows multi-resolution ICO)
"""
import os
import subprocess
import math

WIDTH = 512
HEIGHT = 512

# Create pixel buffer (RGBA)
pixels = bytearray([0] * (WIDTH * HEIGHT * 4))

def blend_pixel(x, y, r, g, b, a):
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        idx = (y * WIDTH + x) * 4
        src_a = a / 255.0
        dst_a = pixels[idx + 3] / 255.0
        out_a = src_a + dst_a * (1.0 - src_a)
        if out_a > 0:
            out_r = (r * src_a + pixels[idx] * dst_a * (1.0 - src_a)) / out_a
            out_g = (g * src_a + pixels[idx + 1] * dst_a * (1.0 - src_a)) / out_a
            out_b = (b * src_a + pixels[idx + 2] * dst_a * (1.0 - src_a)) / out_a
            pixels[idx] = int(min(255, max(0, out_r)))
            pixels[idx + 1] = int(min(255, max(0, out_g)))
            pixels[idx + 2] = int(min(255, max(0, out_b)))
            pixels[idx + 3] = int(min(255, max(0, out_a * 255)))

# Draw anti-aliased circle
def draw_circle(cx, cy, radius, r, g, b, a=255, stroke_width=0, stroke_r=0, stroke_g=0, stroke_b=0):
    min_x = max(0, int(cx - radius - stroke_width - 2))
    max_x = min(WIDTH, int(cx + radius + stroke_width + 2))
    min_y = max(0, int(cy - radius - stroke_width - 2))
    max_y = min(HEIGHT, int(cy + radius + stroke_width + 2))
    
    for y in range(min_y, max_y):
        for x in range(min_x, max_x):
            dist = math.hypot(x - cx, y - cy)
            if stroke_width > 0:
                inner_r = radius - stroke_width / 2
                outer_r = radius + stroke_width / 2
                if inner_r - 1 <= dist <= outer_r + 1:
                    cov = min(1.0, max(0.0, 1.0 - abs(dist - radius) / (stroke_width / 2 + 1)))
                    blend_pixel(x, y, stroke_r, stroke_g, stroke_b, int(a * cov))
            else:
                if dist <= radius + 1:
                    cov = min(1.0, max(0.0, radius + 1 - dist))
                    blend_pixel(x, y, r, g, b, int(a * cov))

# Render background circular disc
cx, cy = 256, 256
draw_circle(cx, cy, 240, 14, 75, 62, 255) # Forest green outer ring #0E4B3E
draw_circle(cx, cy, 230, 255, 255, 255, 255) # Clean white inner circle
draw_circle(cx, cy, 222, 14, 75, 62, 255, stroke_width=8, stroke_r=14, stroke_g=75, stroke_b=62) # Emerald border

# Draw Cap polygon
def draw_triangle(p1, p2, p3, r, g, b, a=255):
    # bounding box
    min_x = max(0, int(min(p1[0], p2[0], p3[0])))
    max_x = min(WIDTH, int(max(p1[0], p2[0], p3[0]) + 1))
    min_y = max(0, int(min(p1[1], p2[1], p3[1])))
    max_y = min(HEIGHT, int(max(p1[1], p2[1], p3[1]) + 1))
    
    def sign(p, a, b):
        return (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1])
        
    for y in range(min_y, max_y):
        for x in range(min_x, max_x):
            pt = (x + 0.5, y + 0.5)
            d1 = sign(pt, p1, p2)
            d2 = sign(pt, p2, p3)
            d3 = sign(pt, p3, p1)
            has_neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
            has_pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
            if not (has_neg and has_pos):
                blend_pixel(x, y, r, g, b, a)

# Draw graduation cap diamond
draw_triangle((256, 75), (370, 120), (256, 165), 24, 36, 32, 255)
draw_triangle((256, 75), (142, 120), (256, 165), 24, 36, 32, 255)
# Cap skull
draw_triangle((200, 145), (312, 145), (256, 185), 17, 27, 23, 255)
# Orange tassel
draw_circle(256, 120, 7, 230, 81, 0, 255)
for tx in range(256, 350):
    ty = int(120 + 0.35 * (tx - 256) + 5 * math.sin((tx - 256) / 20.0))
    draw_circle(tx, ty, 3, 230, 81, 0, 255)
draw_circle(350, 160, 9, 230, 81, 0, 255)

# Draw central Book / "A"
# Left leg of A
draw_triangle((256, 175), (220, 290), (245, 290), 14, 75, 62, 255)
draw_triangle((256, 175), (245, 290), (262, 235), 14, 75, 62, 255)
# Right leg of A
draw_triangle((256, 175), (292, 290), (267, 290), 14, 75, 62, 255)
draw_triangle((256, 175), (267, 290), (250, 235), 14, 75, 62, 255)
# Crossbar
for y in range(250, 268):
    for x in range(232, 280):
        blend_pixel(x, y, 255, 255, 255, 255)

# Open Book Left Page
draw_triangle((250, 285), (120, 335), (246, 320), 14, 75, 62, 255)
draw_triangle((250, 325), (135, 365), (246, 350), 22, 107, 83, 255)
# Open Book Right Page
draw_triangle((262, 285), (392, 335), (266, 320), 14, 75, 62, 255)
draw_triangle((262, 325), (377, 365), (266, 350), 22, 107, 83, 255)

# Text banner Arpit Academy banner curve
# Save as uncompressed PAM / RGBA file
pam_path = "electron/assets/icon.pam"
with open(pam_path, "wb") as f:
    f.write(f"P7\nWIDTH {WIDTH}\nHEIGHT {HEIGHT}\nDEPTH 4\nMAXVAL 255\nTUPLTYPE RGB_ALPHA\nENDHDR\n".encode("ascii"))
    f.write(pixels)

# Convert PAM to PNG and ICO using ImageMagick
subprocess.run(["convert", pam_path, "electron/assets/icon.png"], check=True)
subprocess.run(["convert", "electron/assets/icon.png", "-define", "icon:auto-resize=256,128,64,48,32,16", "electron/assets/icon.ico"], check=True)
if os.path.exists(pam_path):
    os.remove(pam_path)

print("Icon assets successfully generated at electron/assets/icon.png and electron/assets/icon.ico")
