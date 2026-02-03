import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from _security import is_dangerous_rm_command, is_env_file_access, is_safe_bash_command


class TestSecurityChecks(unittest.TestCase):
    def test_safe_bash_command_allows_read_only(self) -> None:
        self.assertTrue(is_safe_bash_command("ls -la"))
        self.assertTrue(is_safe_bash_command("git status"))

    def test_safe_bash_command_blocks_unknown(self) -> None:
        self.assertFalse(is_safe_bash_command("rm -rf /"))
        self.assertFalse(is_safe_bash_command("python script.py"))

    def test_dangerous_rm_detection(self) -> None:
        self.assertTrue(is_dangerous_rm_command("rm -rf /"))
        self.assertTrue(is_dangerous_rm_command("rm -r ."))
        self.assertTrue(is_dangerous_rm_command("rm -fr /"))
        self.assertFalse(is_dangerous_rm_command("rm -f file.txt"))

    def test_env_file_access(self) -> None:
        self.assertTrue(is_env_file_access("Read", {"file_path": ".env"}))
        self.assertFalse(is_env_file_access("Read", {"file_path": ".env.sample"}))
        self.assertTrue(is_env_file_access("Bash", {"command": "cat .env"}))
        self.assertFalse(is_env_file_access("Bash", {"command": "cat .env.sample"}))


if __name__ == "__main__":
    unittest.main()
