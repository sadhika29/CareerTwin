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
                    "options": ["Kadane's algorithm", "Binary search", "Dijkstra's algorithm", "Depth-first search"],
                    "correct_answer": "Kadane's algorithm",
                    "explanation": "Track the maximum sum ending at each index and maintain the running maximum in O(n).",
                },
                {
                    "question_id": "dsa-2",
                    "topic": payload.topic or "Hashing",
                    "question": "Given a list of integers, find duplicates in O(n) time.",
                    "options": ["Use a hash set", "Nested loops O(n^2)", "Bubble sort", "Binary search tree"],
                    "correct_answer": "Use a hash set",
                    "explanation": "A hash-based lookup provides O(1) average lookup and insertion time.",
                },
                {
                    "question_id": "dsa-3",
                    "topic": payload.topic or "Sliding Window",
                    "question": "Which data structure paired with sliding window is best for min/max sliding window questions?",
                    "options": ["Monotonic deque", "Min heap with log n removal", "Stack", "Linked list"],
                    "correct_answer": "Monotonic deque",
                    "explanation": "A monotonic deque preserves indices in sorted order and allows O(1) amortized min/max queries.",
                },
                {
                    "question_id": "dsa-4",
                    "topic": payload.topic or "Dynamic Programming",
                    "question": "What is the optimal substructure property in dynamic programming?",
                    "options": [
                        "Optimal solution to a problem contains optimal solutions to its subproblems",
                        "Subproblems do not overlap",
                        "Greedy choice at every step leads to global optimum",
                        "Memory can be reduced to O(0)"
                    ],
                    "correct_answer": "Optimal solution to a problem contains optimal solutions to its subproblems",
                    "explanation": "Optimal substructure allows building the global optimal solution from previously solved subproblems.",
                },
            ],
            "Aptitude": [
                {
                    "question_id": "apt-1",
                    "topic": payload.topic or "Percentages",
                    "question": "A product's price increases by 20% and then decreases by 20%. What is the net effect?",
                    "options": ["4% decrease", "0% change", "2% decrease", "4% increase"],
                    "correct_answer": "4% decrease",
                    "explanation": "A 20% rise followed by 20% fall results in (1.2 * 0.8) = 0.96, or a 4% net decrease.",
                },
                {
                    "question_id": "apt-2",
                    "topic": payload.topic or "Time and Work",
                    "question": "Pipe A fills a tank in 4 hours and Pipe B empties it in 6 hours. Open together, the tank fills in:",
                    "options": ["12 hours", "10 hours", "8 hours", "5 hours"],
                    "correct_answer": "12 hours",
                    "explanation": "Net rate = 1/4 - 1/6 = (3 - 2)/12 = 1/12 per hour, taking 12 hours total.",
                },
            ],
            "Technical": [
                {
                    "question_id": "tech-1",
                    "topic": payload.topic or "SQL",
                    "question": "Write a query to fetch the top 3 highest salaries from a table.",
                    "options": [
                        "SELECT * FROM employees ORDER BY salary DESC LIMIT 3;",
                        "SELECT TOP 3 FROM employees;",
                        "SELECT MAX(salary, 3) FROM employees;",
                        "SELECT * FROM employees WHERE salary > 3;"
                    ],
                    "correct_answer": "SELECT * FROM employees ORDER BY salary DESC LIMIT 3;",
                    "explanation": "Sort descending on salary and limit the rows to 3.",
                },
                {
                    "question_id": "tech-2",
                    "topic": payload.topic or "System Design",
                    "question": "What is the primary benefit of adding a read-replica to a relational database?",
                    "options": [
                        "Offload read traffic from primary database to scale read throughput",
                        "Speed up complex write transactions",
                        "Eliminate all network latency",
                        "Replace application-level caching entirely"
                    ],
                    "correct_answer": "Offload read traffic from primary database to scale read throughput",
                    "explanation": "Read replicas receive replicated data and serve high-volume read queries without blocking writes.",
                },
            ],
            "Communication": [
                {
                    "question_id": "comm-1",
                    "topic": payload.topic or "Professional Communication",
                    "question": "Rewrite this sentence in a professional tone: 'I need the report soon.'",
                    "options": [
                        "I would appreciate the report at your earliest convenience.",
                        "Send me the report ASAP!",
                        "Where is the report I asked for?",
                        "Give me the file immediately."
                    ],
                    "correct_answer": "I would appreciate the report at your earliest convenience.",
                    "explanation": "Professional communication uses polite, respectful, and clear wording.",
                },
            ],
        }
        questions = question_bank.get(payload.category, question_bank["Technical"])[: max(1, payload.number_of_questions)]
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
        total = len(assessment.questions)
        correct_count = 0
        incorrect_count = 0
        unattempted_count = 0

        question_results: List[Dict[str, Any]] = []
        passed_questions: List[Dict[str, Any]] = []
        failed_questions: List[Dict[str, Any]] = []
        skipped_questions: List[Dict[str, Any]] = []
        weak_topics_set = set()
        per_topic: Dict[str, Dict[str, int]] = {}

        for question in assessment.questions:
            q_dict = question if isinstance(question, dict) else question.model_dump()
            qid = q_dict["question_id"]
            topic = q_dict.get("topic", "General")
            correct_ans = str(q_dict.get("correct_answer", "")).strip().lower()
            user_val = submission.answers.get(qid)
            user_ans = str(user_val).strip() if user_val is not None else ""

            per_topic.setdefault(topic, {"correct": 0, "total": 0})
            per_topic[topic]["total"] += 1

            is_skipped = user_val is None or user_ans == ""
            is_passed = not is_skipped and (user_ans.lower() == correct_ans or correct_ans in user_ans.lower())

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
                "category": q_dict.get("category", assessment.category),
                "topic": topic,
                "difficulty": q_dict.get("difficulty", "medium"),
                "question": q_dict.get("question", ""),
                "options": q_dict.get("options", []),
                "user_answer": user_val,
                "correct_answer": q_dict.get("correct_answer"),
                "status": status,
                "explanation": q_dict.get("explanation", ""),
            }
            question_results.append(result_item)

            if status == "passed":
                passed_questions.append(result_item)
            elif status == "failed":
                failed_questions.append(result_item)
            else:
                skipped_questions.append(result_item)

        for topic_name, stats in per_topic.items():
            topic_accuracy = (stats["correct"] / stats["total"]) * 100 if stats["total"] else 0
            if topic_accuracy < 60:
                weak_topics_set.add(topic_name)

        score = round((correct_count / total) * 100, 2) if total else 0.0
        attempted = total - unattempted_count
        accuracy = round((correct_count / attempted) * 100, 2) if attempted > 0 else 0.0

        remediation_tasks = []
        for item in failed_questions:
            remediation_tasks.append(f"Remediate failed concept in {item['topic']}: review explanation and re-attempt")
        for item in skipped_questions:
            remediation_tasks.append(f"Complete skipped question in {item['topic']}: practice under timed conditions")

        return {
            "assessment_id": assessment.assessment_id,
            "user_id": submission.user_id,
            "category": assessment.category,
            "score": score,
            "accuracy": accuracy,
            "total_questions": total,
            "correct_answers": correct_count,
            "incorrect_answers": incorrect_count,
            "unattempted": unattempted_count,
            "time_taken": submission.time_taken,
            "weak_topics": sorted(list(weak_topics_set)),
            "topic_wise_performance": {k: round((v["correct"] / v["total"]) * 100, 2) if v["total"] else 0.0 for k, v in per_topic.items()},
            "question_results": question_results,
            "passed_questions": passed_questions,
            "failed_questions": failed_questions,
            "skipped_questions": skipped_questions,
            "remediation_tasks": remediation_tasks,
            "status": "submitted",
            "completed_at": datetime.utcnow().isoformat(),
        }

    def create_remediation_assessment(
        self,
        original_assessment: AssessmentResponse,
        submission: AssessmentSubmission,
        include_skipped: bool = True,
        include_failed: bool = True,
    ) -> AssessmentResponse:
        report = self.evaluate_submission(original_assessment, submission)
        needed_ids = set()
        if include_failed:
            needed_ids.update(item["question_id"] for item in report["failed_questions"])
        if include_skipped:
            needed_ids.update(item["question_id"] for item in report["skipped_questions"])

        filtered_questions = [
            q for q in original_assessment.questions
            if (q.question_id if hasattr(q, "question_id") else q.get("question_id")) in needed_ids
        ]

        return AssessmentResponse(
            assessment_id=f"remediation_{original_assessment.assessment_id}",
            user_id=submission.user_id,
            category=original_assessment.category,
            topic=original_assessment.topic,
            difficulty=original_assessment.difficulty,
            questions=filtered_questions,
            duration=max(5, len(filtered_questions) * 5),
            created_at=datetime.utcnow(),
        )

    def summarize_performance(self, attempts: Iterable[Dict[str, Any]]) -> PerformanceResponse:
        attempts = list(attempts)
        if not attempts:
            return PerformanceResponse(
                strong_topics=[],
                weak_topics=[],
                slow_topics=[],
                trend="stable",
                score=0.0,
                total_assessments=0,
                total_passed=0,
                total_failed=0,
                total_skipped=0,
            )
        per_topic: Dict[str, List[float]] = {}
        total_passed = 0
        total_failed = 0
        total_skipped = 0

        for attempt in attempts:
            total_passed += int(attempt.get("correct_answers", 0) or 0)
            total_failed += int(attempt.get("incorrect_answers", 0) or 0)
            total_skipped += int(attempt.get("unattempted", 0) or 0)
            for topic, score in (attempt.get("topic_wise_performance") or attempt.get("topic_scores") or {}).items():
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
            total_assessments=len(attempts),
            total_passed=total_passed,
            total_failed=total_failed,
            total_skipped=total_skipped,
        )

    def _prioritize_topics(self, payload: PreparationPlanRequest) -> List[str]:
        skill_gaps = [topic for topic in payload.skill_gaps if topic]
        if not skill_gaps:
            skill_gaps = ROLE_TOPIC_MAP.get(payload.target_role.lower(), []) + GENERIC_DEMANDS
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
        answered = sum(
            1 for question in assessment.questions
            if submission.answers.get(
                question.question_id if hasattr(question, "question_id") else question.get("question_id")
            ) is not None and str(submission.answers.get(
                question.question_id if hasattr(question, "question_id") else question.get("question_id")
            )).strip() != ""
        )
        return max(0, total - answered)


preparation_service = PreparationService()


def generate_preparation_plan(payload: PreparationPlanRequest, user_id: str) -> PreparationPlanResponse:
    return preparation_service.create_plan(payload, user_id)


def generate_assessment(payload: AssessmentRequest) -> AssessmentResponse:
    return preparation_service.create_assessment(payload)


def evaluate_assessment(assessment: AssessmentResponse, submission: AssessmentSubmission) -> Dict[str, Any]:
    return preparation_service.evaluate_submission(assessment, submission)


def create_remediation_assessment(
    original_assessment: AssessmentResponse,
    submission: AssessmentSubmission,
    include_skipped: bool = True,
    include_failed: bool = True,
) -> AssessmentResponse:
    return preparation_service.create_remediation_assessment(
        original_assessment, submission, include_skipped, include_failed
    )


def summarize_performance(attempts: Iterable[Dict[str, Any]]) -> PerformanceResponse:
    return preparation_service.summarize_performance(attempts)

