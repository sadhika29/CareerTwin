from backend.rag.embeddings import LocalTFIDFEmbeddingProvider
from backend.rag.ingestion import chunk_text, clean_text, ingest_text_document
from backend.rag.retriever import CareerRAGRetriever
from backend.rag.vector_store import VectorStore


def test_clean_and_chunk_text():
    sample = """
    This is line one.
    This is line two.

    This is a paragraph with several words to test chunking and overlapping behavior.
    """
    cleaned = clean_text(sample)
    assert "\n\n" not in cleaned

    chunks = chunk_text(cleaned, chunk_size=5, chunk_overlap=2)
    assert len(chunks) > 1


def test_vector_store_operations(tmp_path):
    store_dir = tmp_path / "vstore"
    provider = LocalTFIDFEmbeddingProvider()
    store = VectorStore(collection_name="test_col", persist_dir=str(store_dir))

    texts = [
        "Python backend development using FastAPI and PostgreSQL.",
        "Frontend web design using React and TypeScript.",
        "DevOps pipelines using Docker and Kubernetes.",
    ]
    doc_ids = ["doc_1", "doc_2", "doc_3"]
    metas = [
        {"role": "Backend", "tech": "Python"},
        {"role": "Frontend", "tech": "React"},
        {"role": "DevOps", "tech": "Docker"},
    ]
    embeddings = provider.embed_batch(texts)

    store.add_documents(doc_ids=doc_ids, texts=texts, embeddings=embeddings, metadatas=metas)

    # Search for backend
    q_emb = provider.embed_text("FastAPI backend Python")
    results = store.similarity_search(query_embedding=q_emb, top_k=2)

    assert len(results) > 0
    assert results[0]["doc_id"] == "doc_1"

    # Search with metadata filter
    filtered = store.similarity_search(
        query_embedding=q_emb,
        top_k=2,
        filters={"role": "DevOps"},
    )
    assert len(filtered) == 1
    assert filtered[0]["doc_id"] == "doc_3"

    # Test persistence save and load
    store.save()
    new_store = VectorStore(collection_name="test_col", persist_dir=str(store_dir))
    assert len(new_store.documents) == 3


def test_career_rag_retriever(tmp_path):
    store_dir = tmp_path / "vstore_retriever"
    store = VectorStore(collection_name="test_retriever", persist_dir=str(store_dir))
    provider = LocalTFIDFEmbeddingProvider()

    doc_ids = ingest_text_document(
        content="Java enterprise backend development with Spring Boot and SQL.",
        metadata={"role": "Backend Java Developer", "source": "test_guide"},
        vector_store=store,
        embedding_provider=provider,
    )
    assert len(doc_ids) > 0

    retriever = CareerRAGRetriever(
        vector_store=store,
        embedding_provider=provider,
        auto_seed=False,
    )

    # Query matching
    res = retriever.retrieve("Java Spring Boot backend developer", top_k=1)
    assert len(res) == 1
    assert "Java" in res[0]["text"]

    # Empty query test (Section 40)
    empty_res = retriever.retrieve("")
    assert empty_res == []

    # Prompt context string test
    context = retriever.get_context_for_prompt("Java developer", top_k=1)
    assert "test_guide" in context
