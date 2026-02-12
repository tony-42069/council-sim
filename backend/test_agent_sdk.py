"""
Agent SDK verification script.
Tests that the SDK is installed correctly and documents the actual API.

Usage:
    python backend/test_agent_sdk.py
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))


async def test_sdk():
    """Verify the Agent SDK is working."""

    print("=== Claude Agent SDK Verification ===\n")

    # 1. Import check
    try:
        from claude_agent_sdk import (
            query,
            ClaudeAgentOptions,
            AgentDefinition,
            tool,
            create_sdk_mcp_server,
            SdkMcpTool,
            AssistantMessage,
            ResultMessage,
            TextBlock,
        )
        print("[OK] All imports successful")
    except ImportError as e:
        print(f"[FAIL] Import error: {e}")
        sys.exit(1)

    # 2. Custom tool test
    @tool("test_tool", "A test tool that echoes input", {"message": str})
    async def test_tool_fn(args: dict) -> dict:
        return {"content": [{"type": "text", "text": f"Echo: {args['message']}"}]}

    server = create_sdk_mcp_server("test-server", "1.0.0", [test_tool_fn])
    print("[OK] Custom MCP tool created")
    print(f"     Server type: {type(server).__name__}")

    # 3. Simple query test
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("[SKIP] No ANTHROPIC_API_KEY — skipping live query test")
        return

    print("\n[TEST] Running simple query...")
    try:
        result_text = ""
        async for message in query(
            prompt="Reply with exactly: 'Agent SDK verified.' Nothing else.",
            options=ClaudeAgentOptions(
                model="claude-sonnet-4-5-20250929",
                max_turns=1,
                permission_mode="bypassPermissions",
                allowed_tools=[],
            ),
        ):
            if isinstance(message, (AssistantMessage, ResultMessage)):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        result_text += block.text

        print(f"[OK] Query response: {result_text.strip()}")
    except Exception as e:
        print(f"[FAIL] Query error: {e}")

    print("\n=== Verification Complete ===")


if __name__ == "__main__":
    asyncio.run(test_sdk())
