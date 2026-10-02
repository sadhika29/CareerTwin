from typing import Any

from backend.rag.embeddings import BaseEmbeddingProvider, get_embedding_provider
from backend.rag.ingestion import seed_knowledge_base
from backend.rag.vector_store import VectorStore


class CareerRAGRetriever:
    """
    Retriever for querying career, role, and skill knowledge.
    Supports top_k ranking and metadata filtering.
    """

    def __init__(
        self,
        vector_store: VectorStore | None = None,
        embedding_provider: BaseEmbeddingProvider | None = None,
        auto_seed: bool = True,
    ):
        self.vector_store = vector_store or VectorStore()
        self.embedding_provider = embedding_provider or get_embedding_provider()

        # Automatically populate seed knowledge if store is empty
        if auto_seed and len(self.vector_store.documents) == 0:
            seed_knowledge_base(
                vector_store=self.vector_store,
                embedding_provider=self.embedding_provider,
            )

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        role: str | None = None,
        skill: str | None = None,
        topic: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Retrieve relevant knowledge chunks matching a query.
        Handles empty queries safely by returning top documents or empty list.
        """
        if not query or not query.strip():
            return []

        filters: dict[str, Any] = {}
        if role:
            filters["role"] = role
        if skill:
            filters["skill"] = skill
        if topic:
            filters["topic"] = topic

        query_embedding = self.embedding_provider.embed_text(query.strip())
        results = self.vector_store.similarity_search(
            query_embedding=query_embedding,
            top_k=top_k,
            filters=filters if filters else None,
        )

        return results

    def get_context_for_prompt(
        self,
        query: str,
        top_k: int = 3,
        role: str | None = None,
    ) -> str:
        """
        Format top retrieved knowledge documents as a context string
        ready for LLM prompt injection.
        """
        docs = self.retrieve(query=query, top_k=top_k, role=role)
        if not docs:
            return ""

        context_blocks = []
        for i, doc in enumerate(docs, 1):
            source = doc.get("metadata", {}).get("source", "Knowledge Base")
            text = doc.get("text", "").strip()
            context_blocks.append(f"[{i}] ({source}):\n{text}")

        return "\n\n".join(context_blocks)
