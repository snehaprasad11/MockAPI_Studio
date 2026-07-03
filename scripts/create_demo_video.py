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
HERO_FONT = load_font(42, bold=True)


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


def make_landing_slide(output_path: Path) -> None:
    slide = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND)
    draw = ImageDraw.Draw(slide)
    draw.text((62, 52), "MockAPI Studio", font=SMALL_FONT, fill=CYAN)
    draw.text((62, 110), "Create mock endpoints,\ndocs, and test links\nin one workspace.", font=HERO_FONT, fill=INK)
    draw_wrapped(
        draw,
        "A full-stack developer SaaS for frontend teams that need realistic API responses before the backend is ready.",
        (64, 330),
        BODY_FONT,
        MUTED,
        58,
    )
    draw.rounded_rectangle((64, 438, 210, 486), radius=12, fill=CYAN)
    draw.text((92, 452), "Dashboard", font=SMALL_FONT, fill="#ffffff")
    draw.rounded_rectangle((228, 438, 380, 486), radius=12, fill=PANEL, outline="#cbd5e1")
    draw.text((258, 452), "Public docs", font=SMALL_FONT, fill=INK)

    draw_card(draw, (650, 92, 1170, 604))
    draw.text((690, 132), "Endpoint preview", font=TITLE_FONT, fill=INK)
    draw.rounded_rectangle((1030, 132, 1118, 166), radius=15, fill="#dcfce7")
    draw.text((1054, 139), "200", font=SMALL_FONT, fill="#047857")
    draw.rounded_rectangle((690, 210, 1130, 514), radius=14, fill=CODE)
    preview = [
        "GET /api/mock/demo-store/products",
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
    y = 242
    for line in preview:
        draw.text((724, y), line, font=CODE_FONT, fill="#e2e8f0")
        y += 26

    output_path.parent.mkdir(parents=True, exist_ok=True)
    slide.save(output_path)


def make_auth_workspace_slide(output_path: Path) -> None:
    slide = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND)
    draw = ImageDraw.Draw(slide)
    draw.text((54, 34), "Auth and workspace setup", font=TITLE_FONT, fill=INK)
    draw_wrapped(
        draw,
        "Users log in, create a project workspace, and keep mock endpoints grouped by frontend feature or app.",
        (56, 84),
        BODY_FONT,
        MUTED,
        98,
    )

    draw_card(draw, (80, 166, 560, 626))
    draw.text((122, 206), "Login", font=TITLE_FONT, fill=INK)
    for index, (label, value) in enumerate(
        [("Email", "demo@mockapi.local"), ("Password", "password123")]
    ):
        y = 278 + index * 92
        draw.text((122, y), label.upper(), font=SMALL_FONT, fill=MUTED)
        draw.rounded_rectangle((122, y + 28, 510, y + 72), radius=10, fill="#f8fafc", outline="#dbe3ef")
        draw.text((142, y + 40), value, font=BODY_FONT, fill=INK)
    draw.rounded_rectangle((122, 498, 510, 548), radius=12, fill=CYAN)
    draw.text((278, 512), "Continue", font=SMALL_FONT, fill="#ffffff")

    draw_card(draw, (650, 166, 1200, 626))
    draw.text((692, 206), "Create Workspace", font=TITLE_FONT, fill=INK)
    fields = [
        ("Workspace name", "Demo Store"),
        ("Public slug", "demo-store"),
        ("Description", "Mock APIs for ecommerce UI"),
    ]
    for index, (label, value) in enumerate(fields):
        y = 278 + index * 82
        draw.text((692, y), label.upper(), font=SMALL_FONT, fill=MUTED)
        draw.rounded_rectangle((692, y + 26, 1148, y + 64), radius=10, fill="#f8fafc", outline="#dbe3ef")
        draw.text((712, y + 34), value, font=SMALL_FONT, fill=INK)
    draw.rounded_rectangle((692, 538, 920, 586), radius=12, fill=INK)
    draw.text((730, 552), "Create workspace", font=SMALL_FONT, fill="#ffffff")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    slide.save(output_path)


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


def make_endpoint_builder_slide(output_path: Path) -> None:
    slide = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND)
    draw = ImageDraw.Draw(slide)
    draw.text((54, 34), "Endpoint builder", font=TITLE_FONT, fill=INK)
    draw_wrapped(
        draw,
        "Each endpoint stores method, path, status code, response delay, JSON response, and optional error simulation.",
        (56, 84),
        BODY_FONT,
        MUTED,
        98,
    )

    draw_card(draw, (62, 152, 1218, 676))
    left = 94
    labels = [
        ("Method", "GET"),
        ("Path", "/products"),
        ("Endpoint name", "List products"),
        ("Status code", "200"),
        ("Delay in ms", "0"),
        ("Error simulation", "Optional 500/418 response"),
    ]
    for index, (label, value) in enumerate(labels):
        col = index % 2
        row = index // 2
        x = left + col * 440
        y = 196 + row * 88
        draw.text((x, y), label.upper(), font=SMALL_FONT, fill=MUTED)
        draw.rounded_rectangle((x, y + 28, x + 360, y + 70), radius=10, fill="#f8fafc", outline="#dbe3ef")
        draw.text((x + 18, y + 39), value, font=BODY_FONT, fill=INK)

    draw.text((94, 488), "JSON response", font=BODY_FONT, fill=INK)
    draw.rounded_rectangle((94, 520, 650, 662), radius=14, fill=CODE)
    json_lines = ['{', '  "id": 1,', '  "name": "Launch Kit",', '  "inStock": true', '}']
    y = 540
    for line in json_lines:
        draw.text((122, y), line, font=CODE_FONT, fill="#e2e8f0")
        y += 20
    draw.rounded_rectangle((750, 552, 1066, 606), radius=12, fill="#ecfeff", outline="#67e8f9")
    draw.text((782, 570), "Generate with local Ollama", font=BODY_FONT, fill=CYAN)

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


def make_docs_openapi_slide(output_path: Path, openapi_url: str) -> None:
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
    draw.text((54, 34), "Public docs and OpenAPI export", font=TITLE_FONT, fill=INK)
    draw_wrapped(
        draw,
        "Generated docs explain each mock endpoint, while OpenAPI JSON gives teams a machine-readable contract.",
        (56, 84),
        BODY_FONT,
        MUTED,
        98,
    )

    draw_card(draw, (62, 152, 590, 670))
    draw.text((92, 190), "PUBLIC API DOCS", font=SMALL_FONT, fill=CYAN)
    draw.text((92, 228), "Demo Store", font=TITLE_FONT, fill=INK)
    docs_rows = [
        ("GET", "/products", "List products", "200"),
        ("GET", "/orders/1001", "Get order detail", "200"),
    ]
    for index, (method, route, name, status) in enumerate(docs_rows):
        y = 310 + index * 116
        draw.rounded_rectangle((92, y, 542, y + 82), radius=12, fill="#f8fafc", outline="#dbe3ef")
        draw.rounded_rectangle((112, y + 18, 158, y + 42), radius=6, fill=INK)
        draw.text((121, y + 21), method, font=SMALL_FONT, fill="#ffffff")
        draw.text((178, y + 20), route, font=SMALL_FONT, fill=INK)
        draw.text((112, y + 52), name, font=SMALL_FONT, fill=MUTED)
        draw.text((500, y + 20), status, font=SMALL_FONT, fill=CYAN)

    panel = (630, 152, 1218, 670)
    draw.rounded_rectangle(panel, radius=14, fill=CODE)
    draw.text((660, 174), openapi_url, font=SMALL_FONT, fill="#67e8f9")

    y = 214
    for line in code.splitlines()[:21]:
        draw.text((660, y), line, font=CODE_FONT, fill="#e2e8f0")
        y += 22

    output_path.parent.mkdir(parents=True, exist_ok=True)
    slide.save(output_path)


def make_ai_database_slide(output_path: Path) -> None:
    slide = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND)
    draw = ImageDraw.Draw(slide)
    draw.text((54, 34), "Local AI and MySQL persistence", font=TITLE_FONT, fill=INK)
    draw_wrapped(
        draw,
        "Optional Ollama generation helps draft sample JSON, while MySQL stores users, workspaces, endpoints, and request logs.",
        (56, 84),
        BODY_FONT,
        MUTED,
        98,
    )

    draw_card(draw, (80, 166, 590, 626))
    draw.text((122, 206), "Ollama sample JSON", font=TITLE_FONT, fill=INK)
    draw.rounded_rectangle((122, 268, 548, 430), radius=14, fill=CODE)
    prompt_lines = [
        "POST /api/ollama/sample",
        "",
        "Endpoint: GET /products",
        "Description: Product cards",
        "",
        "Returns JSON-only examples",
    ]
    y = 296
    for line in prompt_lines:
        draw.text((150, y), line, font=CODE_FONT, fill="#e2e8f0")
        y += 22
    draw.rounded_rectangle((122, 500, 390, 552), radius=12, fill="#ecfeff", outline="#67e8f9")
    draw.text((154, 516), "No paid API required", font=BODY_FONT, fill=CYAN)

    draw_card(draw, (690, 166, 1200, 626))
    draw.text((732, 206), "MySQL schema", font=TITLE_FONT, fill=INK)
    tables = [
        ("users", "identity and password hash"),
        ("workspaces", "project-level API collections"),
        ("endpoints", "method, path, JSON, delay, errors"),
        ("request_logs", "runtime calls and responses"),
    ]
    for index, (table, detail) in enumerate(tables):
        y = 282 + index * 72
        draw.rounded_rectangle((732, y, 1152, y + 50), radius=12, fill="#f8fafc", outline="#dbe3ef")
        draw.text((754, y + 15), table, font=SMALL_FONT, fill=INK)
        draw.text((902, y + 15), detail, font=SMALL_FONT, fill=MUTED)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    slide.save(output_path)


def make_summary_slide(output_path: Path) -> None:
    slide = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND)
    draw = ImageDraw.Draw(slide)
    draw.text((54, 34), "Feature checklist", font=TITLE_FONT, fill=INK)
    draw_wrapped(
        draw,
        "The demo covers the complete project surface area from setup to runtime behavior.",
        (56, 84),
        BODY_FONT,
        MUTED,
        98,
    )

    features = [
        "Landing page and portfolio positioning",
        "Register/login with signed HTTP-only sessions",
        "Workspace creation and seeded Demo Store data",
        "Endpoint builder: method, path, status, delay, JSON",
        "Error response simulation",
        "Public mock URLs for frontend testing",
        "Dashboard metrics and request history",
        "Generated public docs and curl examples",
        "OpenAPI JSON export",
        "Optional local Ollama JSON generation",
        "MySQL schema and seed data",
    ]
    x_positions = [92, 690]
    for index, feature in enumerate(features):
        col = 0 if index < 6 else 1
        row = index if index < 6 else index - 6
        x = x_positions[col]
        y = 176 + row * 72
        draw.rounded_rectangle((x, y, x + 490, y + 50), radius=14, fill=PANEL, outline="#dbe3ef")
        draw.rounded_rectangle((x + 18, y + 14, x + 48, y + 36), radius=8, fill="#dcfce7")
        draw.text((x + 25, y + 17), "OK", font=load_font(11, bold=True), fill="#047857")
        draw.text((x + 56, y + 15), feature, font=SMALL_FONT, fill=INK)

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


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ffmpeg", default=shutil.which("ffmpeg"))
    parser.add_argument("--openapi-url", default="http://localhost:3000/api/docs/demo-store/openapi")
    args = parser.parse_args()

    if not args.ffmpeg:
        raise SystemExit("FFmpeg was not found. Pass --ffmpeg with the full ffmpeg.exe path.")

    root = Path(__file__).resolve().parents[1]
    demo_dir = root / "docs" / "demo"
    slide_dir = demo_dir / "slides"

    slides: list[Path] = []
    landing_slide = slide_dir / "slide-01.png"
    make_landing_slide(landing_slide)
    slides.append(landing_slide)

    auth_workspace_slide = slide_dir / "slide-02.png"
    make_auth_workspace_slide(auth_workspace_slide)
    slides.append(auth_workspace_slide)

    endpoint_builder_slide = slide_dir / "slide-03.png"
    make_endpoint_builder_slide(endpoint_builder_slide)
    slides.append(endpoint_builder_slide)

    dashboard_slide = slide_dir / "slide-04.png"
    make_dashboard_mock_slide(dashboard_slide)
    slides.append(dashboard_slide)

    test_console_slide = slide_dir / "slide-05.png"
    make_test_console_slide(test_console_slide)
    slides.append(test_console_slide)

    docs_slide = slide_dir / "slide-06.png"
    make_docs_openapi_slide(docs_slide, args.openapi_url)
    slides.append(docs_slide)

    ai_database_slide = slide_dir / "slide-07.png"
    make_ai_database_slide(ai_database_slide)
    slides.append(ai_database_slide)

    summary_slide = slide_dir / "slide-08.png"
    make_summary_slide(summary_slide)
    slides.append(summary_slide)

    encode_video(slides, demo_dir / "mockapi-studio-demo.mp4", args.ffmpeg)


if __name__ == "__main__":
    main()
