from typing import Dict, Optional

from backend.agents.digital_twin.calculator import DEFAULT_WEIGHTS, DIMENSIONS, calculate_readiness


def recommend_improvement(scores: Dict[str, Optional[float]], increment: float = 10.0) -> Dict[str, object]:
    """
    Choose the improvement with the greatest weighted readiness impact,
    then enrich the result with an AI-generated narrative via PreparationAgent.
    Falls back gracefully if the AI is unavailable.
    """
    current = calculate_readiness(scores)
    candidates = {}
    for area in DIMENSIONS:
        if scores.get(area) is None:
            continue
        trial = dict(scores)
        trial[area] = min(100.0, float(trial[area]) + increment)
        candidates[area] = calculate_readiness(trial)["overall_score"]
    if not candidates:
        raise ValueError("At least one performance score is required")

    area = max(candidates, key=candidates.get)
    projected = candidates[area]
    priority = "HIGH" if projected - current["overall_score"] >= 1.5 else "MEDIUM"
    impact = round(projected - current["overall_score"], 2)

    result = {
        "current_score": current["overall_score"],
        "recommended_area": area,
        "estimated_score_after_improvement": projected,
        "reason": f"{area.replace('_', ' ').title()} is currently the highest-impact improvement.",
        "priority": priority,
        "impact": impact,
    }

    # ── Enrich with AI-generated planning narrative ───────────────────────────
    try:
        from backend.agents.preparation.agent import PreparationAgent
        agent = PreparationAgent()
        ai_plan = agent.generate_planner_recommendation(
            scores=scores,
            current_score=current["overall_score"],
            recommended_area=area,
            estimated_score=projected,
        )
        # Merge AI narrative into result (AI fields take precedence for text)
        result["reason"] = ai_plan.get("reason") or result["reason"]
        result["recommendation"] = ai_plan.get("recommendation") or ""
        result["next_steps"] = ai_plan.get("next_steps") or []
        result["estimated_impact"] = ai_plan.get("estimated_impact") or f"+{impact:.1f}%"
    except Exception:
        # If LLM is unavailable, deterministic fallback is sufficient
        result["next_steps"] = []
        result["estimated_impact"] = f"+{impact:.1f}%"

    return result
