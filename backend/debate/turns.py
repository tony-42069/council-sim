"""
Debate turn generation using the Anthropic API with streaming.
Each turn generates a single persona's statement, streaming token-by-token.
"""

from typing import Callable, Awaitable
import anthropic
from backend.models.persona import Persona
from backend.config import get_settings


async def stream_debate_turn(
    client: anthropic.AsyncAnthropic,
    persona: Persona,
    messages: list[dict],
    system_prompt: str,
    on_token: Callable[[str], Awaitable[None]],
) -> str:
    """
    Generate a single debate turn with token-by-token streaming.

    Args:
        client: Anthropic async client
        persona: The persona speaking this turn
        messages: Messages array (from Transcript.build_context_for_turn)
        system_prompt: The persona's system prompt
        on_token: Async callback called for each token as it streams

    Returns:
        The full text of the completed turn
    """
    settings = get_settings()
    full_text = ""

    async with client.messages.stream(
        model=settings.debate_model,
        max_tokens=settings.max_tokens_per_turn,
        temperature=settings.debate_temperature,
        system=system_prompt,
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            full_text += text
            await on_token(text)

    return full_text
