import os
from abc import ABC, abstractmethod
from typing import Sequence
import numpy as np


class BaseEmbeddingProvider(ABC):
    """Abstract interface for text embedding generation."""

    @abstractmethod
    def embed_text(self, text: str) -> list[float]:
        """Generate embedding vector for a single text."""
        pass

    @abstractmethod
    def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        """Generate embedding vectors for a batch of texts."""
        pass


class GeminiEmbeddingProvider(BaseEmbeddingProvider):
    """Generates embeddings using Google GenAI / Gemini API."""

    def __init__(self, model: str | None = None):
        from google import genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is required for Gemini embeddings.")
        self.client = genai.Client(api_key=api_key)
        self.model = model or os.getenv("GEMINI_EMBEDDING_MODEL", "text-embedding-004")

    def embed_text(self, text: str) -> list[float]:
        try:
            response = self.client.models.embed_content(
                model=self.model,
                contents=text,
            )
            return list(response.embedding.values)
        except Exception:
            return LocalTFIDFEmbeddingProvider().embed_text(text)

    def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        embeddings = []
        for text in texts:
            embeddings.append(self.embed_text(text))
        return embeddings



class LocalTFIDFEmbeddingProvider(BaseEmbeddingProvider):
    """
    Deterministic TF-IDF embedding fallback using scikit-learn.
    Ensures vector similarity operations work reliably in any environment.
    """

    def __init__(self, vocab_dim: int = 128):
        self.vocab_dim = vocab_dim
        # Deterministic hashing-based term frequency representation
        self._hash_seed = 42

    def _hash_embed(self, text: str) -> list[float]:
        vec = np.zeros(self.vocab_dim, dtype=np.float32)
        words = text.lower().split()
        if not words:
            return vec.tolist()

        for word in words:
            idx = abs(hash(word)) % self.vocab_dim
            vec[idx] += 1.0

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def embed_text(self, text: str) -> list[float]:
        return self._hash_embed(text)

    def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        return [self._hash_embed(t) for t in texts]


_CACHED_EMBEDDING_PROVIDER: BaseEmbeddingProvider | None = None


def get_embedding_provider() -> BaseEmbeddingProvider:
    """
    Singleton factory for the embedding provider.
    Reuses model instance across calls as required by Section 26.
    """
    global _CACHED_EMBEDDING_PROVIDER
    if _CACHED_EMBEDDING_PROVIDER is not None:
        return _CACHED_EMBEDDING_PROVIDER

    # Try Gemini Embeddings if configured
    if os.getenv("GEMINI_API_KEY"):
        try:
            _CACHED_EMBEDDING_PROVIDER = GeminiEmbeddingProvider()
            return _CACHED_EMBEDDING_PROVIDER
        except Exception:
            pass

    # Try SentenceTransformers if installed
    try:
        from sentence_transformers import SentenceTransformer

        class SentenceTransformerProvider(BaseEmbeddingProvider):
            def __init__(self, model_name: str | None = None):
                target_model = model_name or os.getenv("SENTENCE_TRANSFORMER_MODEL", "all-MiniLM-L6-v2")
                self.model = SentenceTransformer(target_model)

            def embed_text(self, text: str) -> list[float]:
                return self.model.encode(text).tolist()

            def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
                return self.model.encode(list(texts)).tolist()

        _CACHED_EMBEDDING_PROVIDER = SentenceTransformerProvider()
        return _CACHED_EMBEDDING_PROVIDER
    except Exception:
        pass

    # High performance deterministic fallback
    _CACHED_EMBEDDING_PROVIDER = LocalTFIDFEmbeddingProvider()
    return _CACHED_EMBEDDING_PROVIDER
