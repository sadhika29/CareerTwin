from backend.agents.preparation.assessment import (
    evaluate_assessment,
    generate_assessment,
    generate_remediation_assessment,
)


def test_assessment_generation_returns_questions_and_answers():
    assessment = generate_assessment("DSA", count=4)
    assert assessment["category"] == "DSA"
    assert len(assessment["questions"]) >= 2
    assert assessment["questions"][0]["question_id"]


def test_assessment_evaluation_classifies_passed_failed_and_skipped():
    assessment = generate_assessment("DSA", count=3)
    q1 = assessment["questions"][0]["question_id"]
    q2 = assessment["questions"][1]["question_id"]
    # Question 3 is left unattempted / skipped

    result = evaluate_assessment(
        assessment,
        {
            q1: assessment["questions"][0]["correct_answer"],  # Passed
            q2: "Incorrect Answer Value",                      # Failed
            # q3 omitted -> Skipped
        },
    )

    assert result["total_questions"] == 3
    assert result["correct_answers"] == 1  # 1 passed
    assert result["incorrect_answers"] == 1  # 1 failed
    assert result["unattempted"] == 1  # 1 skipped

    assert len(result["passed_questions"]) == 1
    assert len(result["failed_questions"]) == 1
    assert len(result["skipped_questions"]) == 1

    assert result["passed_questions"][0]["status"] == "passed"
    assert result["failed_questions"][0]["status"] == "failed"
    assert result["skipped_questions"][0]["status"] == "skipped"

    # Weak topics must include topics from BOTH failed and skipped questions
    failed_topic = assessment["questions"][1]["topic"]
    skipped_topic = assessment["questions"][2]["topic"]
    assert failed_topic in result["weak_topics"]
    assert skipped_topic in result["weak_topics"]
    assert len(result["remediation_tasks"]) >= 2


def test_remediation_assessment_isolates_incomplete_work_and_completes():
    assessment = generate_assessment("DSA", count=3)
    q1 = assessment["questions"][0]["question_id"]
    q2 = assessment["questions"][1]["question_id"]
    q3 = assessment["questions"][2]["question_id"]

    initial_answers = {
        q1: assessment["questions"][0]["correct_answer"],  # Passed
        q2: "Wrong Answer",                                # Failed
        # q3 skipped
    }

    # Generate remediation assessment for incomplete (skipped + failed) items
    remediation_asmt = generate_remediation_assessment(assessment, initial_answers)
    assert remediation_asmt["is_remediation"] is True
    assert remediation_asmt["total_questions"] == 2

    incomplete_qids = {q["question_id"] for q in remediation_asmt["questions"]}
    assert q2 in incomplete_qids
    assert q3 in incomplete_qids
    assert q1 not in incomplete_qids  # Already passed question is excluded

    # Now the student completes the left skipped and failed questions!
    remediation_answers = {
        q2: assessment["questions"][1]["correct_answer"],
        q3: assessment["questions"][2]["correct_answer"],
    }

    remediation_result = evaluate_assessment(remediation_asmt, remediation_answers)
    assert remediation_result["score"] == 100.0
    assert remediation_result["correct_answers"] == 2
    assert remediation_result["incorrect_answers"] == 0
    assert remediation_result["unattempted"] == 0
    assert len(remediation_result["weak_topics"]) == 0
