from unittest.mock import MagicMock

from backend.schemas.job import JobResponse
from backend.services.job_description import normalize_job_description
from backend.services.job_service import JobService


def test_normalizes_headings_paragraphs_and_lists():
    description = (
        "<h3><strong>Key Responsibilities:</strong></h3>"
        "<ul><li><p>Assist in designing applications.</p></li>"
        "<li>Maintain scalable services.</li></ul>"
    )

    assert normalize_job_description(description) == (
        "Key Responsibilities:\n\n• Assist in designing applications.\n• Maintain scalable services."
    )


def test_decodes_entities_and_removes_non_content_elements():
    description = (
        "<p>Build <strong>scalable APIs</strong> &amp; services&nbsp;today.</p>"
        "<p>Confirm the value is 5 &lt; 7 &gt; 3.</p>"
        "<script>alert('unsafe')</script><style>.hidden { display:none }</style>"
        "<iframe>untrusted embed</iframe>"
    )

    assert normalize_job_description(description) == (
        "Build scalable APIs & services today.\n\nConfirm the value is 5 < 7 > 3."
    )


def test_plain_text_and_malformed_html_remain_readable():
    plain = "First paragraph.\n\nSecond paragraph &amp; more."
    assert normalize_job_description(plain) == "First paragraph.\n\nSecond paragraph & more."
    assert normalize_job_description("<p>Build <strong>useful APIs</p>") == "Build useful APIs"
    assert normalize_job_description("&lt;p&gt;Encoded &lt;strong&gt;markup&lt;/strong&gt;.&lt;/p&gt;") == "Encoded markup."
    assert normalize_job_description("") == ""
    assert normalize_job_description(None) == ""


def test_job_response_cleans_legacy_html_without_mutating_source_document():
    source_description = "<p>Legacy <b>stored</b> description.</p>"
    database = MagicMock()
    database.get.return_value = {
        "job_id": "legacy-job",
        "user_id": "user-1",
        "description": source_description,
    }

    job = JobService(database=database).get_job("legacy-job", user_id="user-1")
    response = JobResponse(
        job_id=job.job_id,
        user_id=job.user_id,
        title=job.title,
        company=job.company,
        location=job.location,
        job_url=job.job_url,
        description=source_description,
    )

    assert job.description == "Legacy stored description."
    assert response.description == "Legacy stored description."
    assert database.get.return_value["description"] == source_description
    database.update.assert_not_called()
