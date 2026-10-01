import re
from uuid import uuid4

from backend.rag.embeddings import BaseEmbeddingProvider, get_embedding_provider
from backend.rag.vector_store import VectorStore


def clean_text(text: str) -> str:
    """Normalize whitespace and remove distracting symbols."""
    if not text:
        return ""
    text = re.sub(r"\r\n|\r", "\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(lines)


def chunk_text(
    text: str,
    chunk_size: int = 400,
    chunk_overlap: int = 50,
) -> list[str]:
    """
    Split text into chunks by sentences/paragraphs with overlapping boundaries.
    """
    cleaned = clean_text(text)
    if not cleaned:
        return []

    words = cleaned.split()
    if len(words) <= chunk_size:
        return [cleaned]

    chunks = []
    step = max(1, chunk_size - chunk_overlap)

    for i in range(0, len(words), step):
        chunk_words = words[i : i + chunk_size]
        chunks.append(" ".join(chunk_words))
        if i + chunk_size >= len(words):
            break

    return chunks


def ingest_text_document(
    content: str,
    metadata: dict,
    vector_store: VectorStore,
    embedding_provider: BaseEmbeddingProvider | None = None,
) -> list[str]:
    """
    Ingest a document, split into chunks, compute embeddings, and store in vector store.
    """
    provider = embedding_provider or get_embedding_provider()
    chunks = chunk_text(content)

    doc_ids = []
    texts = []
    metas = []

    base_id = metadata.get("source", str(uuid4().hex[:8]))

    for idx, chunk in enumerate(chunks):
        cid = f"{base_id}_chunk_{idx}"
        chunk_meta = dict(metadata)
        chunk_meta["chunk_index"] = idx
        chunk_meta["total_chunks"] = len(chunks)

        doc_ids.append(cid)
        texts.append(chunk)
        metas.append(chunk_meta)

    embeddings = provider.embed_batch(texts)
    vector_store.add_documents(
        doc_ids=doc_ids,
        texts=texts,
        embeddings=embeddings,
        metadatas=metas,
    )

    return doc_ids


# Seed Knowledge Base definitions adhering to Section 24 & Section 27
SEED_CAREER_DOCUMENTS = [
    {
        "content": """
        Backend Java Developer Role & Skills:
        Core Skills: Java, Spring Boot, REST APIs, Microservices, SQL, MySQL, PostgreSQL.
        Responsibilities: Build scalable backend web services, design relational database schemas,
        optimize query execution, implement authentication (OAuth2/JWT), and build unit tests using JUnit and Mockito.
        Prerequisites: Strong Object-Oriented Programming (OOP), Data Structures & Algorithms, and DBMS fundamentals.
        """,
        "metadata": {
            "source": "backend_java_developer_guide",
            "topic": "Role Requirements",
            "role": "Backend Java Developer",
            "skill": "Java",
            "document_type": "career_guide",
        },
    },
    {
        "content": """
        Full Stack Developer Role & Skills:
        Core Skills: JavaScript, TypeScript, React, Node.js, Express.js, HTML, CSS, SQL, MongoDB.
        Responsibilities: Develop end-to-end web applications, integrate client-side components with RESTful APIs,
        manage state with Redux or React Context, and deploy containerized services using Docker.
        Prerequisites: Web fundamentals, DOM manipulation, asynchronous programming with Promises/async-await.
        """,
        "metadata": {
            "source": "fullstack_developer_guide",
            "topic": "Role Requirements",
            "role": "Full Stack Developer",
            "skill": "React",
            "document_type": "career_guide",
        },
    },
    {
        "content": """
        System Design Concepts & Architectural Fundamentals:
        Key Topics: Load Balancing (Round Robin, Least Connections), Caching (Redis, Memcached, Cache-Aside pattern),
        Database Partitioning and Sharding, Horizontal vs Vertical Scaling, CAP Theorem (Consistency, Availability, Partition Tolerance),
        and Asynchronous Messaging with Kafka and RabbitMQ.
        Interview Expectation: Ability to design scalable distributed architectures for systems like URL Shortener, Twitter Feed, or Rate Limiter.
        """,
        "metadata": {
            "source": "system_design_fundamentals",
            "topic": "System Design",
            "role": "Software Engineer",
            "skill": "System Design",
            "document_type": "interview_concepts",
        },
    },
    {
        "content": """
        Data Structures & Algorithms (DSA) Roadmap:
        Core Topics: Arrays, Strings, Two Pointers, Sliding Window, Linked Lists, Stacks, Queues,
        Binary Trees, Binary Search Trees, Graphs (BFS, DFS, Dijkstra), Heaps, and Dynamic Programming.
        Importance: DSA is the universal primary screening threshold across major tech company technical hiring rounds.
        Prerequisites: At least one programming language (Python, Java, or C++).
        """,
        "metadata": {
            "source": "dsa_roadmap_guide",
            "topic": "DSA",
            "role": "Software Engineer",
            "skill": "Data Structures & Algorithms",
            "document_type": "interview_concepts",
        },
    },
    {
        "content": """
        DevOps & Cloud Deployment Fundamentals:
        Core Skills: Docker (Containerization, Dockerfiles, Docker Compose), CI/CD (GitHub Actions, Jenkins),
        Kubernetes (Pods, Deployments, Services), Cloud Providers (AWS EC2, S3, RDS, or Google Cloud Run).
        Importance: Modern developers are expected to understand how their code builds, runs, and monitors in production environments.
        """,
        "metadata": {
            "source": "devops_cloud_guide",
            "topic": "DevOps",
            "role": "DevOps Engineer",
            "skill": "Docker",
            "document_type": "career_guide",
        },
    },
]


def seed_knowledge_base(
    vector_store: VectorStore,
    embedding_provider: BaseEmbeddingProvider | None = None,
) -> int:
    """Seed the vector store with approved initial career knowledge."""
    count = 0
    for doc in SEED_CAREER_DOCUMENTS:
        ingest_text_document(
            content=doc["content"],
            metadata=doc["metadata"],
            vector_store=vector_store,
            embedding_provider=embedding_provider,
        )
        count += 1
    vector_store.save()
    return count
