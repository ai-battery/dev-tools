#!/usr/bin/env python3
"""
Pre-execution hook to ensure agent-browser is installed and available.
This script checks for the agent-browser CLI tool and installs it if missing.
"""

import subprocess
import sys
import shutil
from pathlib import Path


def run_command(cmd, check=True, capture_output=True):
    """Run a shell command and return the result."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            check=check,
            capture_output=capture_output,
            text=True
        )
        return result
    except subprocess.CalledProcessError as e:
        return e


def is_agent_browser_installed():
    """Check if agent-browser is installed and accessible."""
    return shutil.which("agent-browser") is not None


def check_npm_available():
    """Check if npm is available on the system."""
    if not shutil.which("npm"):
        print("❌ Error: npm is not installed. Please install Node.js and npm first.", file=sys.stderr)
        print("   Visit: https://nodejs.org/", file=sys.stderr)
        sys.exit(1)


def install_agent_browser():
    """Install agent-browser globally via npm."""
    print("📦 Installing agent-browser...")

    # Install the npm package globally
    install_result = run_command("npm install -g agent-browser", check=False)

    if install_result.returncode != 0:
        print(f"❌ Failed to install agent-browser: {install_result.stderr}", file=sys.stderr)
        sys.exit(1)

    print("✅ agent-browser package installed successfully")

    # Install Chromium
    print("📦 Installing Chromium for agent-browser...")
    chromium_result = run_command("agent-browser install", check=False)

    if chromium_result.returncode != 0:
        print(f"⚠️  Warning: Chromium installation may have issues: {chromium_result.stderr}", file=sys.stderr)
        print("   You may need to run 'agent-browser install' manually later.", file=sys.stderr)
    else:
        print("✅ Chromium installed successfully")


def verify_installation():
    """Verify that agent-browser is working."""
    result = run_command("agent-browser --help", check=False)

    if result.returncode == 0:
        print("✅ agent-browser is ready and working")
        return True
    else:
        print("⚠️  agent-browser is installed but may not be working correctly", file=sys.stderr)
        return False


def main():
    """Main hook execution."""
    print("🔍 Checking for agent-browser...")

    if is_agent_browser_installed():
        print("✅ agent-browser is already installed")
        verify_installation()
        return 0

    print("⚠️  agent-browser not found. Installing...")

    # Check npm is available
    check_npm_available()

    # Install agent-browser
    install_agent_browser()

    # Verify installation
    if is_agent_browser_installed():
        verify_installation()
        print("\n✅ Setup complete! agent-browser is ready to use.")
        return 0
    else:
        print("\n❌ Installation completed but agent-browser is not in PATH", file=sys.stderr)
        print("   You may need to restart your shell or check your PATH configuration.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
