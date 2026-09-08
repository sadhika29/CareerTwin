import json
import os
from typing import Any, Callable, Dict, Optional


class LLMService:
	"""Central LLM boundary. A provider callable is injected in production/tests."""

	def __init__(self, generator: Optional[Callable[..., Any]] = None):
		self.provider = os.getenv("LLM_PROVIDER", "gemini")
		self.model = os.getenv("LLM_MODEL", "default")
		self._generator = generator

	async def generate(self, prompt: str, *, response_format: Optional[str] = None, **kwargs: Any) -> Any:
		if self._generator is None:
			raise RuntimeError("LLM provider is not configured")
		result = self._generator(prompt=prompt, model=self.model, **kwargs)
		if hasattr(result, "__await__"):
			result = await result
		if response_format == "json" and isinstance(result, str):
			try:
				return json.loads(result)
			except json.JSONDecodeError as exc:
				raise ValueError("LLM returned invalid JSON") from exc
		return result
