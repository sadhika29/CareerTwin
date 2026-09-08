from typing import Dict, Optional

from backend.agents.digital_twin.calculator import DEFAULT_WEIGHTS, DIMENSIONS, calculate_readiness


def recommend_improvement(scores: Dict[str, Optional[float]], increment: float = 10.0) -> Dict[str, object]:
	"""Choose the improvement with the greatest weighted readiness impact."""
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
	return {
		"current_score": current["overall_score"],
		"recommended_area": area,
		"estimated_score_after_improvement": projected,
		"reason": f"{area.replace('_', ' ').title()} is currently the highest-impact improvement.",
		"priority": priority,
		"impact": round(projected - current["overall_score"], 2),
	}
