from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any, Dict, Iterable, List

from backend.schemas.preparation import (
    AssessmentRequest,
    AssessmentResponse,
    AssessmentSubmission,
    DailyTask,
    PerformanceResponse,
    PreparationPlanRequest,
    PreparationPlanResponse,
)

ROLE_TOPIC_MAP = {
    "software engineer": [
        "Arrays",
        "Strings",
        "Hashing",
        "Sliding Window",
        "SQL",
        "System Design",
        "JavaScript",
        "React",
        "Computer Science Fundamentals",
    ],
    "frontend developer": [
        "HTML",
        "CSS",
        "JavaScript",
        "React",
        "DOM Manipulation",
        "State Management",
        "APIs",
    ],
    "data analyst": [
        "SQL",
        "Python",
        "Excel",
        "Statistics",
        "Data Visualization",
        "Power BI",
        "Probability",
    ],
    "backend developer": [
        "SQL",
        "APIs",
        "Data Structures",
        "System Design",
        "Java",
        "Python",
        "Caching",
    ],
    "full stack developer": [
        "JavaScript",
        "React",
        "Node.js",
        "SQL",
        "REST APIs",
        "System Design",
    ],
}

GENERIC_DEMANDS = [
    "Arrays",
    "Strings",
    "Hashing",
    "SQL",
    "Communication",
    "Problem Solving",
    "Time Complexity",
]


class PreparationService:
    """Minimal preparation planner for the CareerTwin workflow."""

    def create_plan(self, payload: PreparationPlanRequest, user_id: str) -> PreparationPlanResponse:
        priority_topics = self._prioritize_topics(payload)
        daily_plan = self._build_daily_plan(priority_topics, payload.available_time)
        estimated_time = max(30, sum(item.tasks and len(item.tasks) * 25 for item in daily_plan[:3]))
        reason = (
            f"Your target role ({payload.target_role}) and current skill gaps require a focused plan "
            f"that targets the highest-impact topics first."
        )
        expected_outcomes = [
            "Improve speed and accuracy on weak core topics.",
            "Reinforce the skills most relevant to the target role.",
            "Build a repeatable plan that reduces interview risk.",
        ]
        practice_types = [
            "Coding drills",
            "SQL and technical practice",
            "Communication rehearsal",
            "Timed aptitude reviews",
        ]
        return PreparationPlanResponse(
            user_id=user_id,
            target_role=payload.target_role,
            priority_topics=priority_topics,
            daily_plan=daily_plan,
            reason=reason,
            estimated_time=estimated_time,
            expected_outcomes=expected_outcomes,
            practice_types=practice_types,
        )

    def create_assessment(self, payload: AssessmentRequest) -> AssessmentResponse:
        question_bank = {
            "DSA": [
                {
                    "question_id": "dsa-1",
                    "topic": payload.topic or "Arrays",
                    "question": "Find the maximum sum subarray using Kadane's algorithm.",
                    "options": [],
                    "correct_answer": "Use Kadane's algorithm.",
                    "explanation": "Track the maximum sum ending at each index and carry the best prefix.",
                },
                {
                    "question_id": "dsa-2",
                    "topic": payload.topic or "Hashing",
                    "question": "Given a list of integers, find duplicates in O(n) time.",
                    "options": [],
                    "correct_answer": "Use a hash set.",
                    "explanation": "A hash-based lookup is the standard linear-time solution.",
                },
            ],
            "Aptitude": [
                {
                    "question_id": "apt-1",
                    "topic": payload.topic or "Percentages",
                    "question": "A product's price increases by 20% and then decreases by 20%. What is the net effect?",
                    "options": [],
                    "correct_answer": "4% decrease",
                    "explanation": "A 20% rise followed by 20% fall results in a 4% net decrease.",
                },
            ],
            "Technical": [
                {
                    "question_id": "tech-1",
                    "topic": payload.topic or "SQL",
                    "question": "Write a query to fetch the top 3 highest salaries from a table.",
                    "options": [],
                    "correct_answer": "SELECT * FROM employees ORDER BY salary DESC LIMIT 3;",
                    "explanation": "Sort descending and limit the rows to the required top count.",
                },
            ],
            "Communication": [
                {
                    "question_id": "comm-1",
                    "topic": payload.topic or "Professional Communication",
                    "question": "Rewrite this sentence in a professional tone: 'I need the report soon.'",
                    "options": [],
                    "correct_answer": "I would appreciate the report at your earliest convenience.",
                    "explanation": "Professional communication uses polite, specific wording.",
                },
            ],
        }
        questions = question_bank.get(payload.category, question_bank["Technical"])[: max(1, payload.number_of_questions)]
        # Ensure the actual response object matches the schema contract.
        payload_questions = [
            {
                "question_id": item["question_id"],
                "category": payload.category,
                "topic": item["topic"],
                "difficulty": payload.difficulty,
                "question": item["question"],
                "options": item.get("options", []),
                "correct_answer": item.get("correct_answer"),
                "explanation": item.get("explanation"),
                "problem_statement": item.get("problem_statement"),
                "constraints": item.get("constraints"),
                "sample_input": item.get("sample_input"),
                "sample_output": item.get("sample_output"),
                "expected_concept": item.get("expected_concept"),
            }
            for item in questions
        ]
        return AssessmentResponse(
            assessment_id=f"asmt_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            user_id=payload.user_id,
            category=payload.category,
            topic=payload.topic,
            difficulty=payload.difficulty,
            questions=payload_questions,
            duration=payload.duration,
            created_at=datetime.utcnow(),
        )

    def evaluate_submission(self, assessment: AssessmentResponse, submission: AssessmentSubmission) -> Dict[str, Any]:
        correct = 0
        total = len(assessment.questions)
        for question in assessment.questions:
            submitted = submission.answers.get(question["question_id"], "")
            if submitted and question.get("correct_answer") and str(submitted).strip().lower() == str(question["correct_answer"]).strip().lower():
                correct += 1
        accuracy = round((correct / total) * 100, 2) if total else 0.0
        score = round((correct / total) * 100, 2) if total else 0.0
        weak_topics = []
        per_topic = {}
        for question in assessment.questions:
            topic_name = question.get("topic", "General")
            per_topic.setdefault(topic_name, {"correct": 0, "total": 0})
            per_topic[topic_name]["total"] += 1
            submitted = submission.answers.get(question["question_id"], "")
            if question.get("correct_answer") and str(submitted).strip().lower() == str(question["correct_answer"]).strip().lower():
                per_topic[topic_name]["correct"] += 1
        for topic_name, stats in per_topic.items():
            topic_accuracy = (stats["correct"] / stats["total"]) * 100 if stats["total"] else 0
            if topic_accuracy < 60:
                weak_topics.append(topic_name)
        return {
            "assessment_id": assessment.assessment_id,
            "user_id": submission.user_id,
            "score": score,
            "accuracy": accuracy,
            "correct_answers": correct,
            "incorrect_answers": total - correct - self._count_unattempted(assessment, submission),
            "unattempted": self._count_unattempted(assessment, submission),
            "time_taken": submission.time_taken,
            "weak_topics": weak_topics,
            "topic_wise_performance": {k: round((v["correct"] / v["total"]) * 100, 2) if v["total"] else 0 for k, v in per_topic.items()},
            "status": "submitted",
        }

    def summarize_performance(self, attempts: Iterable[Dict[str, Any]]) -> PerformanceResponse:
        attempts = list(attempts)
        if not attempts:
            return PerformanceResponse(strong_topics=[], weak_topics=[], slow_topics=[], trend="stable")
        per_topic: Dict[str, List[float]] = {}
        for attempt in attempts:
            for topic, score in (attempt.get("topic_scores") or {}).items():
                per_topic.setdefault(topic, []).append(float(score))
        strong_topics = [topic for topic, scores in per_topic.items() if scores and sum(scores) / len(scores) >= 75]
        weak_topics = [topic for topic, scores in per_topic.items() if scores and sum(scores) / len(scores) < 55]
        slow_topics = [topic for topic in weak_topics[:3]]
        recent = [float(item.get("score") or 0) for item in attempts[-3:]]
        previous = [float(item.get("score") or 0) for item in attempts[:-3]] if len(attempts) > 3 else recent
        if not previous:
            trend = "stable"
        else:
            trend = "improving" if sum(recent) / max(len(recent), 1) > sum(previous) / len(previous) else "declining"
        return PerformanceResponse(
            strong_topics=strong_topics,
            weak_topics=weak_topics,
            slow_topics=slow_topics,
            trend=trend,
            score=round(sum(float(item.get("score", 0) or 0) for item in attempts) / max(len(attempts), 1), 2),
        )

    def _prioritize_topics(self, payload: PreparationPlanRequest) -> List[str]:
        skill_gaps = [topic for topic in payload.skill_gaps if topic]
        if not skill_gaps:
            skill_gaps = ROLE_TOPIC_MAP.get(payload.target_role.lower(), []) + GENERIC_DEMANDS
        # Prefer role-specific relevance and actual weak areas before generic topics.
        weighted: Dict[str, float] = {}
        for topic in skill_gaps:
            weighted[topic] = 5.0
        for topic in payload.current_skills:
            weighted[topic] = weighted.get(topic, 0.0) - 1.0
        for topic in ROLE_TOPIC_MAP.get(payload.target_role.lower(), []):
            weighted[topic] = weighted.get(topic, 0.0) + 2.0
        if payload.previous_performance:
            for weak_topic in payload.previous_performance.get("weak_topics", []):
                weighted[weak_topic] = weighted.get(weak_topic, 0.0) + 4.0
        ranked = sorted(weighted.items(), key=lambda item: item[1], reverse=True)
        return [topic for topic, _ in ranked[:5]]

    def _build_daily_plan(self, topics: List[str], available_time: int) -> List[DailyTask]:
        day_plan: List[DailyTask] = []
        for day_index in range(1, 4):
            tasks_for_day = []
            base_tasks = [
                f"Practice {topics[0]} problem patterns for {max(20, available_time // 3)} minutes",
                f"Revise {topics[1] if len(topics) > 1 else topics[0]} with 3 targeted questions",
                f"Review communication and reasoning prompts for 15 minutes",
            ]
            tasks_for_day.extend(base_tasks)
            day_plan.append(DailyTask(day=day_index, tasks=tasks_for_day))
        return day_plan

    def _count_unattempted(self, assessment: AssessmentResponse, submission: AssessmentSubmission) -> int:
        total = len(assessment.questions)
        answered = sum(1 for question in assessment.questions if submission.answers.get(question["question_id"]) is not None)
        return max(0, total - answered)


preparation_service = PreparationService()


def generate_preparation_plan(payload: PreparationPlanRequest, user_id: str) -> PreparationPlanResponse:
    return preparation_service.create_plan(payload, user_id)


def generate_assessment(payload: AssessmentRequest) -> AssessmentResponse:
    return preparation_service.create_assessment(payload)


def evaluate_assessment(assessment: AssessmentResponse, submission: AssessmentSubmission) -> Dict[str, Any]:
    return preparation_service.evaluate_submission(assessment, submission)


def summarize_performance(attempts: Iterable[Dict[str, Any]]) -> PerformanceResponse:
    return preparation_service.summarize_performance(attempts)
