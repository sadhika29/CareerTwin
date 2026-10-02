import json
import re
from typing import Any

from backend.schemas.skill import (
    PriorityLevel,
    SkillAnalysisResponse,
    SkillGapItem,
)
from backend.services.llm_service import LLMService
from backend.services.skill_service import SkillService

from .prompts import (
    SKILL_ANALYSIS_SYSTEM_PROMPT,
    build_skill_analysis_prompt,
)


class SkillAgent:
    """Agent responsible for skill gap analysis and prioritization."""

    def __init__(
        self,
        llm_client: LLMService | None = None,
        skill_service: SkillService | None = None,
    ):
        if llm_client is None:
            try:
                self.llm_client = LLMService()
            except Exception:
                self.llm_client = None
        else:
            self.llm_client = llm_client
        self.skill_service = skill_service or SkillService()

    def analyze(
        self,
        current_skills: list[str],
        required_skills: list[str],
        target_role: str | None = None,
        additional_context: str | None = None,
    ) -> SkillAnalysisResponse:
        """
        Analyze skill gaps between current skills and target requirements.
        Combines deterministic normalization & ranking with LLM insights when available.
        """
        # 1. Deterministic baseline
        norm_current = self.skill_service.normalize_skill_list(current_skills)
        norm_required = self.skill_service.normalize_skill_list(required_skills)

        matched, gaps, gap_score = self.skill_service.compare_skills(
            current_skills=norm_current,
            required_skills=norm_required,
        )

        priority_items = self.skill_service.prioritize_gaps(
            skill_gaps=gaps,
            target_role=target_role or "",
        )

        recommendations = self.skill_service.generate_recommendations(
            priority_skills=priority_items,
            target_role=target_role or "",
        )

        # 2. LLM Enhancement (if client configured)
        if self.llm_client is not None:
            try:
                prompt = build_skill_analysis_prompt(
                    current_skills=norm_current,
                    required_skills=norm_required,
                    target_role=target_role,
                    additional_context=additional_context,
                )

                response = self.llm_client.generate_json(
                    system_prompt=SKILL_ANALYSIS_SYSTEM_PROMPT,
                    prompt=prompt,
                )

                if isinstance(response, str):
                    clean_resp = response.strip()
                    clean_resp = re.sub(r"^```json\s*", "", clean_resp, flags=re.IGNORECASE)
                    clean_resp = re.sub(r"\s*```$", "", clean_resp)
                    data = json.loads(clean_resp)

                    if isinstance(data, dict):
                        llm_recs = data.get("learning_recommendations")
                        if isinstance(llm_recs, list) and llm_recs:
                            recommendations = llm_recs

                        # Enrich priority reasons if provided by LLM
                        llm_priorities = data.get("priority_skills", [])
                        if isinstance(llm_priorities, list) and llm_priorities:
                            enriched_items = []
                            for p in llm_priorities:
                                if isinstance(p, dict) and "skill_name" in p:
                                    raw_priority = str(p.get("priority", "MEDIUM")).upper()
                                    priority_enum = (
                                        PriorityLevel[raw_priority]
                                        if raw_priority in PriorityLevel.__members__
                                        else PriorityLevel.MEDIUM
                                    )
                                    enriched_items.append(
                                        SkillGapItem(
                                            skill_id=p.get("skill_id", f"skill_{len(enriched_items)+1}"),
                                            skill_name=self.skill_service.normalize_skill_name(p["skill_name"]),
                                            priority=priority_enum,
                                            category=p.get("category", "General"),
                                            target_role=target_role or "",
                                            reason=p.get("reason", "Required for target role."),
                                            prerequisites=p.get("prerequisites", []),
                                        )
                                    )
                            if enriched_items:
                                priority_items = enriched_items

            except Exception:
                # LLM call failed or returned unparseable JSON; fall back gracefully to deterministic analysis
                pass

        return SkillAnalysisResponse(
            current_skills=norm_current,
            required_skills=norm_required,
            matched_skills=matched,
            skill_gaps=gaps,
            skill_gap_score=gap_score,
            priority_skills=priority_items,
            learning_recommendations=recommendations,
        )

    def to_career_manager_envelope(self, analysis: SkillAnalysisResponse) -> dict[str, Any]:
        """Wrap output for Yamini's Career Manager contract (Section 32)."""
        return {
            "agent": "skill",
            "status": "success",
            "data": analysis.model_dump(),
        }
