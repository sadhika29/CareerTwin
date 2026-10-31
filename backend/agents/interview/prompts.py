"""
Interview Agent Prompts — CareerTwin.
Provides prompts for generating realistic, role-specific, source-attributed mock interview questions
and evaluating candidate responses with granular evidence-based coaching feedback.
"""

INTERVIEW_SYSTEM_PROMPT = """You are VeriBot, the Principal Technical Interviewer and Talent Evaluator for CareerTwin.
You conduct authentic, role-tailored technical, coding, scenario-based, and behavioral mock interviews
modeled on real hiring bars at top tech firms (Google, Amazon, Microsoft) and premier enterprises (HCLTech, TCS).
Always return strict, valid JSON conforming exactly to the requested schema. Do not output markdown codeblocks around the JSON.
"""

def build_interview_question_prompt(
    target_role: str,
    round_type: str,
    count: int = 5,
    difficulty: str = "medium",
    skills: list[str] | None = None,
    company: str | None = None,
    experience_level: str = "fresher",
    resume_context: str | None = None,
    job_description: str | None = None,
) -> str:
    skills_str = ", ".join(skills) if skills else "Data Structures, Algorithms, OS, DBMS, OOP, System Design, REST APIs"
    company_context = f"Company Hiring Pattern: {company} (include authentic company patterns, hiring rubrics, and real interview rigor)" if company else "Company Context: Top Tier Technology Enterprise"
    exp_context = f"Experience Level Target: {experience_level.upper()} (calibrate depth and expectations accordingly)"
    
    resume_prompt = f"\nCandidate Resume Background (Probe real skills & projects):\n{resume_context[:800]}" if resume_context else ""
    jd_prompt = f"\nTarget Job Description Requirements:\n{job_description[:800]}" if job_description else ""

    return f"""Generate {count} realistic, challenging interview questions for the role of '{target_role}'.
{company_context}
{exp_context}
Round Format: {round_type}
Difficulty: {difficulty}
Core Skills: {skills_str}
{resume_prompt}
{jd_prompt}

QUESTION TYPE REQUIREMENTS based on round_type:
- If round_type is 'coding': Questions MUST have question_type = 'coding', including a clear problem statement, input/output constraints, starter_code (Python def signature), and test_cases (with input dict and expected output).
- If round_type is 'scenario': Questions MUST have question_type = 'scenario' presenting a realistic production bug, outage, database bottleneck, or concurrency problem with expected troubleshooting steps.
- If round_type is 'hr' or 'behavioral': Questions MUST have question_type = 'behavioral' probing leadership, conflict, deadlines, or teamwork evaluated via STAR rubric.
- If round_type is 'mcq': Questions MUST have question_type = 'mcq' with 4 distinct options, correct_option letter (A/B/C/D), and technical explanation.
- If round_type is 'resume_based': Questions MUST probe the candidate's specific projects, tools, architectural decisions, and trade-offs.
- If round_type is 'technical' or 'company_specific' or 'mixed': Combine technical concept questions, scenario-based problem solving, and interactive MCQs.

Every question MUST include:
1. question_id: unique string e.g. "q1"
2. question_type: 'mcq' | 'technical_concept' | 'scenario' | 'behavioral' | 'coding'
3. question: the complete, professional question prompt spoken to candidate
4. category: e.g. 'Operating Systems', 'Databases & SQL', 'Concurrency', 'System Design', 'Behavioral (STAR)', 'Coding Algorithms'
5. difficulty: '{difficulty}'
6. source: {{ "platform": "Glassdoor | LeetCode | Reddit | Prepfully | CareerTwin Researched", "url": "https://...", "attribution": "...", "verified": true }}
7. expected_key_points: 3 to 4 concepts the candidate should address
8. For 'mcq': options (array of strings), correct_option ('A'/'B'/'C'/'D'), explanation
9. For 'coding': starter_code, test_cases (list of {{ "input": {{...}}, "expected": ... }}), time_complexity, space_complexity

Return JSON matching this schema:
{{
  "round_type": "{round_type}",
  "target_role": "{target_role}",
  "company": "{company or 'General'}",
  "questions": [
    {{
      "question_id": "q1",
      "question_type": "technical_concept",
      "question": "Clear question text",
      "category": "...",
      "difficulty": "{difficulty}",
      "expected_key_points": ["Point 1", "Point 2"],
      "options": [],
      "correct_option": "",
      "explanation": "",
      "starter_code": "",
      "test_cases": [],
      "source": {{
        "platform": "Glassdoor",
        "url": "https://www.glassdoor.co.in/Interview/index.htm",
        "attribution": "Verified candidate interview pattern",
        "verified": true
      }}
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
    correct_option: str | None = None,
    code_results: dict | None = None,
) -> str:
    expected_str = "\n- ".join(expected_key_points) if expected_key_points else "Standard production best practices, architectural rigor, and edge-case awareness."
    code_ctx = f"\nAutomated Test Case Execution Results:\n{code_results}" if code_results else ""

    return f"""Evaluate this candidate's interview response with high professional rigor.
Target Role: {target_role}
Question Type: {question_type}
Question: {question}
Expected Key Concepts:
- {expected_str}
{code_ctx}

Candidate Response:
\"\"\"{candidate_answer}\"\"\"

Score the response across 4 dimensions (0 to 100 each):
- overall_score
- accuracy_score (technical accuracy / correctness)
- completeness_score (depth, edge cases covered)
- clarity_score (articulation, structure, reasoning)

Provide:
1. strengths: 2-3 specific evidence-based things candidate did well
2. areas_to_improve: 2-3 specific missed concepts or technical inaccuracies
3. ideal_answer: high-standard model answer demonstrating strong seniority
4. feedback_summary: constructive coaching summary
5. skill_gaps: array of specific skills needing practice e.g. ["SQL Indexing", "Async Event Loop"]

Return JSON matching this schema:
{{
  "overall_score": 85.0,
  "accuracy_score": 85.0,
  "completeness_score": 80.0,
  "clarity_score": 90.0,
  "strengths": ["...", "..."],
  "areas_to_improve": ["...", "..."],
  "ideal_answer": "...",
  "feedback_summary": "...",
  "skill_gaps": ["..."]
}}
"""
