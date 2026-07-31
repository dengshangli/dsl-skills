import unittest
from pathlib import Path


SKILL_DIR = Path(__file__).resolve().parents[1]


class SkillContractTests(unittest.TestCase):
    def test_skill_uses_generator_name_everywhere(self):
        instructions = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")
        metadata = (SKILL_DIR / "agents" / "openai.yaml").read_text(encoding="utf-8")

        self.assertIn("name: wukong-email-template-generator", instructions)
        self.assertIn("# 悟空邮件模板生成器", instructions)
        self.assertIn('display_name: "悟空邮件模板生成器"', metadata)
        self.assertIn("$wukong-email-template-generator", metadata)
        self.assertNotIn("wukong-email-template-design", instructions + metadata)

    def test_skill_makes_generator_execution_a_completion_gate(self):
        instructions = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")

        self.assertIn("## Mandatory execution contract", instructions)
        self.assertIn("MUST execute `scripts/generate_email.py`", instructions)
        self.assertIn("Do not report completion", instructions)
        self.assertIn("GENERATOR_EXECUTED=YES", instructions)

    def test_default_prompt_requires_the_generator(self):
        metadata = (SKILL_DIR / "agents" / "openai.yaml").read_text(encoding="utf-8")

        self.assertIn("generate_email.py", metadata)
        self.assertIn("完整 HTML", metadata)
        self.assertIn("只生成一个", metadata)

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


if __name__ == "__main__":
    unittest.main()
