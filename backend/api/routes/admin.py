"""
Admin DB Manager — audits all Firestore collections and storage state.
Provides collection counts, document samples, field coverage checks,
and data integrity diagnostics across all CareerTwin data models.

All endpoints are protected by a simple ADMIN_SECRET env var or Firebase admin token.
"""
from __future__ import annotations

import os
import secrets
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/admin", tags=["Admin DB Manager"])

# ─── Collections that should exist and their required fields ─────────────────
COLLECTION_SCHEMAS: Dict[str, Dict[str, Any]] = {
    "profiles": {
        "required_fields": ["full_name", "email", "target_role"],
        "optional_fields": ["username", "education", "graduation_year", "skills", "interests", "dream_companies", "bio"],
        "description": "User career profiles",
        "id_strategy": "user_id",
    },
    "resumes": {
        "required_fields": ["user_id", "filename", "file_type", "status"],
        "optional_fields": ["resume_id", "storage_path", "page_count", "text", "extracted_text", "skills", "analysis", "ats_analysis"],
        "description": "Uploaded resume documents",
        "id_strategy": "resume_id",
    },
    "applications": {
        "required_fields": ["user_id", "company", "role", "status"],
        "optional_fields": ["job_id", "location", "date", "created_at", "salary", "notes", "next_step", "match_score", "url", "description"],
        "description": "Job application tracker entries",
        "id_strategy": "composite(user_id + app_id)",
    },
    "interviews": {
        "required_fields": ["user_id", "session_id", "target_role", "round_type", "status"],
        "optional_fields": ["questions", "answers", "evaluations", "created_at", "updated_at", "final_score", "overall_score"],
        "description": "Interview session records",
        "id_strategy": "session_id",
    },
    "assessments": {
        "required_fields": ["user_id"],
        "optional_fields": ["topic", "score", "answers", "created_at"],
        "description": "Preparation assessment records",
        "id_strategy": "assessment_id",
    },
    "jobs": {
        "required_fields": ["user_id", "title", "company"],
        "optional_fields": ["description", "location", "required_skills", "keywords", "experience_requirements", "created_at"],
        "description": "Job catalog / user-added jobs",
        "id_strategy": "job_id",
    },
    "analyses": {
        "required_fields": ["user_id", "resume_id", "filename"],
        "optional_fields": ["ats_score", "resume_score", "target_role", "job_description", "recommendations", "created_at"],
        "description": "Saved resume analyses",
        "id_strategy": "analysis_id",
    },
    "resume_chunks": {
        "required_fields": ["user_id", "resume_id", "chunk_id", "text"],
        "optional_fields": ["sequence_number", "page", "total_chunks"],
        "description": "RAG chunks of resume text",
        "id_strategy": "chunk_id",
    },
    "digital_twin_snapshots": {
        "required_fields": ["user_id"],
        "optional_fields": ["resume_score", "dsa_score", "aptitude_score", "technical_score", "communication_score", "interview_score", "overall_score", "created_at"],
        "description": "Historical readiness snapshots",
        "id_strategy": "snapshot_id",
    },
    "career_plans": {
        "required_fields": ["user_id"],
        "optional_fields": ["target_role", "plan", "milestones", "created_at"],
        "description": "AI-generated career roadmaps",
        "id_strategy": "plan_id",
    },
    "job_interactions": {
        "required_fields": ["user_id", "job_id"],
        "optional_fields": ["action", "timestamp", "application_id"],
        "description": "Job viewed/saved/applied interactions",
        "id_strategy": "interaction_id",
    },
    "user_skills": {
        "required_fields": ["user_id", "skill_id"],
        "optional_fields": ["level", "verified", "added_at"],
        "description": "User's confirmed skill records",
        "id_strategy": "user_skill_id",
    },
    "learning_progress": {
        "required_fields": ["user_id"],
        "optional_fields": ["topic", "score", "completed", "created_at"],
        "description": "DSA / aptitude / programming learning progress",
        "id_strategy": "progress_id",
    },
}


def _get_admin_db():
    """Get a Firestore DB instance."""
    try:
        from backend.database.firestore import FirestoreDatabase
        return FirestoreDatabase()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Firestore unavailable: {e}")


def _check_admin_auth(
    authorization: str | None = Header(default=None),
    x_admin_secret: str | None = Header(default=None, alias="X-Admin-Secret"),
):
    """Allow configured admins only; never enable a default production credential."""
    admin_secret = os.getenv("ADMIN_SECRET")
    admin_uids = {
        uid.strip()
        for uid in os.getenv("ADMIN_UIDS", "").split(",")
        if uid.strip()
    }

    # 1. Check X-Admin-Secret header
    if admin_secret and x_admin_secret and secrets.compare_digest(x_admin_secret, admin_secret):
        return True

    # 2. Check Bearer token against admin secret
    if authorization:
        token = authorization.removeprefix("Bearer ").strip()
        if admin_secret and secrets.compare_digest(token, admin_secret):
            return True
        # Try Firebase token verification with clock-skew tolerance
        try:
            from backend.database.firebase import verify_firebase_id_token
            decoded = verify_firebase_id_token(token, clock_skew_seconds=5)
            uid = decoded.get("uid")
            if decoded.get("admin") is True or uid in admin_uids:
                return True
        except Exception:
            pass

    raise HTTPException(
        status_code=403,
        detail="Admin access denied. Configure ADMIN_SECRET or ADMIN_UIDS/custom Firebase admin claim.",
    )


# ─── Audit all collections ────────────────────────────────────────────────────

@router.get("/db/audit")
async def audit_all_collections(
    _: bool = Depends(_check_admin_auth),
    limit_per_collection: int = Query(10, ge=1, le=50, description="Sample docs per collection"),
):
    """
    Full Firestore audit: checks every known collection for existence,
    document counts, field completeness, and data integrity issues.
    """
    db = _get_admin_db()
    results = {}
    issues_summary = []
    total_docs = 0
    healthy_count = 0
    warning_count = 0
    error_count = 0

    for collection_name, schema in COLLECTION_SCHEMAS.items():
        collection_result = await _audit_collection(
            db=db,
            collection_name=collection_name,
            schema=schema,
            limit=limit_per_collection,
        )
        results[collection_name] = collection_result
        total_docs += collection_result.get("count", 0)

        status = collection_result.get("status", "unknown")
        if status == "healthy":
            healthy_count += 1
        elif status == "warning":
            warning_count += 1
            for issue in collection_result.get("issues", []):
                issues_summary.append({"collection": collection_name, "issue": issue})
        elif status in ("empty", "error"):
            error_count += 1
            for issue in collection_result.get("issues", []):
                issues_summary.append({"collection": collection_name, "issue": issue})

    overall_health = "healthy"
    if error_count > 0:
        overall_health = "critical"
    elif warning_count > 0:
        overall_health = "warning"

    return {
        "status": "ok",
        "overall_health": overall_health,
        "summary": {
            "total_collections": len(COLLECTION_SCHEMAS),
            "healthy": healthy_count,
            "warnings": warning_count,
            "errors_or_empty": error_count,
            "total_documents_sampled": total_docs,
        },
        "issues": issues_summary,
        "collections": results,
    }


async def _audit_collection(
    db,
    collection_name: str,
    schema: Dict[str, Any],
    limit: int = 10,
) -> Dict[str, Any]:
    """Audit a single Firestore collection."""
    required_fields: List[str] = schema.get("required_fields", [])
    optional_fields: List[str] = schema.get("optional_fields", [])
    all_expected = set(required_fields) | set(optional_fields)

    try:
        docs = db.list(collection_name, limit=limit)
    except Exception as e:
        return {
            "collection": collection_name,
            "status": "error",
            "count": 0,
            "description": schema.get("description", ""),
            "id_strategy": schema.get("id_strategy", ""),
            "issues": [f"Cannot read collection: {e}"],
            "samples": [],
            "field_coverage": {},
            "missing_required_fields": required_fields,
        }

    if not docs:
        return {
            "collection": collection_name,
            "status": "empty",
            "count": 0,
            "description": schema.get("description", ""),
            "id_strategy": schema.get("id_strategy", ""),
            "issues": [f"Collection '{collection_name}' is empty — no data has been written yet."],
            "samples": [],
            "field_coverage": {},
            "missing_required_fields": required_fields,
        }

    count = len(docs)
    issues = []
    missing_required_per_doc = []
    extra_fields_found = set()
    field_presence: Dict[str, int] = {f: 0 for f in all_expected}

    for doc in docs:
        doc_missing = []
        for field in required_fields:
            if field not in doc or doc[field] is None or doc[field] == "":
                doc_missing.append(field)
            else:
                field_presence[field] = field_presence.get(field, 0) + 1

        for field in optional_fields:
            if field in doc:
                field_presence[field] = field_presence.get(field, 0) + 1

        # Detect unexpected extra fields
        for key in doc.keys():
            if key not in all_expected and key not in ("id", "document_id"):
                extra_fields_found.add(key)

        if doc_missing:
            missing_required_per_doc.append({
                "doc_id": doc.get("id") or doc.get("document_id", "unknown"),
                "missing": doc_missing,
            })

    # Calculate field coverage percentages
    field_coverage = {
        field: {
            "present_in": presence,
            "total_sampled": count,
            "coverage_pct": round((presence / count) * 100, 1),
            "required": field in required_fields,
        }
        for field, presence in field_presence.items()
    }

    # Build issues list
    for entry in missing_required_per_doc:
        issues.append(
            f"Doc '{entry['doc_id']}' missing required fields: {', '.join(entry['missing'])}"
        )

    low_coverage = [
        f for f, info in field_coverage.items()
        if info["required"] and info["coverage_pct"] < 80
    ]
    if low_coverage:
        issues.append(f"Low required-field coverage (<80%): {', '.join(low_coverage)}")

    status = "healthy"
    if issues:
        status = "warning" if not missing_required_per_doc else "warning"
    if any(info["coverage_pct"] < 50 for f, info in field_coverage.items() if info["required"]):
        status = "error"

    # Sanitize sample docs (truncate long text fields)
    sanitized_samples = []
    for doc in docs[:5]:
        sample = {}
        for k, v in doc.items():
            if isinstance(v, str) and len(v) > 200:
                sample[k] = v[:200] + "...[truncated]"
            elif isinstance(v, dict) and len(str(v)) > 300:
                sample[k] = {"__truncated__": True, "keys": list(v.keys())}
            else:
                sample[k] = v
        sanitized_samples.append(sample)

    return {
        "collection": collection_name,
        "status": status,
        "count": count,
        "description": schema.get("description", ""),
        "id_strategy": schema.get("id_strategy", ""),
        "issues": issues,
        "samples": sanitized_samples,
        "field_coverage": field_coverage,
        "extra_fields_detected": list(extra_fields_found),
        "missing_required_fields": list({m for entry in missing_required_per_doc for m in entry["missing"]}),
    }


# ─── Single collection inspector ─────────────────────────────────────────────

@router.get("/db/collection/{collection_name}")
async def inspect_collection(
    collection_name: str,
    _: bool = Depends(_check_admin_auth),
    limit: int = Query(20, ge=1, le=100),
    user_id: Optional[str] = Query(None, description="Filter by user_id"),
):
    """Inspect a specific Firestore collection with optional user filter."""
    db = _get_admin_db()

    if collection_name not in COLLECTION_SCHEMAS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown collection '{collection_name}'. Known: {list(COLLECTION_SCHEMAS.keys())}",
        )

    try:
        filters = {"user_id": user_id} if user_id else None
        docs = db.list(collection_name, filters=filters, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read collection: {e}")

    schema = COLLECTION_SCHEMAS[collection_name]

    return {
        "collection": collection_name,
        "description": schema.get("description"),
        "total_returned": len(docs),
        "filter_applied": {"user_id": user_id} if user_id else None,
        "documents": docs,
        "schema": {
            "required_fields": schema.get("required_fields", []),
            "optional_fields": schema.get("optional_fields", []),
            "id_strategy": schema.get("id_strategy", ""),
        },
    }


# ─── Write a test document to verify storage is working ──────────────────────

@router.post("/db/verify-write")
async def verify_write_to_collection(
    payload: Dict[str, Any],
    _: bool = Depends(_check_admin_auth),
):
    """
    Write a test document to a collection to verify Firestore writes are working.
    Payload: { "collection": "profiles", "document_id": "test-doc-123", "data": {...} }
    """
    collection = payload.get("collection")
    document_id = payload.get("document_id", "admin-test-doc")
    data = payload.get("data", {"_test": True, "written_by": "admin-verify"})

    if not collection:
        raise HTTPException(status_code=400, detail="'collection' is required in payload.")

    if collection not in COLLECTION_SCHEMAS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown collection '{collection}'.",
        )

    db = _get_admin_db()

    try:
        db.create(collection, document_id, {**data, "_admin_test": True})
    except Exception as e:
        return {
            "status": "error",
            "collection": collection,
            "document_id": document_id,
            "error": str(e),
            "message": "Write FAILED — check Firebase credentials and Firestore rules.",
        }

    # Verify readback
    try:
        doc = db.get(collection, document_id)
        readback_ok = doc is not None
    except Exception:
        readback_ok = False

    return {
        "status": "success" if readback_ok else "write_ok_read_failed",
        "collection": collection,
        "document_id": document_id,
        "write_ok": True,
        "readback_ok": readback_ok,
        "message": "Write and read verified successfully." if readback_ok else "Write succeeded but readback failed.",
    }


# ─── Delete a test document ───────────────────────────────────────────────────

@router.delete("/db/verify-write/{collection}/{document_id}")
async def cleanup_test_document(
    collection: str,
    document_id: str,
    _: bool = Depends(_check_admin_auth),
):
    """Delete a previously written test document."""
    db = _get_admin_db()
    try:
        db.delete(collection, document_id)
        return {"status": "success", "message": f"Test document '{document_id}' deleted from '{collection}'."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {e}")


# ─── List all known collection names ─────────────────────────────────────────

@router.get("/db/collections")
async def list_known_collections(_: bool = Depends(_check_admin_auth)):
    """List all monitored collections and their schemas."""
    return {
        "collections": [
            {
                "name": name,
                "description": schema.get("description", ""),
                "required_fields": schema.get("required_fields", []),
                "optional_fields": schema.get("optional_fields", []),
                "id_strategy": schema.get("id_strategy", ""),
            }
            for name, schema in COLLECTION_SCHEMAS.items()
        ],
        "total": len(COLLECTION_SCHEMAS),
    }


# ─── Storage Rules Health Check ───────────────────────────────────────────────

@router.get("/db/rules-status")
async def check_rules_status(_: bool = Depends(_check_admin_auth)):
    """
    Summarizes expected Firestore rules coverage vs actual collections.
    Flags any collection that exists in code but has no Firestore rule.
    """
    # Collections with explicit Firestore rules (from firestore.rules)
    collections_with_rules = {
        "profiles", "resumes", "applications", "interviews", "assessments",
        "jobs", "users", "resume_chunks", "digital_twin_snapshots", "skills",
        "career_plans", "analyses", "job_interactions", "user_skills", "learning_progress",
    }

    monitored = set(COLLECTION_SCHEMAS.keys())
    missing_rules = monitored - collections_with_rules
    extra_rules = collections_with_rules - monitored

    return {
        "status": "ok" if not missing_rules else "warning",
        "collections_monitored": list(monitored),
        "collections_with_firestore_rules": list(collections_with_rules),
        "missing_rules": list(missing_rules),
        "extra_rules_not_in_code": list(extra_rules),
        "message": (
            "All monitored collections have Firestore rules."
            if not missing_rules
            else f"WARNING: {len(missing_rules)} collections have no Firestore security rule: {', '.join(missing_rules)}"
        ),
    }
