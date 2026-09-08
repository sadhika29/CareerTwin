from typing import Dict, Optional


DIMENSIONS = ("resume", "dsa", "aptitude", "communication", "technical", "interview", "job_match")
DEFAULT_WEIGHTS = {
	"resume": 0.15,
	"dsa": 0.15,
	"aptitude": 0.10,
	"communication": 0.10,
	"technical": 0.20,
	"interview": 0.15,
	"job_match": 0.15,
}


def calculate_readiness(scores: Dict[str, Optional[float]], weights: Optional[Dict[str, float]] = None) -> Dict[str, object]:
	"""Calculate a weighted readiness score from the student's available scores."""
	configured = weights or DEFAULT_WEIGHTS
	normalized = {name: _clamp(scores.get(name)) for name in DIMENSIONS}
	available = {name: value for name, value in normalized.items() if value is not None}
	if not available:
		raise ValueError("At least one performance score is required")
	total_weight = sum(configured.get(name, 0.0) for name in available)
	overall = sum(value * configured.get(name, 0.0) for name, value in available.items()) / total_weight
	weakest = min(available, key=available.get)
	return {
		"overall_score": round(overall, 2),
		**{name: value for name, value in normalized.items() if value is not None},
		"weakest_area": weakest,
		"recommended_action": f"Improve {weakest.replace('_', ' ')} performance by 10 points",
	}


def _clamp(value: Optional[float]) -> Optional[float]:
	if value is None:
		return None
	return max(0.0, min(100.0, float(value)))
