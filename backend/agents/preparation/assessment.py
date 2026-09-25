from __future__ import annotations

from typing import Any, Dict, List


ASSESSMENT_BANK = {
    "DSA": [
        {
            "question_id": "dsa-q1",
            "topic": "Arrays",
            "difficulty": "medium",
            "question": "Given an array, find the maximum sum subarray.",
            "options": [],
            "correct_answer": "Kadane's algorithm",
            "explanation": "Track a running maximum and maintain the best local sum.",
        },
        {
            "question_id": "dsa-q2",
            "topic": "Hashing",
            "difficulty": "easy",
            "question": "How can you detect duplicates in a list in linear time?",
            "options": [],
            "correct_answer": "Use a set",
            "explanation": "Hash-based lookup provides O(1) average-time duplicate checks.",
        },
    ],
    "Aptitude": [
        {
            "question_id": "apt-q1",
            "topic": "Percentages",
            "difficulty": "easy",
            "question": "If a price increases by 20% and then decreases by 20%, what is the net change?",
            "options": [],
            "correct_answer": "4% decrease",
            "explanation": "The successive multipliers are 1.2 and 0.8, leading to a net 0.96 multiplier.",
        }
    ],
    "Technical": [
        {
            "question_id": "tech-q1",
            "topic": "SQL",
            "difficulty": "medium",
            "question": "Write a query to fetch the highest salary from an employee table.",
            "options": [],
            "correct_answer": "SELECT MAX(salary) FROM employees;",
            "explanation": "Use the aggregate function MAX to compute the highest salary value.",
        }
    ],
    "Communication": [
        {
            "question_id": "comm-q1",
            "topic": "Professional communication",
            "difficulty": "easy",
            "question": "Rewrite: 'I need this soon.' in a professional tone.",
            "options": [],
            "correct_answer": "I would appreciate this at your earliest convenience.",
            "explanation": "Professional communication is more respectful and specific.",
        }
    ],
}


def generate_assessment(category: str, difficulty: str = "medium", count: int = 2) -> Dict[str, Any]:
    questions = ASSESSMENT_BANK.get(category, ASSESSMENT_BANK["Technical"])
    selected = questions[: max(1, min(count, len(questions)))]
    return {
        "category": category,
        "difficulty": difficulty,
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


def evaluate_assessment(assessment: Dict[str, Any], answers: Dict[str, str]) -> Dict[str, Any]:
    total = len(assessment.get("questions", []))
    correct = 0
    for question in assessment["questions"]:
        key = question["question_id"]
        if str(answers.get(key, "")).strip().lower() == str(question.get("correct_answer", "")).strip().lower():
            correct += 1
    score = round((correct / total) * 100, 2) if total else 0.0
    accuracy = score
    weak_topics = [
        question["topic"]
        for question in assessment["questions"]
        if str(answers.get(question["question_id"], "")).strip().lower() != str(question.get("correct_answer", "")).strip().lower()
    ]
    return {
        "score": score,
        "accuracy": accuracy,
        "correct_answers": correct,
        "incorrect_answers": total - correct,
        "unattempted": max(0, total - len(answers)),
        "weak_topics": weak_topics,
    }
