import pytest
from backend.utils.text_sanitizer import normalize_job_description, normalize_job_dict


def test_html_headings_and_lists():
    html_input = (
        "<h3><strong>Key Responsibilities:</strong></h3>"
        "<ul>"
        "<li><p>Assist in designing and developing full-stack web applications using the MERN stack.</p></li>"
        "<li><p>Work on both frontend and backend components, ensuring seamless integration.</p></li>"
        "<li><p>Create and maintain scalable web applications.</p></li>"
        "</ul>"
    )
    result = normalize_job_description(html_input)

    assert "<" not in result
    assert ">" not in result
    assert "Key Responsibilities:" in result
    assert "• Assist in designing and developing full-stack web applications" in result
    assert "• Work on both frontend and backend components" in result
    assert "• Create and maintain scalable web applications." in result


def test_html_entities_decoded():
    html_input = "<p>Build <strong>scalable APIs</strong> &amp; microservices &nbsp; with &lt;100ms&gt; latency.</p>"
    result = normalize_job_description(html_input)
    assert result == "Build scalable APIs & microservices with <100ms> latency."


def test_plain_text_preserved():
    plain = "Key engineering role responsible for scalable APIs.\n\nKey skills:\n• Python\n• React"
    result = normalize_job_description(plain)
    assert result == plain


def test_empty_and_none():
    assert normalize_job_description("") == ""
    assert normalize_job_description(None) == ""
    assert normalize_job_description("    ") == ""


def test_security_script_and_style_stripped():
    malicious = (
        "<p>Safe role description.</p>"
        "<script>window.location='http://evil.com'; alert('xss');</script>"
        "<style>body { display: none; }</style>"
        "<iframe src='javascript:alert(1)'></iframe>"
    )
    result = normalize_job_description(malicious)
    assert result == "Safe role description."
    assert "evil" not in result
    assert "alert" not in result
    assert "display" not in result


def test_tag_stripping_word_spacing():
    # Ensure words inside adjacent inline tags are not concatenated
    html_input = "<p><span>Python</span><span>FastAPI</span><span>React</span></p>"
    result = normalize_job_description(html_input)
    assert "Python FastAPI React" == result


def test_normalize_job_dict():
    job = {
        "job_id": "test_1",
        "title": "Software Engineer",
        "description": "<p>Build <strong>scalable apps</strong>.</p>",
        "excerpt": "<h3>Overview</h3>",
    }
    normalized = normalize_job_dict(job)
    assert normalized["description"] == "Build scalable apps."
    assert normalized["excerpt"] == "Overview"

