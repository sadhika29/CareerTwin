from typing import List


ROUTE_AGENTS = {
	"resume": ["resume"],
	"job": ["jobs"],
	"skill": ["skills"],
	"preparation": ["preparation"],
	"interview": ["interview"],
	"readiness": ["digital_twin"],
	"what-if": ["digital_twin", "planner"],
	"full": ["resume", "jobs", "skills", "preparation", "interview", "digital_twin", "planner"],
}


def select_route(request: str) -> List[str]:
	"""Return only the agents needed for a plain-language career request."""
	text = request.strip().lower()
	if not text:
		raise ValueError("A career request is required")
	if "what should" in text or "what-if" in text or "improve first" in text:
		return ROUTE_AGENTS["what-if"]
	if "full" in text or "complete" in text or "career analysis" in text:
		return ROUTE_AGENTS["full"]
	if "readiness" in text or "ready" in text:
		return ROUTE_AGENTS["readiness"]
	if "interview" in text:
		return ROUTE_AGENTS["interview"]
	if any(word in text for word in ("dsa", "aptitude", "communication", "technical", "preparation")):
		return ROUTE_AGENTS["preparation"]
	if "skill" in text or "missing" in text or "gap" in text:
		return ROUTE_AGENTS["skill"]
	if "job" in text or "match" in text:
		return ROUTE_AGENTS["job"]
	if "resume" in text or "cv" in text:
		return ROUTE_AGENTS["resume"]
	raise ValueError("Unsupported career request")
