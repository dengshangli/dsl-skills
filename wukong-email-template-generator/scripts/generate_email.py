#!/usr/bin/env python3
import argparse
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path


SKILL_DIR = Path(__file__).resolve().parents[1]
TEMPLATE = SKILL_DIR / "assets" / "template.html"
PLACEHOLDER = "                邮件正文"
MINIFIER_PACKAGE = "html-minifier-terser@7.2.0"
MINIFIER_FLAGS = ["--collapse-whitespace", "--conservative-collapse"]


def fail(message: str) -> None:
    print(f"Error: {message}", file=sys.stderr)
    raise SystemExit(1)


def default_output() -> Path:
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return Path.cwd() / f"wukong-email-{timestamp}.html"


def minify_html(source: str) -> str:
    npx = shutil.which("npx")
    if not npx:
        fail("npx is required to run html-minifier-terser")

    result = subprocess.run(
        [npx, "--yes", MINIFIER_PACKAGE, *MINIFIER_FLAGS],
        input=source,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        detail = result.stderr.strip() or "unknown error"
        fail(f"html-minifier-terser failed: {detail}")
    if not result.stdout:
        fail("html-minifier-terser produced empty output")
    return result.stdout


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a new WuKong email by replacing only 邮件正文."
    )
    parser.add_argument("--body-file", required=True, type=Path)
    parser.add_argument(
        "--output",
        type=Path,
        help="New HTML path; defaults to a timestamped file in the current directory.",
    )
    args = parser.parse_args()

    template = TEMPLATE.resolve()
    output = (args.output or default_output()).expanduser().resolve()
    body_file = args.body_file.expanduser().resolve()

    if output == template:
        fail("output cannot be the source template")
    if output.exists():
        fail(f"output already exists: {output}")
    if output.suffix.lower() != ".html":
        fail("output must use the .html extension")
    if not body_file.is_file():
        fail(f"body file does not exist: {body_file}")

    source = template.read_text(encoding="utf-8")
    if source.count(PLACEHOLDER) != 1:
        fail("source template must contain exactly one 邮件正文 placeholder")

    body = body_file.read_text(encoding="utf-8")
    generated = source.replace(PLACEHOLDER, body, 1)
    minified = minify_html(generated)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(minified, encoding="utf-8")
    print("GENERATOR_EXECUTED=YES")
    print("MINIFIER_EXECUTED=YES")
    print(f"OUTPUT={output}")


if __name__ == "__main__":
    main()
