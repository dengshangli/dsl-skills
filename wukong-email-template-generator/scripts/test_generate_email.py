import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SKILL_DIR = Path(__file__).resolve().parents[1]
SCRIPT = SKILL_DIR / "scripts" / "generate_email.py"
TEMPLATE = SKILL_DIR / "assets" / "template.html"
PLACEHOLDER = "                邮件正文"
MINIFIER_COMMAND = [
    "npx",
    "--yes",
    "html-minifier-terser@7.2.0",
    "--collapse-whitespace",
    "--conservative-collapse",
]


class GenerateEmailTests(unittest.TestCase):
    def run_generator(
        self,
        body: str,
        output: Path | None,
        cwd: Path | None = None,
        env: dict[str, str] | None = None,
    ):
        base = output.parent if output else cwd
        assert base is not None
        body_file = base / "body.html"
        body_file.write_text(body, encoding="utf-8")
        command = [
            sys.executable,
            str(SCRIPT),
            "--body-file",
            str(body_file),
        ]
        if output:
            command.extend(["--output", str(output)])
        return subprocess.run(
            command,
            capture_output=True,
            text=True,
            cwd=cwd,
            env=env,
        )

    def minify(self, source: str) -> str:
        result = subprocess.run(
            MINIFIER_COMMAND,
            input=source,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        return result.stdout

    def test_creates_a_new_html_file_without_changing_template(self):
        original = TEMPLATE.read_bytes()
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "campaign.html"
            result = self.run_generator("<h1>Hello</h1>", output)

            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue(output.exists())
            self.assertEqual(TEMPLATE.read_bytes(), original)

    def test_only_replaces_the_email_body_placeholder(self):
        template = TEMPLATE.read_text(encoding="utf-8")
        before, after = template.split(PLACEHOLDER)
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "campaign.html"
            body = "<h1>Hello</h1>\n<p>World</p>"
            result = self.run_generator(body, output)

            self.assertEqual(result.returncode, 0, result.stderr)
            generated = output.read_text(encoding="utf-8")
            self.assertEqual(generated, self.minify(before + body + after))

    def test_refuses_to_overwrite_template(self):
        with tempfile.TemporaryDirectory() as tmp:
            body_file = Path(tmp) / "body.html"
            body_file.write_text("<p>Forbidden</p>", encoding="utf-8")
            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--body-file",
                    str(body_file),
                    "--output",
                    str(TEMPLATE),
                ],
                capture_output=True,
                text=True,
            )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("source template", result.stderr)

    def test_refuses_to_overwrite_an_existing_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "existing.html"
            output.write_text("keep me", encoding="utf-8")
            result = self.run_generator("<p>Forbidden</p>", output)

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("already exists", result.stderr)
            self.assertEqual(output.read_text(encoding="utf-8"), "keep me")

    def test_defaults_output_to_the_users_current_directory(self):
        with tempfile.TemporaryDirectory() as tmp:
            cwd = Path(tmp)
            result = self.run_generator("<p>Hello</p>", None, cwd)

            self.assertEqual(result.returncode, 0, result.stderr)
            output_line = next(
                line for line in result.stdout.splitlines() if line.startswith("OUTPUT=")
            )
            output = Path(output_line.removeprefix("OUTPUT="))
            self.assertEqual(output.parent, cwd.resolve())
            self.assertTrue(output.is_file())

    def test_success_output_proves_the_generator_executed(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "campaign.html"
            result = self.run_generator("<p>Hello</p>", output)

            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("GENERATOR_EXECUTED=YES", result.stdout)
            self.assertIn("MINIFIER_EXECUTED=YES", result.stdout)
            self.assertIn(f"OUTPUT={output.resolve()}", result.stdout)

    def test_does_not_create_output_when_minifier_is_unavailable(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "campaign.html"
            result = self.run_generator("<p>Hello</p>", output, env={"PATH": ""})

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("npx is required to run html-minifier-terser", result.stderr)
            self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
