from __future__ import annotations

from typing import Any, Dict, List


ASSESSMENT_BANK = {
    "DSA": [
        {
            "question_id": "dsa-q1",
            "topic": "Arrays",
            "difficulty": "medium",
            "question": "Given an array, find the maximum sum contiguous subarray.",
            "options": ["Kadane's algorithm", "Binary search", "Dijkstra's algorithm", "Breadth-first search"],
            "correct_answer": "Kadane's algorithm",
            "explanation": "Kadane's algorithm computes the maximum subarray sum in O(n) linear time by keeping a running local maximum.",
        },
        {
            "question_id": "dsa-q2",
            "topic": "Hashing",
            "difficulty": "easy",
            "question": "How can you detect duplicates in a list in linear time?",
            "options": ["Use a hash set", "Sort the array in O(n^2)", "Linear scan nested loops", "Binary heap"],
            "correct_answer": "Use a hash set",
            "explanation": "Hash-based lookup provides O(1) average-time insertion and existence checks, totaling O(n) time.",
        },
        {
            "question_id": "dsa-q3",
            "topic": "Sliding Window",
            "difficulty": "medium",
            "question": "Which pattern is optimal for finding the longest substring without repeating characters?",
            "options": ["Sliding window with hash map", "Recursive backtracking", "Binary search tree", "Bellman-Ford"],
            "correct_answer": "Sliding window with hash map",
            "explanation": "Two pointers forming a variable sliding window with a character index map finds the longest unique substring in O(n).",
        },
        {
            "question_id": "dsa-q4",
            "topic": "Dynamic Programming",
            "difficulty": "hard",
            "question": "What is the space complexity of the optimal 0/1 Knapsack problem using 1D state compression?",
            "options": ["O(W) where W is max weight capacity", "O(N * W)", "O(2^N)", "O(1)"],
            "correct_answer": "O(W) where W is max weight capacity",
            "explanation": "By updating the DP array backwards from right to left, we only need a single 1D array of size W+1.",
        },
    ],
    "Aptitude": [
        {
            "question_id": "apt-q1",
            "topic": "Percentages",
            "difficulty": "easy",
            "question": "If a price increases by 20% and then decreases by 20%, what is the net change?",
            "options": ["4% decrease", "0% change", "2% decrease", "4% increase"],
            "correct_answer": "4% decrease",
            "explanation": "Successive percentage changes: 1.2 * 0.8 = 0.96, which is a net 4% decrease.",
        },
        {
            "question_id": "apt-q2",
            "topic": "Time and Work",
            "difficulty": "medium",
            "question": "If Person A completes a task in 6 days and Person B in 12 days, together they complete it in:",
            "options": ["4 days", "3 days", "6 days", "9 days"],
            "correct_answer": "4 days",
            "explanation": "Combined rate = 1/6 + 1/12 = 3/12 = 1/4 per day, taking 4 days total.",
        },
        {
            "question_id": "apt-q3",
            "topic": "Speed and Distance",
            "difficulty": "medium",
            "question": "A train travels 120 km at 60 km/h and another 120 km at 40 km/h. What is the average speed?",
            "options": ["48 km/h", "50 km/h", "52 km/h", "45 km/h"],
            "correct_answer": "48 km/h",
            "explanation": "Average speed = Total Distance / Total Time = 240 / (2 + 3) = 240 / 5 = 48 km/h.",
        },
    ],
    "Technical": [
        {
            "question_id": "tech-q1",
            "topic": "SQL",
            "difficulty": "medium",
            "question": "Write a query concept to fetch the highest salary from an employee table.",
            "options": ["SELECT MAX(salary) FROM employees", "SELECT TOP 1 FROM employees", "SELECT salary GROUP BY id", "SELECT COUNT(salary)"],
            "correct_answer": "SELECT MAX(salary) FROM employees",
            "explanation": "Use the aggregate function MAX(salary) to compute the highest salary in the table.",
        },
        {
            "question_id": "tech-q2",
            "topic": "System Design",
            "difficulty": "hard",
            "question": "Which caching strategy writes data to both cache and underlying database at the same time?",
            "options": ["Write-through cache", "Write-back cache", "Write-around cache", "Read-through cache"],
            "correct_answer": "Write-through cache",
            "explanation": "Write-through caching updates cache and primary database synchronously, ensuring strong consistency at the cost of higher write latency.",
        },
        {
            "question_id": "tech-q3",
            "topic": "REST APIs",
            "difficulty": "medium",
            "question": "Which HTTP method is idempotent and intended to replace an entire resource representation?",
            "options": ["PUT", "POST", "PATCH", "DELETE"],
            "correct_answer": "PUT",
            "explanation": "PUT is defined as idempotent and replaces the target resource state completely.",
        },
    ],
    "Communication": [
        {
            "question_id": "comm-q1",
            "topic": "Professional communication",
            "difficulty": "easy",
            "question": "Rewrite: 'I need this soon.' in an effective professional tone.",
            "options": [
                "I would appreciate this at your earliest convenience.",
                "Send it to me immediately please.",
                "Why hasn't this been done yet?",
                "Give me the file now."
            ],
            "correct_answer": "I would appreciate this at your earliest convenience.",
            "explanation": "Professional communication is polite, actionable, and establishes clear expectations respectfully.",
        },
        {
            "question_id": "comm-q2",
            "topic": "HR Communication",
            "difficulty": "medium",
            "question": "When answering 'Tell me about yourself' in an interview, what structure is most impactful?",
            "options": [
                "Present -> Past -> Future (Current focus, past experience/skills, future goals with this role)",
                "Full childhood background from schooling to present",
                "Only list hobbies and personal interests",
                "Explain personal life details before academics"
            ],
            "correct_answer": "Present -> Past -> Future (Current focus, past experience/skills, future goals with this role)",
            "explanation": "The Present-Past-Future framework highlights current expertise, relevant background proof, and alignment with the company's future.",
        },
    ],
}


def generate_assessment(category: str, difficulty: str = "medium", count: int = 5, target_role: str | None = None) -> Dict[str, Any]:
    questions = ASSESSMENT_BANK.get(category, ASSESSMENT_BANK["Technical"])
    selected = questions[: max(1, min(count, len(questions)))]
    return {
        "assessment_id": f"asmt_{category.lower()}_{len(selected)}",
        "category": category,
        "difficulty": difficulty,
        "target_role": target_role,
        "questions": [
            {
                "question_id": item["question_id"],
                "category": category,
                "topic": item["topic"],
                "difficulty": item["difficulty"],
                "question": item["question"],
                "options": item.get("options", []),
                "correct_answer": item.get("correct_answer"),
                "explanation": item.get("explanation"),
            }
            for item in selected
        ],
    }


def evaluate_assessment(assessment: Dict[str, Any], answers: Dict[str, Any]) -> Dict[str, Any]:
    questions = assessment.get("questions", [])
    total = len(questions)
    correct_count = 0
    incorrect_count = 0
    unattempted_count = 0

    question_results: List[Dict[str, Any]] = []
    passed_questions: List[Dict[str, Any]] = []
    failed_questions: List[Dict[str, Any]] = []
    skipped_questions: List[Dict[str, Any]] = []
    weak_topics_set = set()
    per_topic: Dict[str, Dict[str, int]] = {}

    for question in questions:
        qid = question["question_id"]
        topic = question.get("topic", "General")
        correct_ans = str(question.get("correct_answer", "")).strip().lower()
        user_val = answers.get(qid)
        user_ans = str(user_val).strip() if user_val is not None else ""

        per_topic.setdefault(topic, {"correct": 0, "total": 0})
        per_topic[topic]["total"] += 1

        is_skipped = user_val is None or user_ans == ""
        is_passed = not is_skipped and user_ans.lower() == correct_ans

        if is_passed:
            status = "passed"
            correct_count += 1
            per_topic[topic]["correct"] += 1
        elif is_skipped:
            status = "skipped"
            unattempted_count += 1
            weak_topics_set.add(topic)
        else:
            status = "failed"
            incorrect_count += 1
            weak_topics_set.add(topic)

        result_item = {
            "question_id": qid,
            "category": question.get("category", assessment.get("category", "Technical")),
            "topic": topic,
            "difficulty": question.get("difficulty", "medium"),
            "question": question.get("question", ""),
            "options": question.get("options", []),
            "user_answer": user_val,
            "correct_answer": question.get("correct_answer"),
            "status": status,
            "explanation": question.get("explanation", ""),
        }
        question_results.append(result_item)

        if status == "passed":
            passed_questions.append(result_item)
        elif status == "failed":
            failed_questions.append(result_item)
        else:
            skipped_questions.append(result_item)

    score = round((correct_count / total) * 100, 2) if total else 0.0
    accuracy = round((correct_count / (total - unattempted_count)) * 100, 2) if (total - unattempted_count) > 0 else 0.0

    # Remediation tasks generated specifically for questions left skipped or failed
    remediation_tasks = []
    for item in failed_questions:
        remediation_tasks.append(f"Review and practice failed concept: {item['topic']} ('{item['question'][:45]}...')")
    for item in skipped_questions:
        remediation_tasks.append(f"Complete skipped question on {item['topic']}: understand explanation and solve practice drill")

    topic_wise_performance = {
        k: round((v["correct"] / v["total"]) * 100, 2) if v["total"] else 0.0
        for k, v in per_topic.items()
    }

    return {
        "assessment_id": assessment.get("assessment_id", "asmt_report"),
        "score": score,
        "accuracy": accuracy,
        "total_questions": total,
        "correct_answers": correct_count,
        "incorrect_answers": incorrect_count,
        "unattempted": unattempted_count,
        "weak_topics": sorted(list(weak_topics_set)),
        "topic_wise_performance": topic_wise_performance,
        "question_results": question_results,
        "passed_questions": passed_questions,
        "failed_questions": failed_questions,
        "skipped_questions": skipped_questions,
        "remediation_tasks": remediation_tasks,
        "status": "submitted",
    }


def generate_remediation_assessment(
    original_assessment: Dict[str, Any],
    submission_answers: Dict[str, Any],
    include_skipped: bool = True,
    include_failed: bool = True,
) -> Dict[str, Any]:
    """Generates an assessment containing only the questions that were skipped or failed in the previous report."""
    eval_report = evaluate_assessment(original_assessment, submission_answers)
    incomplete_qids = set()
    if include_failed:
        incomplete_qids.update(item["question_id"] for item in eval_report["failed_questions"])
    if include_skipped:
        incomplete_qids.update(item["question_id"] for item in eval_report["skipped_questions"])

    filtered_questions = [
        q for q in original_assessment.get("questions", [])
        if q["question_id"] in incomplete_qids
    ]

    return {
        "assessment_id": f"remediation_{original_assessment.get('assessment_id', 'asmt')}",
        "category": original_assessment.get("category", "Technical"),
        "difficulty": original_assessment.get("difficulty", "medium"),
        "target_role": original_assessment.get("target_role"),
        "is_remediation": True,
        "total_questions": len(filtered_questions),
        "questions": filtered_questions,
    }

