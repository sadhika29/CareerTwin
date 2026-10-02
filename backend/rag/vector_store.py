import json
import os
from pathlib import Path
from typing import Any
import numpy as np


class VectorStore:
    """
    Vector store supporting embedding storage, metadata filtering,
    cosine similarity search, and disk persistence.
    """

    def __init__(self, collection_name: str = "career_knowledge", persist_dir: str | None = None):
        self.collection_name = collection_name
        default_dir = os.getenv("VECTOR_STORE_DIR", "storage/vector_store")
        self.persist_dir = Path(persist_dir) if persist_dir else Path(default_dir)
        self.persist_path = self.persist_dir / f"{collection_name}.json"

        self.doc_ids: list[str] = []
        self.documents: list[str] = []
        self.metadatas: list[dict[str, Any]] = []
        self.embeddings: list[list[float]] = []

        if self.persist_path.exists():
            self.load()

    def add_document(
        self,
        doc_id: str,
        text: str,
        embedding: list[float],
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Add a single document to the collection."""
        if doc_id in self.doc_ids:
            idx = self.doc_ids.index(doc_id)
            self.documents[idx] = text
            self.embeddings[idx] = embedding
            self.metadatas[idx] = metadata or {}
        else:
            self.doc_ids.append(doc_id)
            self.documents.append(text)
            self.embeddings.append(embedding)
            self.metadatas.append(metadata or {})

    def add_documents(
        self,
        doc_ids: list[str],
        texts: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict[str, Any]] | None = None,
    ) -> None:
        """Add multiple documents in batch."""
        metadatas = metadatas or [{} for _ in texts]
        for did, text, emb, meta in zip(doc_ids, texts, embeddings, metadatas):
            self.add_document(did, text, emb, meta)

    def similarity_search(
        self,
        query_embedding: list[float],
        top_k: int = 5,
        filters: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """
        Search collection using cosine similarity with optional metadata filtering.
        Returns list of ranked document matches.
        """
        if not self.embeddings:
            return []

        q_vec = np.array(query_embedding, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            return []
        q_vec = q_vec / q_norm

        results = []

        for idx, (doc_id, text, emb, meta) in enumerate(
            zip(self.doc_ids, self.documents, self.embeddings, self.metadatas)
        ):
            # Apply metadata filters if provided
            if filters:
                match = True
                for fk, fv in filters.items():
                    if meta.get(fk) != fv:
                        match = False
                        break
                if not match:
                    continue

            d_vec = np.array(emb, dtype=np.float32)
            d_norm = np.linalg.norm(d_vec)
            if d_norm > 0:
                d_vec = d_vec / d_norm
                sim = float(np.dot(q_vec, d_vec))
            else:
                sim = 0.0

            results.append(
                {
                    "doc_id": doc_id,
                    "text": text,
                    "metadata": meta,
                    "score": round(sim, 4),
                }
            )

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def delete(self, doc_id: str) -> bool:
        """Delete a document by ID."""
        if doc_id in self.doc_ids:
            idx = self.doc_ids.index(doc_id)
            self.doc_ids.pop(idx)
            self.documents.pop(idx)
            self.embeddings.pop(idx)
            self.metadatas.pop(idx)
            return True
        return False

    def save(self) -> None:
        """Persist vector store collection to disk."""
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        data = {
            "collection_name": self.collection_name,
            "doc_ids": self.doc_ids,
            "documents": self.documents,
            "metadatas": self.metadatas,
            "embeddings": self.embeddings,
        }
        with open(self.persist_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load(self) -> None:
        """Load collection data from disk."""
        if self.persist_path.exists():
            with open(self.persist_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.collection_name = data.get("collection_name", self.collection_name)
                self.doc_ids = data.get("doc_ids", [])
                self.documents = data.get("documents", [])
                self.metadatas = data.get("metadatas", [])
                self.embeddings = data.get("embeddings", [])
