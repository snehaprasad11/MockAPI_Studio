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


def fit_image(image: Image.Image, max_width: int, max_height: int) -> Image.Image:
    image = image.convert("RGB")
    ratio = min(max_width / image.width, max_height / image.height)
    return image.resize((int(image.width * ratio), int(image.height * ratio)))


def make_screenshot_slide(frame_path: Path, title: str, subtitle: str, output_path: Path) -> None:
    slide = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND)
    draw = ImageDraw.Draw(slide)
    draw.text((54, 34), title, font=TITLE_FONT, fill=INK)
    draw_wrapped(draw, subtitle, (56, 84), BODY_FONT, MUTED, 98)

    screenshot = fit_image(Image.open(frame_path), 1130, 520)
    x = (WIDTH - screenshot.width) // 2
    y = 165
    draw.rounded_rectangle((x - 12, y - 12, x + screenshot.width + 12, y + screenshot.height + 12), radius=16, fill=PANEL)
    slide.paste(screenshot, (x, y))
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

    slide_specs = [
        ("01-landing.png", "MockAPI Studio", "A full-stack developer SaaS for creating fake REST APIs before the backend is ready."),
        ("02-auth.png", "Cookie-based authentication", "Users register or log in before managing private mock API workspaces."),
        ("03-dashboard-overview.png", "Workspace dashboard", "The dashboard shows workspace metrics, endpoints, recent requests, delays, and error scenarios."),
        ("04-test-console.png", "Testable mock endpoints", "A stored JSON response is served through a public mock URL and logged in request history."),
        ("05-public-docs.png", "Generated public docs", "Every workspace gets a shareable documentation page with routes, responses, and curl commands."),
    ]

    slides: list[Path] = []
    for index, (filename, title, subtitle) in enumerate(slide_specs, start=1):
        output = slide_dir / f"slide-{index:02d}.png"
        make_screenshot_slide(frame_dir / filename, title, subtitle, output)
        slides.append(output)

    openapi_slide = slide_dir / "slide-06.png"
    make_openapi_slide(openapi_slide, args.openapi_url)
    slides.append(openapi_slide)

    encode_video(slides, demo_dir / "mockapi-studio-demo.mp4", args.ffmpeg)


if __name__ == "__main__":
    main()
