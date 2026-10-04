"""
Interview Agent Prompts — CareerTwin.
Provides prompts for generating role-specific interview questions and
evaluating candidate responses with granular coaching feedback.
"""

INTERVIEW_SYSTEM_PROMPT = """You are an expert technical interviewer and executive talent evaluator for top tech firms and global enterprises.
Your goal is to conduct realistic, high-standard mock interviews and evaluate candidate responses with precision, constructive empathy, and actionable feedback.
Always output valid JSON conforming exactly to the requested schema.
"""

def build_interview_question_prompt(
    target_role: str,
    round_type: str,
    count: int = 5,
    difficulty: str = "medium",
    skills: list[str] | None = None,
    company: str | None = None,
) -> str:
    skills_str = ", ".join(skills) if skills else "General Software Engineering, DSA, System Design, Problem Solving"
    company_context = f"Company/Pattern: {company} (include authentic technical patterns, core CS fundamentals, and Sanfoundry-style deep concept questions for this employer)" if company else "Company Context: Top Tier Technology Enterprise (Sanfoundry-style rigorous CS depth)"
    return f"""Generate {count} realistic, challenging interview questions for the role of '{target_role}'.
{company_context}
Round Type: {round_type}
Difficulty: {difficulty}
Relevant Candidate Skills: {skills_str}

Ensure questions test core technical foundation (Data Structures, Algorithms, OS, DBMS, OOP, System Design, coding scenarios).
Each question MUST be structured as an interactive MCQ with 4 to 5 distinct options, optional code snippet, correct answer indicator, and detailed technical explanation so candidates can select options directly or answer verbally in an AI mock interview.

Return JSON with this schema:
{{
  "round_type": "{round_type}",
  "target_role": "{target_role}",
  "difficulty": "{difficulty}",
  "questions": [
    {{
      "question_id": "q1",
      "question": "Clear, contextual question text or problem statement",
      "code_snippet": "def example(): ... (or empty string if non-coding)",
      "options": [
        "A) Detailed option A description",
        "B) Detailed option B description",
        "C) Detailed option C description",
        "D) Detailed option D description"
      ],
      "correct_option": "B",
      "explanation": "Clear explanation of why option B is correct and common pitfalls with other choices.",
      "category": "DSA / System Design / Framework / Behavioral",
      "expected_key_points": [
        "Key concept candidate should explain",
        "Edge case or trade-off to address"
      ],
      "difficulty": "{difficulty}"
    }}
  ]
}}
"""

def build_interview_evaluation_prompt(
    question: str,
    candidate_answer: str,
    target_role: str,
    question_type: str = "technical",
    expected_key_points: list[str] | None = None,
) -> str:
    expected_str = "\n- ".join(expected_key_points) if expected_key_points else "Standard industry best practices and core algorithmic principles."
    return f"""Evaluate this candidate's interview answer:
Target Role: {target_role}
Question ({question_type}): {question}
Expected Key Concepts:
- {expected_str}

Candidate Answer:
\"\"\"{candidate_answer}\"\"\"

Score the answer across accuracy, completeness, and clarity (0-100 each).
Provide:
1. overall_score (0-100)
2. strengths (2-3 bullet points)
3. areas_to_improve (2-3 bullet points)
4. ideal_answer (A concise, model answer demonstrating strong seniority)
5. feedback_summary (Constructive feedback)

Return JSON matching this schema:
{{
  "overall_score": 85.0,
  "accuracy_score": 85.0,
  "completeness_score": 80.0,
  "clarity_score": 90.0,
  "strengths": ["...", "..."],
  "areas_to_improve": ["...", "..."],
  "ideal_answer": "...",
  "feedback_summary": "..."
}}
"""
