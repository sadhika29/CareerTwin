from typing import Dict, Optional

from backend.agents.digital_twin.calculator import DEFAULT_WEIGHTS, DIMENSIONS, calculate_readiness


def recommend_improvement(scores: Dict[str, Optional[float]], increment: float = 10.0) -> Dict[str, object]:
    """
    Choose the improvement with the greatest weighted readiness impact,
    then enrich the result with an AI-generated narrative via PreparationAgent.
    Falls back gracefully if the AI is unavailable.
    """
    current = calculate_readiness(scores)
    best_area = None
    best_projected = -1.0
    best_delta = -1.0

    # Test each dimension's actual post-increment gain
    for a in DIMENSIONS:
        val = scores.get(a)
        if val is None or float(val) >= 100.0:
            continue
        trial = dict(scores)
        trial[a] = min(100.0, float(val) + increment)
        projected = calculate_readiness(trial)["overall_score"]
        delta = round(projected - current["overall_score"], 2)
        if delta > best_delta:
            best_delta = delta
            best_projected = projected
            best_area = a

    if best_area is None:
        raise ValueError("At least one performance score is required")

    priority = "HIGH" if best_delta >= 1.5 else "MEDIUM"

    result = {
        "current_score": current["overall_score"],
        "recommended_area": best_area,
        "estimated_score_after_improvement": best_projected,
        "reason": f"{best_area.replace('_', ' ').title()} offers the highest weighted readiness yield (+{best_delta:.1f}%).",
        "priority": priority,
        "impact": best_delta,
        "recommendation": f"Focus study cycles on {best_area.replace('_', ' ').title()} to maximize placement readiness.",
        "next_steps": [
            f"Complete 3 targeted {best_area.upper()} assessment modules",
            f"Review weak topic concepts identified in {best_area} evaluations",
            f"Re-assess score after 7 days of structured practice",
        ],
        "estimated_impact": f"+{best_delta:.1f}%",
    }

    # ── Enrich with AI-generated planning narrative ───────────────────────────
    try:
        from backend.agents.preparation.agent import PreparationAgent
        agent = PreparationAgent()
        ai_plan = agent.generate_planner_recommendation(
            scores=scores,
            current_score=current["overall_score"],
            recommended_area=best_area,
            estimated_score=best_projected,
        )
        # Merge AI narrative into result (AI fields take precedence for text)
        result["reason"] = ai_plan.get("reason") or result["reason"]
        result["recommendation"] = ai_plan.get("recommendation") or result["recommendation"]
        result["next_steps"] = ai_plan.get("next_steps") or result["next_steps"]
        result["estimated_impact"] = ai_plan.get("estimated_impact") or result["estimated_impact"]
    except Exception:
        # If LLM is unavailable, deterministic fallback is sufficient
        pass

    return result

