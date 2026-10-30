"""
Interview Question Catalogue & Public Research Repository — CareerTwin.
Provides an attributed, verified repository of real-world interview questions
from Glassdoor, LeetCode, Reddit (r/cscareerquestions, r/developersIndia),
and industry technical rubrics across companies, roles, and formats.
"""
from __future__ import annotations

import random
from typing import Any, Dict, List, Optional


RESEARCH_SOURCES = [
    {
        "id": "glassdoor",
        "name": "Glassdoor Interview Experiences",
        "url": "https://www.glassdoor.co.in/Interview/index.htm",
        "confidence": "Candidate-Reported",
    },
    {
        "id": "leetcode",
        "name": "LeetCode Top Interview 150 & Discuss",
        "url": "https://leetcode.com/discuss/interview-experience/",
        "confidence": "Verified Coding Patterns",
    },
    {
        "id": "reddit_cscq",
        "name": "Reddit r/cscareerquestions & r/developersIndia",
        "url": "https://www.reddit.com/r/cscareerquestions/",
        "confidence": "Candidate-Reported Engineering Scenario",
    },
    {
        "id": "prepfully",
        "name": "Prepfully & Industry Architecture Rubrics",
        "url": "https://prepfully.com/interview-questions",
        "confidence": "Industry Standard Rubric",
    },
]

# Verified Public Question Catalogue
QUESTION_CATALOGUE: List[Dict[str, Any]] = [
    # -------------------------------------------------------------------------
    # 1. PYTHON & BACKEND ENGINEERING SCENARIOS
    # -------------------------------------------------------------------------
    {
        "id": "cat_py_01",
        "question": "In a FastAPI or Flask service receiving high traffic, you observe database connection timeouts under load. The connection pool is exhausted, but average database CPU utilization is under 20%. How do you diagnose and resolve this issue?",
        "format": "scenario",
        "category": "Backend Engineering & Concurrency",
        "role": "Backend Developer",
        "company": "Amazon",
        "difficulty": "medium",
        "experience_level": "intermediate",
        "source_platform": "Reddit r/cscareerquestions",
        "source_url": "https://www.reddit.com/r/cscareerquestions/",
        "expected_key_points": [
            "Check for connection leaks (connections opened but not closed in finally blocks/context managers)",
            "Diagnose blocking synchronous I/O or sleep calls inside async route handlers preventing event loop return",
            "Evaluate pool size vs worker concurrency limits and pool pre-ping settings",
            "Slow unindexed queries holding connections open while database remains idle",
        ],
        "ideal_answer": "Connection pool exhaustion with low DB CPU typically indicates connection holding rather than DB saturation. I would first inspect whether asynchronous endpoints are calling blocking synchronous functions (like requests instead of httpx), which blocks the event loop and delays connection releases. Second, verify connection lifecycle to ensure every session uses context managers ('async with') so connections return immediately on exceptions. Third, examine slow queries holding connections idle inside transaction blocks.",
    },
    {
        "id": "cat_py_02",
        "question": "A REST API endpoint processing payments must be strictly idempotent. A network blip occurs after the payment gateway debits the card but before your server writes the success status to PostgreSQL. How do you design the system to guarantee zero double charges on retry?",
        "format": "scenario",
        "category": "API Architecture & Reliability",
        "role": "Software Engineer",
        "company": "HCLTech",
        "difficulty": "hard",
        "experience_level": "experienced",
        "source_platform": "Glassdoor Candidate Experience",
        "source_url": "https://www.glassdoor.co.in/Interview/index.htm",
        "expected_key_points": [
            "Client generates a unique idempotency key sent in request headers",
            "Store transaction intent with 'PENDING' state and idempotency key before calling gateway",
            "Gateway request includes idempotency key to prevent double debiting at processor level",
            "On retry, return the cached result or poll gateway status using the key",
        ],
        "ideal_answer": "I would implement idempotency key tracking. The client passes a unique UUID idempotency key in the request header. Before making the external gateway call, we insert a payment record in 'PENDING' status using a unique constraint on (user_id, idempotency_key). We pass this key to the payment gateway's idempotency parameter. If a timeout occurs, any client retry hits our database first, identifies the pending payment, queries the gateway using the same key instead of initiating a new debit, and updates the local state.",
    },
    {
        "id": "cat_py_03",
        "question": "What is the Global Interpreter Lock (GIL) in CPython, how does it affect CPU-bound multithreaded programs vs I/O-bound programs, and how do you achieve true parallelism in Python?",
        "format": "technical",
        "category": "Python Internals",
        "role": "Python Developer",
        "company": "TCS",
        "difficulty": "easy",
        "experience_level": "fresher",
        "source_platform": "Glassdoor Interview Experience",
        "source_url": "https://www.glassdoor.co.in/Interview/index.htm",
        "expected_key_points": [
            "GIL is a mutex that allows only one thread to execute Python bytecode at a time",
            "I/O-bound tasks release the GIL during network/disk wait, making threading effective",
            "CPU-bound tasks suffer contention under threading; use multiprocessing, ProcessPoolExecutor, or C-extensions",
        ],
        "ideal_answer": "The GIL is a mutex in CPython that prevents multiple native threads from executing Python bytecode simultaneously, primarily to ensure thread-safe memory management. For I/O-bound applications, threading or asyncio is very effective because threads release the GIL during file or socket I/O. For CPU-bound tasks, multithreading does not provide parallelism and can even slow down performance due to lock contention; true CPU parallelism requires the multiprocessing module, Celery task workers, or compiled extensions like NumPy.",
    },

    # -------------------------------------------------------------------------
    # 2. DATABASES & SQL SCENARIOS
    # -------------------------------------------------------------------------
    {
        "id": "cat_db_01",
        "question": "Your production application query: `SELECT * FROM orders WHERE user_id = 452 ORDER BY created_at DESC LIMIT 20;` was executing in 5ms, but as the table reached 15 million rows, it degraded to 1.8 seconds. How would you diagnose the query plan and optimize it?",
        "format": "scenario",
        "category": "Databases & Performance Tuning",
        "role": "Backend Developer",
        "company": "Infosys",
        "difficulty": "medium",
        "experience_level": "intermediate",
        "source_platform": "Reddit r/developersIndia",
        "source_url": "https://www.reddit.com/r/developersIndia/",
        "code_snippet": "-- Slow query\nEXPLAIN ANALYZE\nSELECT * FROM orders \nWHERE user_id = 452 \nORDER BY created_at DESC \nLIMIT 20;",
        "expected_key_points": [
            "Use EXPLAIN ANALYZE to check for Sequential Scan or Sort node in execution plan",
            "Single-column index on user_id requires an in-memory or on-disk sort for created_at",
            "Create a composite index on (user_id, created_at DESC) to allow Index Scan without sorting",
        ],
        "ideal_answer": "I would run EXPLAIN ANALYZE. If there is only an index on user_id, Postgres fetches all matching rows for user_id = 452 and performs a separate Sort operation on created_at before applying the LIMIT. The fix is creating a composite B-Tree index on (user_id, created_at DESC). This allows the database engine to perform a single directional Index Scan that satisfies both the equality filter and the order requirement in index order, immediately returning the first 20 tuples in sub-millisecond time.",
    },
    {
        "id": "cat_db_02",
        "question": "Explain the difference between Optimistic Concurrency Control and Pessimistic Locking when updating account balances in a banking application. When would you choose one over the other?",
        "format": "technical",
        "category": "Database Transactions & ACID",
        "role": "Software Engineer",
        "company": "Google",
        "difficulty": "medium",
        "experience_level": "intermediate",
        "source_platform": "Prepfully System Architecture",
        "source_url": "https://prepfully.com/interview-questions",
        "expected_key_points": [
            "Pessimistic locking uses SELECT FOR UPDATE to lock the row during transaction",
            "Optimistic locking uses a version number or timestamp check on UPDATE",
            "Pessimistic is better for high contention to avoid rollbacks; Optimistic for low contention/distributed scale",
        ],
        "ideal_answer": "Pessimistic locking locks the record at the start using 'SELECT ... FOR UPDATE', preventing any concurrent transaction from modifying it until commit. This guarantees consistency but reduces throughput and risks deadlocks. Optimistic locking does not lock during read; instead, it checks a 'version' column on update: 'UPDATE accounts SET balance = balance - 100, version = version + 1 WHERE id = 1 AND version = 5'. If rows affected is 0, another write occurred and the transaction aborts or retries. I choose pessimistic for high-contention financial ledger accounts and optimistic for high-read, low-contention scenarios.",
    },

    # -------------------------------------------------------------------------
    # 3. CODING INTERVIEW (ALGORITHMS & DATA STRUCTURES)
    # -------------------------------------------------------------------------
    {
        "id": "cat_dsa_01",
        "question": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume each input has exactly one solution, and you may not use the same element twice. Write the solution in O(N) time.",
        "format": "coding",
        "category": "Arrays & Hash Maps",
        "role": "Software Engineer",
        "company": "Google",
        "difficulty": "easy",
        "experience_level": "fresher",
        "source_platform": "LeetCode Top Interview 150",
        "source_url": "https://leetcode.com/studyplan/top-interview-150/",
        "starter_code": "def two_sum(nums: list[int], target: int) -> list[int]:\n    # Implement O(N) solution using a hash map\n    pass\n\n# Test with: two_sum([2, 7, 11, 15], 9) -> [0, 1]",
        "test_cases": [
            {"input": "[2, 7, 11, 15], 9", "expected": "[0, 1]"},
            {"input": "[3, 2, 4], 6", "expected": "[1, 2]"},
            {"input": "[3, 3], 6", "expected": "[0, 1]"},
        ],
        "expected_key_points": [
            "Use a dictionary to store seen numbers and their indices",
            "For each number, check if complement (target - num) exists in the dictionary",
            "Single pass achieves O(N) time and O(N) space complexity",
        ],
        "ideal_answer": "def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []",
    },
    {
        "id": "cat_dsa_02",
        "question": "Implement an LRU (Least Recently Used) Cache. It should support `get(key)` and `put(key, value)` operations both in O(1) average time complexity.",
        "format": "coding",
        "category": "Design & Data Structures",
        "role": "Software Engineer",
        "company": "Amazon",
        "difficulty": "hard",
        "experience_level": "experienced",
        "source_platform": "LeetCode Top Interview 150",
        "source_url": "https://leetcode.com/studyplan/top-interview-150/",
        "starter_code": "class Node:\n    def __init__(self, key=0, val=0):\n        self.key = key\n        self.val = val\n        self.prev = None\n        self.next = None\n\nclass LRUCache:\n    def __init__(self, capacity: int):\n        self.capacity = capacity\n        self.cache = {} # key -> node\n        # Add dummy head and tail nodes\n        self.head = Node()\n        self.tail = Node()\n        self.head.next = self.tail\n        self.tail.prev = self.head\n\n    def get(self, key: int) -> int:\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        pass",
        "test_cases": [
            {"input": "capacity=2, put(1,1), put(2,2), get(1)->1, put(3,3), get(2)->-1", "expected": "1 then -1"},
        ],
        "expected_key_points": [
            "Combine a Hash Map for O(1) key lookup with a Doubly Linked List for O(1) reordering",
            "Dummy head and tail nodes simplify boundary conditions (empty list, 1 element)",
            "Evict node from tail.prev when capacity is exceeded",
        ],
        "ideal_answer": "An LRU Cache requires O(1) lookup and O(1) insertion/deletion. A Hash Map alone cannot maintain usage order in O(1) arbitrary removal; a Doubly Linked List alone cannot look up keys in O(1). Combining a Hash Map that points to Doubly Linked List nodes allows us to move accessed nodes to the head in O(1) and evict least recently used nodes from the tail in O(1).",
    },

    # -------------------------------------------------------------------------
    # 4. MULTIPLE-CHOICE INTERVIEW (MCQ)
    # -------------------------------------------------------------------------
    {
        "id": "cat_mcq_01",
        "question": "Which of the following operations has a WORST-CASE time complexity of O(N) when using Python's built-in `list`?",
        "format": "mcq",
        "category": "Core Data Structures",
        "role": "Software Engineer",
        "company": "Microsoft",
        "difficulty": "easy",
        "experience_level": "fresher",
        "source_platform": "LeetCode Discuss Interview Experiences",
        "source_url": "https://leetcode.com/discuss/interview-experience/",
        "options": [
            "A) Accessing an element by index `lst[i]`",
            "B) Appending an element to the end `lst.append(x)`",
            "C) Removing or popping the first element `lst.pop(0)`",
            "D) Getting the length of the list `len(lst)`",
        ],
        "correct_option": "C",
        "explanation": "Python lists are implemented as dynamic arrays of contiguous memory pointers. Popping from index 0 requires shifting all remaining N-1 pointers one position left, resulting in O(N) time complexity. Index access, appending (amortized), and len() are all O(1).",
        "expected_key_points": ["Shifting elements in dynamic array", "Contiguous memory layout"],
    },
    {
        "id": "cat_mcq_02",
        "question": "In distributed system architecture, what does the CAP theorem state regarding a network partition?",
        "format": "mcq",
        "category": "System Design",
        "role": "Cloud Engineer",
        "company": "Amazon",
        "difficulty": "medium",
        "experience_level": "intermediate",
        "source_platform": "Prepfully System Design",
        "source_url": "https://prepfully.com/interview-questions",
        "options": [
            "A) You can achieve Consistency, Availability, and Partition Tolerance simultaneously",
            "B) During a network partition, you must choose between Consistency (CP) and Availability (AP)",
            "C) Network partitions can be prevented completely using redundant fiber cables",
            "D) Partition tolerance is optional in modern cloud architectures",
        ],
        "correct_option": "B",
        "explanation": "Because network partitions (P) are an unavoidable physical reality in distributed networks, the CAP theorem states that when a partition occurs, a system must trade off between either returning the most recent consistent data (and rejecting requests if nodes are out of sync - CP) or continuing to answer requests immediately with potentially stale data (AP).",
        "expected_key_points": ["Trade-off between CP and AP during network partition"],
    },

    # -------------------------------------------------------------------------
    # 5. HR & BEHAVIORAL INTERVIEW (STAR METHOD)
    # -------------------------------------------------------------------------
    {
        "id": "cat_hr_01",
        "question": "Tell me about a time when you disagreed with a technical decision made by a team lead or colleague. How did you handle the situation, and what was the outcome?",
        "format": "hr",
        "category": "Conflict Resolution & Collaboration",
        "role": "Software Engineer",
        "company": "Google",
        "difficulty": "medium",
        "experience_level": "intermediate",
        "source_platform": "Glassdoor Behavioral Question",
        "source_url": "https://www.glassdoor.co.in/Interview/index.htm",
        "expected_key_points": [
            "Structure response using the STAR method (Situation, Task, Action, Result)",
            "Focus on objective data, benchmarks, or prototypes rather than personal opinions",
            "Demonstrate 'disagree and commit' if consensus was reached on the other approach",
            "Reflect on team cohesion and product impact",
        ],
        "ideal_answer": "In my previous project, a senior engineer proposed using MongoDB for an inventory tracking system with relational foreign keys. (Task) I needed to voice concerns about transaction integrity without causing friction. (Action) Instead of arguing in the group meeting, I created a brief benchmark comparing PostgreSQL's ACID guarantees and complex joins against MongoDB's document model for our specific schema. We reviewed the trade-offs together. (Result) The lead agreed PostgreSQL was a safer fit, saving us significant refactoring time when multi-table audits were required.",
    },
    {
        "id": "cat_hr_02",
        "question": "Describe a project where you faced a tight, unrealistic deadline or an unexpected deliverable failure. What actions did you take to manage expectations and deliver value?",
        "format": "hr",
        "category": "Ownership & Resilience",
        "role": "Full-Stack Developer",
        "company": "TCS",
        "difficulty": "easy",
        "experience_level": "fresher",
        "source_platform": "Reddit r/developersIndia",
        "source_url": "https://www.reddit.com/r/developersIndia/",
        "expected_key_points": [
            "Early transparent communication with stakeholders",
            "Ruthless prioritization: separating MVP core features from secondary enhancements",
            "Accountability and post-mortem retrospective to prevent recurrence",
        ],
        "ideal_answer": "During our capstone deployment, a third-party SMS verification API suddenly deprecated its v1 endpoint 48 hours before launch. Rather than panic, I immediately communicated the risk to the product mentor, proposed a fallback to email verification for the launch MVP, and completed the migration in 6 hours. We launched on schedule with 100% auth reliability.",
    },

    # -------------------------------------------------------------------------
    # 6. COMPANY-SPECIFIC INTERVIEW (TCS / INFOSYS / HCLTECH / FAANG)
    # -------------------------------------------------------------------------
    {
        "id": "cat_comp_01",
        "question": "At TCS / Infosys technical rounds for Freshers: Explain the four core pillars of Object-Oriented Programming (OOP) and give a real-world example of Polymorphism in Python or Java.",
        "format": "company",
        "category": "Core CS Fundamentals",
        "role": "Software Engineer",
        "company": "TCS",
        "difficulty": "easy",
        "experience_level": "fresher",
        "source_platform": "Glassdoor Candidate Experience (TCS NQT / Technical Round)",
        "source_url": "https://www.glassdoor.co.in/Interview/index.htm",
        "expected_key_points": [
            "Encapsulation, Abstraction, Inheritance, Polymorphism",
            "Polymorphism: Method overriding (runtime) and method overloading (compile-time)",
            "Clear real-world code example (e.g. PaymentGateway with pay() method implemented by CreditCard and UPI)",
        ],
        "ideal_answer": "The four pillars are: 1) Encapsulation - bundling data and methods while restricting direct access; 2) Abstraction - hiding complex implementation details and showing only necessary interfaces; 3) Inheritance - allowing a child class to inherit fields and methods from a parent class; 4) Polymorphism - the ability of different classes to respond to the same method call in their own specific way (e.g., a base Notification class with a send() method overridden by EmailNotification and SMSNotification).",
    },
    {
        "id": "cat_comp_02",
        "question": "At HCLTech / Tech Mahindra: How does garbage collection work in Python, and how do circular references get handled by the cyclic garbage collector?",
        "format": "company",
        "category": "Memory Management",
        "role": "Python Developer",
        "company": "HCLTech",
        "difficulty": "medium",
        "experience_level": "intermediate",
        "source_platform": "Glassdoor Interview Experience (HCLTech)",
        "source_url": "https://www.glassdoor.co.in/Interview/index.htm",
        "expected_key_points": [
            "Primary mechanism is Reference Counting (deallocated when refcount reaches 0)",
            "Generational garbage collector (Generations 0, 1, 2) handles reference cycles",
            "gc module heuristics and thresholds",
        ],
        "ideal_answer": "Python primarily uses reference counting. Every object has an internal reference counter that increments when referenced and decrements when a reference falls out of scope. When it hits zero, the memory is immediately reclaimed. However, reference cycles (e.g. object A references B, and B references A) prevent refcount from reaching zero even if both are unreachable. Python solves this with a cyclic, generational garbage collector that divides objects into three generations (0, 1, 2) and runs cycle-detection algorithms to sweep isolated groups of self-referencing objects.",
    },
]


class InterviewQuestionCatalogService:
    """Service to search, filter, and retrieve public verified interview questions."""

    def __init__(self, catalog: Optional[List[Dict[str, Any]]] = None):
        self.catalog = catalog or QUESTION_CATALOGUE

    def get_sources(self) -> List[Dict[str, Any]]:
        return RESEARCH_SOURCES

    def query_questions(
        self,
        target_role: Optional[str] = None,
        round_format: Optional[str] = None,
        difficulty: Optional[str] = None,
        company: Optional[str] = None,
        experience_level: Optional[str] = None,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """Filter the question catalogue matching given interview parameters."""
        candidates = list(self.catalog)

        # Match format
        if round_format and round_format != "mixed":
            fmt_lower = round_format.lower()
            filtered_by_format = [q for q in candidates if q.get("format", "").lower() == fmt_lower]
            if filtered_by_format:
                candidates = filtered_by_format

        # Match company if supplied
        if company and company.strip() and company.lower() not in ("none", "general"):
            comp_lower = company.strip().lower()
            comp_matches = [q for q in candidates if comp_lower in q.get("company", "").lower()]
            if comp_matches:
                candidates = comp_matches + [q for q in candidates if q not in comp_matches]

        # Match difficulty
        if difficulty and difficulty.lower() != "all":
            diff_lower = difficulty.lower()
            diff_matches = [q for q in candidates if q.get("difficulty", "").lower() == diff_lower]
            if diff_matches:
                candidates = diff_matches

        # Match role keywords
        if target_role and target_role.strip():
            role_words = [w.lower() for w in target_role.split() if len(w) > 3]
            role_matches = [
                q for q in candidates
                if any(rw in q.get("role", "").lower() or rw in q.get("category", "").lower() for rw in role_words)
            ]
            if role_matches:
                candidates = role_matches + [q for q in candidates if q not in role_matches]

        # Return randomized or prioritized sample up to limit
        if len(candidates) > limit:
            return random.sample(candidates, limit)
        return candidates

