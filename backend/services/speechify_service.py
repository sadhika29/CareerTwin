"""
Speechify AI Text-to-Speech (TTS) Service
Provides high-fidelity, human-like voice synthesis using Speechify API (Simba model)
for VeriBot AI Mock Interviews and platform audio feedback.
"""
from __future__ import annotations

import logging
import os
from typing import Generator, List, Dict, Any, Optional

logger = logging.getLogger(__name__)

DEFAULT_VOICE_ID = "dominic_32"
DEFAULT_MODEL = "simba-3.2"

CURATED_VOICES = [
    {"id": "dominic_32", "name": "Dominic (Executive Interviewer)", "gender": "male", "recommended": True},
    {"id": "geffen_32", "name": "Geffen (Technical Lead)", "gender": "male", "recommended": False},
    {"id": "aaliya", "name": "Aaliya (Senior Engineering Manager)", "gender": "female", "recommended": False},
    {"id": "abhay", "name": "Abhay (Systems Architect)", "gender": "male", "recommended": False},
    {"id": "aamir", "name": "Aamir (Staff Engineer)", "gender": "male", "recommended": False},
]


class SpeechifyService:
    """Service to interact with Speechify API for Text-to-Speech synthesis."""

    def __init__(
        self,
        token: Optional[str] = None,
        default_voice_id: Optional[str] = None,
        default_model: Optional[str] = None,
    ):
        self.token = token or os.getenv("SPEECHIFY_API_KEY")
        self.default_voice_id = default_voice_id or os.getenv("SPEECHIFY_VOICE_ID") or DEFAULT_VOICE_ID
        self.default_model = default_model or os.getenv("SPEECHIFY_MODEL") or DEFAULT_MODEL
        self._client = None

    def _get_client(self):
        if self._client is None and self.token:
            try:
                from speechify import Speechify
                self._client = Speechify(token=self.token)
            except Exception as e:
                logger.error("Failed to initialize Speechify client: %s", e)
                raise
        return self._client

    def is_configured(self) -> bool:
        return bool(self.token)

    def stream_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Generator[bytes, None, None]:
        """
        Stream audio bytes chunk-by-chunk for low-latency playback.
        """
        if not self.is_configured():
            raise ValueError("Speechify API key is not configured.")
        client = self._get_client()
        if not client:
            raise ValueError("Speechify client is not initialized.")
        vid = voice_id or self.default_voice_id
        mod = model or self.default_model
        
        # Strip long markdown code blocks or brackets from TTS text for cleaner audio
        clean_text = self._sanitize_text_for_speech(text)
        if not clean_text:
            clean_text = "Ready when you are."

        stream = client.audio.stream(
            input=clean_text,
            voice_id=vid,
            model=mod,
            options={"text_normalization": False},
        )
        for chunk in stream:
            yield chunk

    def synthesize_bytes(
        self,
        text: str,
        voice_id: Optional[str] = None,
        model: Optional[str] = None,
    ) -> bytes:
        """
        Synthesize text and return complete MP3 audio bytes.
        """
        chunks = list(self.stream_speech(text, voice_id=voice_id, model=model))
        return b"".join(chunks)

    def get_voices(self) -> List[Dict[str, Any]]:
        """Return curated and workspace voices."""
        try:
            client = self._get_client()
            remote_voices = list(client.voices.list())
            formatted = []
            seen_ids = set()
            
            # Put curated voices first
            for cv in CURATED_VOICES:
                formatted.append(cv)
                seen_ids.add(cv["id"])

            for v in remote_voices[:25]:
                vid = getattr(v, "id", "")
                if vid and vid not in seen_ids:
                    formatted.append({
                        "id": vid,
                        "name": getattr(v, "display_name", vid),
                        "gender": getattr(v, "gender", "neutral"),
                        "recommended": False,
                    })
                    seen_ids.add(vid)
            return formatted
        except Exception as e:
            logger.warning("Could not fetch remote Speechify voices: %s", e)
            return CURATED_VOICES

    @staticmethod
    def _sanitize_text_for_speech(text: str) -> str:
        """Clean markdown or symbols so the voice sounds natural."""
        if not text:
            return ""
        # Remove code blocks ```...```
        import re
        t = re.sub(r"```[\s\S]*?```", " Code snippet provided below. ", text)
        # Remove inline code backticks
        t = re.sub(r"`([^`]+)`", r"\1", t)
        # Remove markdown bold/italic
        t = re.sub(r"[*_#]", "", t)
        # Replace multiple spaces
        t = re.sub(r"\s+", " ", t).strip()
        return t


# Singleton instance
_service: Optional[SpeechifyService] = None


def get_speechify_service() -> SpeechifyService:
    global _service
    if _service is None:
        _service = SpeechifyService()
    return _service
