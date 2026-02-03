import re
from typing import Any


SAFE_BASH_COMMANDS = [
    r"^ls\b",
    r"^pwd\b",
    r"^echo\b",
    r"^cat\b(?!.*>)",  # cat without redirection
    r"^head\b",
    r"^tail\b",
    r"^wc\b",
    r"^which\b",
    r"^whereis\b",
    r"^type\b",
    r"^file\b",
    r"^stat\b",
    r"^git\s+(status|log|diff|show|branch|tag)\b",
    r"^git\s+remote\s+-v\b",
    r"^npm\s+(list|ls|outdated|view)\b",
    r"^pip\s+(list|show|freeze)\b",
    r"^uv\s+(pip\s+list|tree)\b",
    r"^python\s+--version\b",
    r"^node\s+--version\b",
    r"^npm\s+--version\b",
]


def is_safe_bash_command(command: str) -> bool:
    if not command:
        return False
    normalized = command.strip()
    for pattern in SAFE_BASH_COMMANDS:
        if re.search(pattern, normalized):
            return True
    return False


def is_dangerous_rm_command(command: str) -> bool:
    """
    Detect dangerous rm commands.
    Matches recursive/force and destructive target patterns.
    """
    normalized = " ".join(command.lower().split())

    patterns = [
        r"\brm\s+.*-[a-z]*r[a-z]*f",  # rm -rf, rm -fr, rm -Rf, etc.
        r"\brm\s+.*-[a-z]*f[a-z]*r",  # rm -fr variations
        r"\brm\s+--recursive\s+--force",
        r"\brm\s+--force\s+--recursive",
        r"\brm\s+-r\s+.*-f",
        r"\brm\s+-f\s+.*-r",
    ]

    for pattern in patterns:
        if re.search(pattern, normalized):
            return True

    # If rm is recursive, check for dangerous targets.
    if re.search(r"\brm\s+.*-[a-z]*r", normalized):
        dangerous_target_patterns = [
            r"(^|\s)/(\s|$)",          # root directory
            r"(^|\s)/\*(\s|$)",        # root wildcard
            r"(^|\s)~(/|\s|$)",        # home directory
            r"\$HOME",                 # $HOME env
            r"(^|\s)\.\.(\s|$)",       # parent directory
            r"(^|\s)\.(\s|$)",         # current directory
            r"(^|\s)\*(\s|$)",         # glob wildcard
        ]
        for pattern in dangerous_target_patterns:
            if re.search(pattern, normalized):
                return True

    return False


def is_env_file_access(tool_name: str, tool_input: dict[str, Any]) -> bool:
    """
    Check for access to .env files (excluding .env.sample).
    """
    if tool_name in ["Read", "Edit", "MultiEdit", "Write", "Bash"]:
        if tool_name in ["Read", "Edit", "MultiEdit", "Write"]:
            file_path = tool_input.get("file_path", "")
            if ".env" in file_path and not file_path.endswith(".env.sample"):
                return True

        elif tool_name == "Bash":
            command = tool_input.get("command", "")
            env_patterns = [
                r"\b\.env\b(?!\.sample)",
                r"cat\s+.*\.env\b(?!\.sample)",
                r"echo\s+.*>\s*\.env\b(?!\.sample)",
                r"touch\s+.*\.env\b(?!\.sample)",
                r"cp\s+.*\.env\b(?!\.sample)",
                r"mv\s+.*\.env\b(?!\.sample)",
            ]

            for pattern in env_patterns:
                if re.search(pattern, command):
                    return True

    return False
