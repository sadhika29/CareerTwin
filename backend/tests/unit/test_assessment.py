from backend.agents.preparation.assessment import evaluate_assessment, generate_assessment


def test_assessment_generation_returns_questions_and_answers():
    assessment = generate_assessment("DSA", count=2)
    assert assessment["category"] == "DSA"
    assert len(assessment["questions"]) == 2
    assert assessment["questions"][0]["question_id"]

    result = evaluate_assessment(
        assessment,
        {
            assessment["questions"][0]["question_id"]: "Kadane's algorithm",
            assessment["questions"][1]["question_id"]: "Wrong answer",
        },
    )
    assert result["correct_answers"] >= 1
    assert result["score"] >= 0
    assert result["weak_topics"]
