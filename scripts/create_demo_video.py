from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import textwrap
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


WIDTH = 1280
HEIGHT = 720
BACKGROUND = "#f7f9fc"
INK = "#0f172a"
MUTED = "#64748b"
CYAN = "#0891b2"
PANEL = "#ffffff"
CODE = "#020617"


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


TITLE_FONT = load_font(34, bold=True)
BODY_FONT = load_font(20)
SMALL_FONT = load_font(16, bold=True)
CODE_FONT = load_font(18)


def draw_wrapped(draw: ImageDraw.ImageDraw, text: str, xy: tuple[int, int], font, fill: str, width: int) -> None:
    lines: list[str] = []
    for paragraph in text.splitlines():
        lines.extend(textwrap.wrap(paragraph, width=width) or [""])

    x, y = xy
    for line in lines:
        draw.text((x, y), line, font=font, fill=fill)
        y += font.size + 8


def crop_to_aspect(image: Image.Image, aspect_ratio: float, focus_y: float = 0.0) -> Image.Image:
    image = image.convert("RGB")
    current_ratio = image.width / image.height

    if current_ratio < aspect_ratio:
        crop_height = int(image.width / aspect_ratio)
        max_top = max(image.height - crop_height, 0)
        top = int(max_top * min(max(focus_y, 0.0), 1.0))
        return image.crop((0, top, image.width, top + crop_height))

    crop_width = int(image.height * aspect_ratio)
    left = max((image.width - crop_width) // 2, 0)
    return image.crop((left, 0, left + crop_width, image.height))


def fit_image(image: Image.Image, max_width: int, max_height: int) -> Image.Image:
    image = image.convert("RGB")
    ratio = min(max_width / image.width, max_height / image.height)
    return image.resize((int(image.width * ratio), int(image.height * ratio)))


def make_screenshot_slide(
    frame_path: Path,
    title: str,
    subtitle: str,
    output_path: Path,
    focus_y: float = 0.0,
) -> None:
    slide = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND)
    draw = ImageDraw.Draw(slide)
    draw.text((54, 34), title, font=TITLE_FONT, fill=INK)
    draw_wrapped(draw, subtitle, (56, 84), BODY_FONT, MUTED, 98)

    screenshot = crop_to_aspect(Image.open(frame_path), 1130 / 520, focus_y=focus_y)
    screenshot = fit_image(screenshot, 1130, 520)
    x = (WIDTH - screenshot.width) // 2
    y = 165
    draw.rounded_rectangle((x - 12, y - 12, x + screenshot.width + 12, y + screenshot.height + 12), radius=16, fill=PANEL)
    slide.paste(screenshot, (x, y))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    slide.save(output_path)


def draw_card(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill: str = PANEL) -> None:
    draw.rounded_rectangle(box, radius=16, fill=fill, outline="#dbe3ef", width=1)


def make_dashboard_mock_slide(output_path: Path) -> None:
    slide = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND)
    draw = ImageDraw.Draw(slide)
    draw.text((54, 34), "Workspace dashboard", font=TITLE_FONT, fill=INK)
    draw_wrapped(
        draw,
        "The dashboard shows workspace metrics, endpoints, recent requests, delays, and error scenarios.",
        (56, 84),
        BODY_FONT,
        MUTED,
        98,
    )

    draw_card(draw, (62, 152, 1218, 676))
    draw.rounded_rectangle((62, 152, 270, 676), radius=16, fill="#ecfeff")
    draw.text((92, 190), "MockAPI", font=SMALL_FONT, fill=CYAN)
    draw.text((92, 220), "Studio", font=TITLE_FONT, fill=INK)
    draw.text((92, 286), "Demo Store", font=BODY_FONT, fill=INK)
    draw.text((92, 318), "/demo-store", font=SMALL_FONT, fill=MUTED)
    draw.rounded_rectangle((92, 590, 230, 632), radius=10, fill=INK)
    draw.text((120, 601), "Open docs", font=SMALL_FONT, fill="#ffffff")

    draw.text((310, 190), "Workspace overview", font=TITLE_FONT, fill=INK)
    draw.text((310, 235), "Mock endpoints for an ecommerce storefront prototype.", font=BODY_FONT, fill=MUTED)

    metrics = [
        ("Endpoints", "2"),
        ("Recent requests", "5"),
        ("Success logs", "4"),
        ("Error logs", "1"),
        ("Avg delay", "0 ms"),
        ("Error scenarios", "0"),
    ]
    for index, (label, value) in enumerate(metrics):
        col = index % 3
        row = index // 3
        x = 310 + col * 285
        y = 290 + row * 112
        draw_card(draw, (x, y, x + 250, y + 86), fill="#f8fafc")
        draw.text((x + 18, y + 16), label.upper(), font=SMALL_FONT, fill=MUTED)
        draw.text((x + 18, y + 42), value, font=TITLE_FONT, fill=INK)

    draw.text((310, 532), "Endpoints", font=BODY_FONT, fill=INK)
    endpoint_rows = [
        ("GET", "/api/mock/demo-store/products", "List products"),
        ("GET", "/api/mock/demo-store/orders/1001", "Get order detail"),
    ]
    for index, (method, route, name) in enumerate(endpoint_rows):
        y = 565 + index * 48
        draw.rounded_rectangle((310, y, 1128, y + 36), radius=10, fill="#f8fafc", outline="#dbe3ef")
        draw.rounded_rectangle((326, y + 7, 372, y + 29), radius=6, fill=INK)
        draw.text((335, y + 8), method, font=SMALL_FONT, fill="#ffffff")
        draw.text((392, y + 8), route, font=SMALL_FONT, fill=INK)
        draw.text((900, y + 8), name, font=SMALL_FONT, fill=MUTED)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    slide.save(output_path)


def make_test_console_slide(output_path: Path) -> None:
    slide = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND)
    draw = ImageDraw.Draw(slide)
    draw.text((54, 34), "Testable mock endpoints", font=TITLE_FONT, fill=INK)
    draw_wrapped(
        draw,
        "A stored JSON response is served through a public mock URL and logged in request history.",
        (56, 84),
        BODY_FONT,
        MUTED,
        98,
    )

    draw_card(draw, (62, 152, 1218, 676))
    draw.rounded_rectangle((92, 190, 148, 224), radius=8, fill=INK)
    draw.text((107, 196), "GET", font=SMALL_FONT, fill="#ffffff")
    draw.text((166, 195), "/api/mock/demo-store/products", font=BODY_FONT, fill=INK)
    draw.rounded_rectangle((1014, 190, 1102, 224), radius=14, fill="#dcfce7")
    draw.text((1040, 196), "200", font=SMALL_FONT, fill="#047857")

    draw.text((92, 265), "Test Console", font=TITLE_FONT, fill=INK)
    draw.rounded_rectangle((92, 318, 720, 622), radius=14, fill=CODE)
    console = [
        "Status: 200 OK",
        "Time: 42 ms",
        "",
        "[",
        "  {",
        '    "id": 1,',
        '    "name": "Launch Kit",',
        '    "price": 49,',
        '    "inStock": true',
        "  }",
        "]",
    ]
    y = 346
    for line in console:
        draw.text((122, y), line, font=CODE_FONT, fill="#e2e8f0")
        y += 24

    draw.text((770, 265), "Request History", font=TITLE_FONT, fill=INK)
    logs = [
        ("GET", "/products", "200", "just now"),
        ("GET", "/orders/1001", "200", "2 min ago"),
        ("POST", "/cart", "418", "5 min ago"),
    ]
    for index, (method, route, status, time) in enumerate(logs):
        y = 318 + index * 82
        draw.rounded_rectangle((770, y, 1138, y + 58), radius=12, fill="#f8fafc", outline="#dbe3ef")
        draw.text((792, y + 18), method, font=SMALL_FONT, fill=INK)
        draw.text((858, y + 18), route, font=SMALL_FONT, fill=MUTED)
        draw.text((1010, y + 18), status, font=SMALL_FONT, fill=CYAN if status == "200" else "#e11d48")
        draw.text((1068, y + 18), time, font=SMALL_FONT, fill=MUTED)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    slide.save(output_path)


def make_openapi_slide(output_path: Path, openapi_url: str) -> None:
    with urllib.request.urlopen(openapi_url, timeout=10) as response:
        document = json.loads(response.read().decode("utf-8"))

    excerpt = {
        "openapi": document["openapi"],
        "info": document["info"],
        "servers": document["servers"],
        "paths": {
            "/products": document["paths"].get("/products", {}),
        },
    }
    code = json.dumps(excerpt, indent=2)

    slide = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND)
    draw = ImageDraw.Draw(slide)
    draw.text((54, 34), "OpenAPI export", font=TITLE_FONT, fill=INK)
    draw_wrapped(
        draw,
        "Every workspace also exposes machine-readable OpenAPI JSON for docs, testing, and frontend handoff.",
        (56, 84),
        BODY_FONT,
        MUTED,
        98,
    )

    panel = (62, 152, 1218, 670)
    draw.rounded_rectangle(panel, radius=14, fill=CODE)
    draw.text((86, 174), openapi_url, font=SMALL_FONT, fill="#67e8f9")

    y = 214
    for line in code.splitlines()[:21]:
        draw.text((86, y), line, font=CODE_FONT, fill="#e2e8f0")
        y += 22

    output_path.parent.mkdir(parents=True, exist_ok=True)
    slide.save(output_path)


def encode_video(slides: list[Path], output_path: Path, ffmpeg_path: str) -> None:
    concat_path = output_path.parent / "slides.txt"
    lines: list[str] = []
    for slide in slides:
        lines.append(f"file '{slide.as_posix()}'")
        lines.append("duration 3.4")
    lines.append(f"file '{slides[-1].as_posix()}'")
    concat_path.write_text("\n".join(lines), encoding="utf-8")

    output_path.unlink(missing_ok=True)
    subprocess.run(
        [
            ffmpeg_path,
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_path),
            "-vf",
            "fps=30,format=yuv420p",
            "-movflags",
            "+faststart",
            str(output_path),
        ],
        check=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ffmpeg", default=shutil.which("ffmpeg"))
    parser.add_argument("--openapi-url", default="http://localhost:3000/api/docs/demo-store/openapi")
    args = parser.parse_args()

    if not args.ffmpeg:
        raise SystemExit("FFmpeg was not found. Pass --ffmpeg with the full ffmpeg.exe path.")

    root = Path(__file__).resolve().parents[1]
    demo_dir = root / "docs" / "demo"
    frame_dir = demo_dir / "frames"
    slide_dir = demo_dir / "slides"

    slides: list[Path] = []
    screenshot_specs = [
        ("01-landing.png", "MockAPI Studio", "A full-stack developer SaaS for creating fake REST APIs before the backend is ready.", "slide-01.png"),
        ("02-auth.png", "Cookie-based authentication", "Users register or log in before managing private mock API workspaces.", "slide-02.png"),
    ]
    for filename, title, subtitle, slide_name in screenshot_specs:
        output = slide_dir / slide_name
        make_screenshot_slide(frame_dir / filename, title, subtitle, output)
        slides.append(output)

    dashboard_slide = slide_dir / "slide-03.png"
    make_dashboard_mock_slide(dashboard_slide)
    slides.append(dashboard_slide)

    test_console_slide = slide_dir / "slide-04.png"
    make_test_console_slide(test_console_slide)
    slides.append(test_console_slide)

    docs_slide = slide_dir / "slide-05.png"
    make_screenshot_slide(
        frame_dir / "05-public-docs.png",
        "Generated public docs",
        "Every workspace gets a shareable documentation page with routes, responses, and curl commands.",
        docs_slide,
    )
    slides.append(docs_slide)

    openapi_slide = slide_dir / "slide-06.png"
    make_openapi_slide(openapi_slide, args.openapi_url)
    slides.append(openapi_slide)

    encode_video(slides, demo_dir / "mockapi-studio-demo.mp4", args.ffmpeg)


if __name__ == "__main__":
    main()
