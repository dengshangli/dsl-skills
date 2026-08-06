import unittest
from pathlib import Path


SKILL_DIR = Path(__file__).resolve().parents[1]


class SkillContractTests(unittest.TestCase):
    def test_skill_uses_generator_name(self):
        instructions = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")

        self.assertIn("name: wukong-email-template-generator", instructions)
        self.assertIn("# 悟空邮件模板生成器", instructions)
        self.assertNotIn("wukong-email-template-design", instructions)

    def test_skill_makes_generator_execution_a_completion_gate(self):
        instructions = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")

        self.assertIn("## Mandatory execution contract", instructions)
        self.assertIn("MUST execute `scripts/generate_email.py`", instructions)
        self.assertIn("Do not report completion", instructions)
        self.assertIn("GENERATOR_EXECUTED=YES", instructions)

    def test_skill_requires_html_minifier_terser(self):
        instructions = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")

        self.assertIn("MUST run `html-minifier-terser`", instructions)
        self.assertIn("MINIFIER_EXECUTED=YES", instructions)
        self.assertIn("do not deliver an unminified fallback", instructions)
        self.assertIn("Never substitute another minifier", instructions)

    def test_skill_uses_a_portable_generator_path(self):
        instructions = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")

        self.assertIn("<skill-directory>/scripts/generate_email.py", instructions)
        self.assertIn("Never assume the author's home directory", instructions)
        self.assertNotIn("/Users/dengshangli/", instructions)

    def test_body_fragment_cannot_be_a_second_html_deliverable(self):
        instructions = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")

        self.assertIn("Exactly one new `.html` file", instructions)
        self.assertIn("system temporary directory", instructions)
        self.assertIn("`.txt` suffix", instructions)
        self.assertIn("Never save the body fragment with an `.html` suffix", instructions)

    def test_td_width_is_only_used_when_required(self):
        instructions = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")

        self.assertIn("Do not add width to `<td>` elements by default", instructions)
        self.assertIn("fixed columns, image placeholders, or email-client compatibility", instructions)
        self.assertIn('`width` attribute and inline `style="width:…"`', instructions)

    def test_new_variables_default_to_velocity_syntax(self):
        instructions = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")

        self.assertIn("Velocity Template Language (VTL) syntax by default", instructions)
        self.assertIn("`$name`", instructions)
        self.assertIn("`${name}`", instructions)
        self.assertIn("`#if`, `#foreach`, and `#set`", instructions)
        self.assertIn("Preserve variables supplied by the user exactly as written", instructions)
        self.assertIn("the user has not specified a template engine", instructions)

    def test_new_email_copy_prefers_english_without_overriding_the_user(self):
        instructions = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")

        self.assertIn("recipient-facing email copy in English by default", instructions)
        self.assertIn("use another language when the user explicitly requests it", instructions)
        self.assertIn("preserve user-supplied copy in its original language", instructions)
        self.assertIn("Do not translate or otherwise alter fixed text", instructions)


if __name__ == "__main__":
    unittest.main()
