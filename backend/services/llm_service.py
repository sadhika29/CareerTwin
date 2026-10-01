import json
import logging
import os
import re
from typing import Any, Callable, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class LLMService:
    """
    Central LLM service for CareerTwin.
    Supports Google Gemini (via google-genai or google.generativeai) and custom injected generators for testing.
    """

    FALLBACK_MODELS = [
        "gemini-flash-lite-latest",
        "gemini-flash-latest",
        "gemini-2.5-flash",
        "gemini-1.5-flash",
    ]

    def __init__(
        self,
        generator: Optional[Callable[..., Any]] = None,
        model: str | None = None,
    ):
        if isinstance(generator, str):
            model = generator
            generator = None

        self.provider = os.getenv("LLM_PROVIDER", "gemini")
        self.model = model or os.getenv("GEMINI_MODEL") or os.getenv("LLM_MODEL") or "gemini-flash-lite-latest"
        self._generator = generator

        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception:
                try:
                    import google.generativeai as legacy_genai
                    legacy_genai.configure(api_key=self.api_key)
                    self.client = legacy_genai.GenerativeModel(self.model)
                except Exception:
                    self.client = None

    def _clean_json_string(self, text: str) -> str:
        """Strip markdown code fences and whitespace from a JSON response."""
        cleaned = text.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        return cleaned.strip()

    def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        *,
        response_format: Optional[str] = None,
        **kwargs: Any,
    ) -> Any:
        """Generate text using injected generator or Gemini."""
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{prompt}"

        if self._generator is not None:
            result = self._generator(prompt=full_prompt, model=self.model, **kwargs)
            if response_format == "json" and isinstance(result, str):
                try:
                    return json.loads(self._clean_json_string(result))
                except json.JSONDecodeError as exc:
                    raise ValueError("LLM returned invalid JSON") from exc
            return result

        if self.client is not None:
            # Check if using google.genai Client
            if hasattr(self.client, "models"):
                from google.genai import types
                config = None
                if response_format == "json":
                    config = types.GenerateContentConfig(response_mime_type="application/json")

                candidate_models = [self.model] + [m for m in self.FALLBACK_MODELS if m != self.model]
                last_err = None
                for candidate in candidate_models:
                    try:
                        response = self.client.models.generate_content(
                            model=candidate,
                            contents=full_prompt,
                            config=config,
                        )
                        if response.text:
                            return response.text
                    except Exception as e:
                        last_err = e
                        continue

                if last_err:
                    raise last_err
                raise RuntimeError("Gemini returned an empty response.")
            elif hasattr(self.client, "generate_content"):
                # Legacy google.generativeai
                response = self.client.generate_content(full_prompt)
                return response.text

        raise RuntimeError("LLM provider / GEMINI_API_KEY is not configured.")

    def generate_json(
        self,
        prompt: str,
        system_prompt: str | None = None,
        **kwargs: Any,
    ) -> str:
        """Generate a JSON response using Gemini or injected generator."""
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{prompt}"

        if self._generator is not None:
            result = self._generator(prompt=full_prompt, model=self.model, **kwargs)
            if isinstance(result, str):
                return self._clean_json_string(result)
            return json.dumps(result)

        if self.client is not None:
            if hasattr(self.client, "models"):
                from google.genai import types
                candidate_models = [self.model] + [m for m in self.FALLBACK_MODELS if m != self.model]
                last_err = None
                for candidate in candidate_models:
                    try:
                        response = self.client.models.generate_content(
                            model=candidate,
                            contents=full_prompt,
                            config=types.GenerateContentConfig(
                                response_mime_type="application/json",
                            ),
                        )
                        if response.text:
                            return self._clean_json_string(response.text)
                    except Exception as e:
                        last_err = e
                        continue

                if last_err:
                    raise last_err
                raise RuntimeError("Gemini returned an empty response.")
            elif hasattr(self.client, "generate_content"):
                response = self.client.generate_content(full_prompt)
                return self._clean_json_string(response.text)

        raise RuntimeError("LLM provider / GEMINI_API_KEY is not configured.")

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Generates text from the LLM provider for teammate module compatibility."""
        try:
            return self.generate(prompt=prompt, system_prompt=system_instruction)
        except Exception as e:
            logger.error(f"Error during LLM generation: {e}")
            return f'{{"error": "Generation failed: {str(e)}"}}'


llm_service = LLMService()

