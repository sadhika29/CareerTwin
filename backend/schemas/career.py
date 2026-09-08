from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class CareerAnalyzeRequest(BaseModel):
	target_role: Optional[str] = None
	target_job_id: Optional[str] = None
	scores: Dict[str, float] = Field(default_factory=dict)
	profile: Dict[str, object] = Field(default_factory=dict)


class CareerResponse(BaseModel):
	user_id: str
	target_role: Optional[str] = None
	target_job_id: Optional[str] = None
	readiness_score: Optional[float] = None
	skill_gaps: List[str] = Field(default_factory=list)
	weakest_area: Optional[str] = None
	next_action: Optional[str] = None
	what_if: Optional[Dict[str, object]] = None


class WhatIfRequest(BaseModel):
	scores: Dict[str, float] = Field(default_factory=dict)
