from datetime import datetime, timezone
from uuid import uuid4

from backend.database.firestore import FirestoreDatabase
from backend.models.job import Job
from backend.services.job_parser import parse_job_description


class JobService:
    """Service responsible for creating and retrieving jobs."""

    def __init__(self, database: FirestoreDatabase | None = None):
        self.database = database or FirestoreDatabase()

    def create_job(
        self,
        user_id: str,
        title: str,
        company: str,
        location: str,
        job_url: str = "",
        description: str = "",
        required_skills: list[str] | None = None,
        preferred_skills: list[str] | None = None,
        experience_requirements: list[str] | None = None,
        qualifications: list[str] | None = None,
        responsibilities: list[str] | None = None,
        keywords: list[str] | None = None,
    ) -> Job:

        if not user_id or not user_id.strip():
            raise ValueError("user_id cannot be empty.")

        if not description or not description.strip():
            raise ValueError("Job description cannot be empty.")

        job_id = str(uuid4())
        now = datetime.now(timezone.utc)

        job = Job(
            job_id=job_id,
            user_id=user_id,
            title=title,
            company=company,
            location=location,
            job_url=job_url,
            description=description,
            required_skills=required_skills or [],
            preferred_skills=preferred_skills or [],
            experience_requirements=experience_requirements or [],
            qualifications=qualifications or [],
            responsibilities=responsibilities or [],
            keywords=keywords or [],
            created_at=now,
            updated_at=now,
        )

        self.database.create(
            collection="jobs",
            document_id=job_id,
            data={
                "job_id": job.job_id,
                "user_id": job.user_id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "job_url": job.job_url,
                "description": job.description,
                "required_skills": job.required_skills,
                "preferred_skills": job.preferred_skills,
                "experience_requirements": job.experience_requirements,
                "qualifications": job.qualifications,
                "responsibilities": job.responsibilities,
                "keywords": job.keywords,
                "created_at": now,
                "updated_at": now,
            },
        )

        return job

    def create_job_from_description(
        self,
        user_id: str,
        description: str,
        title: str = "",
        company: str = "",
        location: str = "",
        job_url: str = "",
    ) -> Job:

        parsed = parse_job_description(
            description=description,
            title=title,
            company=company,
            location=location,
        )

        return self.create_job(
            user_id=user_id,
            title=parsed["title"],
            company=parsed["company"],
            location=parsed["location"],
            job_url=job_url,
            description=parsed["description"],
            required_skills=parsed["required_skills"],
            preferred_skills=parsed["preferred_skills"],
            experience_requirements=parsed["experience_requirements"],
            qualifications=parsed["qualifications"],
            responsibilities=parsed["responsibilities"],
            keywords=parsed["keywords"],
        )

    def get_job(
        self,
        job_id: str,
        user_id: str = "",
        require_ownership: bool = False,
    ) -> Job:

        if not job_id:
            raise ValueError("job_id cannot be empty.")

        document = self.database.get(
            collection="jobs",
            document_id=job_id,
        )

        if document is None:
            raise FileNotFoundError(
                f"Job not found: {job_id}"
            )

        doc_user = document.get("user_id", "")
        if require_ownership and doc_user != user_id:
            raise ValueError(
                "Job does not belong to this user."
            )
        elif not require_ownership and user_id and doc_user not in (user_id, "shared_catalog", "system", "live_market", ""):
            # If ownership is not strictly required, allow viewing shared catalog jobs
            # but reject if it belongs exclusively to another specific private user
            if doc_user and doc_user != user_id and not doc_user.startswith("shared_"):
                raise ValueError("Job does not belong to this user.")

        return Job(
            job_id=document.get("job_id", job_id),
            user_id=document.get("user_id", ""),
            title=document.get("title", ""),
            company=document.get("company", ""),
            location=document.get("location", ""),
            job_url=document.get("job_url", ""),
            description=document.get("description", ""),
            required_skills=document.get(
                "required_skills",
                [],
            ),
            preferred_skills=document.get(
                "preferred_skills",
                [],
            ),
            experience_requirements=document.get(
                "experience_requirements",
                [],
            ),
            qualifications=document.get(
                "qualifications",
                [],
            ),
            responsibilities=document.get(
                "responsibilities",
                [],
            ),
            keywords=document.get(
                "keywords",
                [],
            ),
            created_at=document.get("created_at"),
            updated_at=document.get("updated_at"),
        )

    def list_jobs(
        self,
        user_id: str,
        limit: int = 50,
    ) -> list[Job]:
        """List all jobs created by or assigned to a user."""
        if not user_id or not user_id.strip():
            raise ValueError("user_id cannot be empty.")

        documents = self.database.list(
            collection="jobs",
            filters={"user_id": user_id},
            limit=limit,
        )

        jobs = []
        for document in documents:
            jobs.append(
                Job(
                    job_id=document.get("job_id", ""),
                    user_id=document.get("user_id", ""),
                    title=document.get("title", ""),
                    company=document.get("company", ""),
                    location=document.get("location", ""),
                    job_url=document.get("job_url", ""),
                    description=document.get("description", ""),
                    required_skills=document.get("required_skills", []),
                    preferred_skills=document.get("preferred_skills", []),
                    experience_requirements=document.get(
                        "experience_requirements", []
                    ),
                    qualifications=document.get("qualifications", []),
                    responsibilities=document.get("responsibilities", []),
                    keywords=document.get("keywords", []),
                    created_at=document.get("created_at"),
                    updated_at=document.get("updated_at"),
                )
            )

        return jobs

    def delete_job(
        self,
        job_id: str,
        user_id: str,
    ) -> None:
        """Delete a job after verifying ownership."""
        _ = self.get_job(job_id=job_id, user_id=user_id, require_ownership=True)
        self.database.delete(collection="jobs", document_id=job_id)

    def check_eligibility(
        self,
        job_id: str,
        user_id: str,
        education: str | None = None,
        experience_years: float | None = None,
        candidate_skills: list[str] | None = None,
    ) -> dict:
        """
        Deterministically evaluate candidate eligibility for a job.
        Checks education, experience requirements, and critical skills.
        """
        job = self.get_job(job_id=job_id, user_id=user_id)
        candidate_skills = candidate_skills or []
        candidate_skills_norm = {
            s.strip().lower() for s in candidate_skills if s.strip()
        }

        matched_requirements: list[str] = []
        missing_requirements: list[str] = []

        # 1. Education check
        if job.qualifications:
            qual_text = " ".join(job.qualifications).lower()
            if education and education.strip():
                edu_clean = education.strip().lower()
                # Common degree keywords check
                degree_keywords = [
                    "b.tech", "btech", "b.e", "be", "bachelor", "bs",
                    "b.sc", "bsc", "m.tech", "mtech", "master", "ms",
                    "mca", "bca", "computer science", "it", "engineering",
                ]
                has_degree = any(dk in edu_clean for dk in degree_keywords)
                req_degree = any(dk in qual_text for dk in degree_keywords)

                if has_degree or not req_degree or any(word in qual_text for word in edu_clean.split()):
                    matched_requirements.append(f"Education: {education}")
                else:
                    missing_requirements.append(
                        f"Required qualification not satisfied. Expected: {', '.join(job.qualifications)}"
                    )
            else:
                missing_requirements.append("Education details not provided.")
        else:
            matched_requirements.append("No strict education restriction specified.")

        # 2. Experience check
        min_required_years = 0.0
        if job.experience_requirements:
            import re
            exp_text = " ".join(job.experience_requirements)
            match = re.search(r"(\d+)(?:\s*(?:-|to)\s*(\d+))?\s*\+?\s*years?", exp_text, re.IGNORECASE)
            if match:
                min_required_years = float(match.group(1))

        if min_required_years > 0:
            cand_exp = experience_years if experience_years is not None else 0.0
            if cand_exp >= min_required_years:
                matched_requirements.append(
                    f"Experience: {cand_exp} years meets required {min_required_years} years"
                )
            else:
                missing_requirements.append(
                    f"Experience: requires at least {min_required_years} years (candidate has {cand_exp})"
                )
        else:
            matched_requirements.append("Fresher / entry-level or no minimum experience required.")

        # 3. Required skills check (at least 50% threshold for base eligibility)
        if job.required_skills:
            from backend.services.skill_service import SkillService
            skill_svc = SkillService()
            candidate_canonical = {
                skill_svc.normalize_skill_name(s).strip().lower() for s in candidate_skills if s.strip()
            }
            def _skill_matches(s: str) -> bool:
                sl = s.strip().lower()
                sc = skill_svc.normalize_skill_name(s).strip().lower()
                return sl in candidate_skills_norm or sl in candidate_canonical or sc in candidate_skills_norm or sc in candidate_canonical

            matched_req_skills = [
                s for s in job.required_skills
                if _skill_matches(s)
            ]
            missing_req_skills = [
                s for s in job.required_skills
                if not _skill_matches(s)
            ]

            req_ratio = len(matched_req_skills) / len(job.required_skills)
            if req_ratio >= 0.5:
                matched_requirements.append(
                    f"Skills threshold met ({len(matched_req_skills)}/{len(job.required_skills)} required skills matched)"
                )
            else:
                missing_requirements.append(
                    f"Skills below minimum threshold: missing {', '.join(missing_req_skills[:3])}"
                )

        eligible = len(missing_requirements) == 0

        return {
            "eligible": eligible,
            "matched_requirements": matched_requirements,
            "missing_requirements": missing_requirements,
            "details": {
                "min_experience_required": min_required_years,
                "candidate_experience": experience_years or 0.0,
            },
        }

    def calculate_job_match(
        self,
        job_id: str,
        user_id: str,
        candidate_skills: list[str],
        education: str | None = None,
        experience_years: float | None = None,
        target_role: str | None = None,
        weights: dict | None = None,
        job_fallback_data: dict | None = None,
    ) -> dict:
        """
        Calculate a multi-factor weighted job match score.
        Weights default to:
        - 40% required skills
        - 20% preferred skills
        - 15% education
        - 15% experience
        - 10% role alignment
        """
        job = None
        try:
            job = self.get_job(job_id=job_id, user_id=user_id)
        except Exception:
            if job_fallback_data and isinstance(job_fallback_data, dict):
                req_skills = job_fallback_data.get("required_skills") or []
                pref_skills = job_fallback_data.get("preferred_skills") or []
                desc = job_fallback_data.get("description", "")
                if not req_skills and desc:
                    from backend.services.skill_service import SkillService
                    extracted = SkillService.extract_skills(f"{job_fallback_data.get('title', '')}\n{desc}")
                    req_skills = extracted[:6]
                    pref_skills = extracted[6:12]

                job = Job(
                    job_id=job_id,
                    user_id=user_id,
                    title=job_fallback_data.get("title") or "Software Engineer",
                    company=job_fallback_data.get("company") or "Technology Company",
                    location=job_fallback_data.get("location") or "Remote",
                    job_url=job_fallback_data.get("job_url") or "",
                    description=desc,
                    required_skills=req_skills,
                    preferred_skills=pref_skills,
                    experience_requirements=job_fallback_data.get("experience_requirements") or [],
                    qualifications=job_fallback_data.get("qualifications") or [],
                    responsibilities=job_fallback_data.get("responsibilities") or [],
                    keywords=req_skills[:8],
                )
                try:
                    self.database.create(
                        collection="jobs",
                        document_id=job_id,
                        data={
                            **job.__dict__,
                            "created_at": datetime.now(timezone.utc),
                            "updated_at": datetime.now(timezone.utc),
                        },
                    )
                except Exception:
                    pass

        if job is None:
            raise FileNotFoundError(f"Job not found: {job_id}")

        w_req = weights.get("required_skills", 0.40) if weights else 0.40
        w_pref = weights.get("preferred_skills", 0.20) if weights else 0.20
        w_edu = weights.get("education", 0.15) if weights else 0.15
        w_exp = weights.get("experience", 0.15) if weights else 0.15
        w_role = weights.get("role_alignment", 0.10) if weights else 0.10

        cand_skills_norm = {
            s.strip().lower() for s in candidate_skills if s.strip()
        }
        from backend.services.skill_service import SkillService
        skill_svc = SkillService()
        cand_canonical = {
            skill_svc.normalize_skill_name(s).strip().lower() for s in candidate_skills if s.strip()
        }

        def _matches(s: str) -> bool:
            sl = s.strip().lower()
            sc = skill_svc.normalize_skill_name(s).strip().lower()
            return sl in cand_skills_norm or sl in cand_canonical or sc in cand_skills_norm or sc in cand_canonical

        # 1. Required Skills Match
        matched_required = [
            s for s in job.required_skills
            if _matches(s)
        ]
        missing_required = [
            s for s in job.required_skills
            if not _matches(s)
        ]
        if job.required_skills:
            skill_match_score = round(
                (len(matched_required) / len(job.required_skills)) * 100.0, 2
            )
        else:
            skill_match_score = 100.0

        # 2. Preferred Skills Match
        matched_preferred = [
            s for s in job.preferred_skills
            if _matches(s)
        ]
        missing_preferred = [
            s for s in job.preferred_skills
            if not _matches(s)
        ]
        if job.preferred_skills:
            preferred_match_score = round(
                (len(matched_preferred) / len(job.preferred_skills)) * 100.0, 2
            )
        else:
            preferred_match_score = 100.0

        # 3. Education Match Score
        education_score = 100.0
        if job.qualifications:
            if education and education.strip():
                edu_clean = education.strip().lower()
                qual_text = " ".join(job.qualifications).lower()
                degree_keywords = [
                    "b.tech", "btech", "b.e", "be", "bachelor", "bs",
                    "b.sc", "bsc", "m.tech", "mtech", "master", "ms",
                ]
                if any(k in edu_clean and k in qual_text for k in degree_keywords):
                    education_score = 100.0
                elif any(k in edu_clean for k in degree_keywords):
                    education_score = 80.0
                else:
                    education_score = 60.0
            else:
                education_score = 50.0

        # 4. Experience Match Score
        experience_score = 100.0
        min_required_years = 0.0
        if job.experience_requirements:
            import re
            exp_text = " ".join(job.experience_requirements)
            match = re.search(r"(\d+)(?:\s*(?:-|to)\s*(\d+))?\s*\+?\s*years?", exp_text, re.IGNORECASE)
            if match:
                min_required_years = float(match.group(1))

        if min_required_years > 0:
            cand_exp = experience_years if experience_years is not None else 0.0
            if cand_exp >= min_required_years:
                experience_score = 100.0
            else:
                experience_score = round(
                    min(100.0, (cand_exp / min_required_years) * 100.0), 2
                )
        else:
            experience_score = 100.0

        # 5. Role Alignment Score
        role_score = 85.0
        if target_role and target_role.strip():
            target_clean = target_role.strip().lower()
            title_clean = job.title.strip().lower()
            if target_clean in title_clean or title_clean in target_clean:
                role_score = 100.0
            else:
                role_words = set(target_clean.split())
                title_words = set(title_clean.split())
                overlap = role_words & title_words
                if overlap:
                    role_score = 80.0
                else:
                    role_score = 60.0

        # Weighted Total Score
        total_job_match = (
            (skill_match_score * w_req)
            + (preferred_match_score * w_pref)
            + (education_score * w_edu)
            + (experience_score * w_exp)
            + (role_score * w_role)
        )
        total_job_match = round(min(100.0, max(0.0, total_job_match)), 2)

        eligibility_result = self.check_eligibility(
            job_id=job_id,
            user_id=user_id,
            education=education,
            experience_years=experience_years,
            candidate_skills=candidate_skills,
        )

        all_matched = list(dict.fromkeys(matched_required + matched_preferred))
        all_missing = list(dict.fromkeys(missing_required + missing_preferred))

        return {
            "job_id": job_id,
            "job_match_score": total_job_match,
            "skill_match": skill_match_score,
            "education_match": education_score,
            "experience_match": experience_score,
            "role_alignment": role_score,
            "eligible": eligibility_result["eligible"],
            "matched_skills": all_matched,
            "missing_skills": all_missing,
            "missing_requirements": eligibility_result["missing_requirements"],
            "details": {
                "preferred_skill_match": preferred_match_score,
                "weights_used": {
                    "required_skills": w_req,
                    "preferred_skills": w_pref,
                    "education": w_edu,
                    "experience": w_exp,
                    "role_alignment": w_role,
                },
                "eligibility": eligibility_result,
            },
        }