from __future__ import annotations

import argparse
import shutil
import subprocess
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

WIDTH = 1280
HEIGHT = 720
BACKGROUND = "#f7f9fc"
INK = "#0f172a"
MUTED = "#64748b"
PANEL = "#ffffff"


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
    """Build one video slide from a real screenshot of the running app, with a caption overlay."""
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


def make_portrait_screenshot_slide(
    frame_path: Path,
    title: str,
    subtitle: str,
    output_path: Path,
) -> None:
    """Build a slide from a tall (portrait) screenshot by fitting it whole, not cropping it."""
    slide = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND)
    draw = ImageDraw.Draw(slide)
    draw.text((54, 34), title, font=TITLE_FONT, fill=INK)
    draw_wrapped(draw, subtitle, (56, 84), BODY_FONT, MUTED, 98)

    screenshot = fit_image(Image.open(frame_path), 420, 520)
    x = (WIDTH - screenshot.width) // 2
    y = 165
    draw.rounded_rectangle((x - 12, y - 12, x + screenshot.width + 12, y + screenshot.height + 12), radius=16, fill=PANEL)
    slide.paste(screenshot, (x, y))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    slide.save(output_path)


def encode_video(slides: list[Path], output_path: Path, ffmpeg_path: str) -> None:
    concat_path = output_path.parent / "slides.txt"
    lines: list[str] = []
    for slide in slides:
        lines.append(f"file '{slide.as_posix()}'")
        lines.append("duration 3.2")
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


# (frame filename in docs/demo/frames, title, subtitle, layout)
# layout is either a focus_y float (landscape screenshot, cropped to 16:9) or "portrait" (tall
# screenshot, shown whole rather than cropped).
SLIDE_SPECS: list[tuple[str, str, str, float | str]] = [
    ("01-landing.png", "MockAPI Studio", "Build fake REST APIs, generated docs, and shareable test links in one workspace.", 0.0),
    ("03-auth-filled.png", "Sign in in seconds", "Register or log in with a signed, HTTP-only session cookie — no third-party auth needed.", 0.0),
    ("04-dashboard-overview.png", "Workspace overview", "Every workspace shows live metrics: endpoints, requests, successes, errors, and average delay.", 0.0),
    ("04b-dashboard-full.png", "Build a mock endpoint", "Define method, path, status code, response delay, JSON body, and optional error simulation.", 0.35),
    ("05-test-console.png", "Test it instantly", "Every endpoint is a real, working URL. Test it and see the live status, timing, and JSON response.", 0.0),
    ("06-public-docs.png", "Auto-generated docs", "Every workspace gets human-readable docs with ready-to-run curl commands, generated automatically.", 0.0),
    ("07-openapi-json.png", "OpenAPI export", "A machine-readable OpenAPI 3.1 document for every workspace, ready to import into Postman or Swagger.", 0.0),
    ("09-tablet-dashboard.png", "Responsive on tablet", "The full dashboard adapts cleanly to tablet-sized screens.", "portrait"),
    ("11-mobile-dashboard.png", "...and on mobile", "No horizontal scrolling, no broken layouts — the same features work on any device.", "portrait"),
]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ffmpeg", default=shutil.which("ffmpeg"))
    args = parser.parse_args()

    if not args.ffmpeg:
        raise SystemExit("FFmpeg was not found. Pass --ffmpeg with the full ffmpeg.exe path.")

    root = Path(__file__).resolve().parents[1]
    demo_dir = root / "docs" / "demo"
    frame_dir = demo_dir / "frames"
    slide_dir = demo_dir / "slides"

    slides: list[Path] = []
    for index, (frame_name, title, subtitle, layout) in enumerate(SLIDE_SPECS, start=1):
        slide_path = slide_dir / f"slide-{index:02d}.png"
        if layout == "portrait":
            make_portrait_screenshot_slide(frame_dir / frame_name, title, subtitle, slide_path)
        else:
            make_screenshot_slide(frame_dir / frame_name, title, subtitle, slide_path, focus_y=layout)
        slides.append(slide_path)

    encode_video(slides, demo_dir / "mockapi-studio-demo.mp4", args.ffmpeg)


if __name__ == "__main__":
    main()
