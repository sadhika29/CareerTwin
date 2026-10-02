import pytest
from backend.services.resume_parser import (
    extract_text_from_docx,
    extract_text_from_pdf,
    normalize_text,
    parse_resume,
    validate_extracted_text,
    validate_file_exists,
    validate_file_type,
)

# Path to the generated test fixture — a sample resume PDF committed to the repo.
SAMPLE_PDF = "tests/fixtures/sample_resume.pdf"
SAMPLE_DOCX = "Enterprise_Product_Engineering_Blueprint_v1.docx"


def test_validate_file_exists():
    with pytest.raises(FileNotFoundError):
        validate_file_exists("non_existent_file.pdf")


def test_validate_pdf_file_type():
    result = validate_file_type("resume.pdf")
    assert result == ".pdf"


def test_validate_docx_file_type():
    result = validate_file_type("resume.docx")
    assert result == ".docx"


def test_validate_unsupported_file_type():
    with pytest.raises(ValueError):
        validate_file_type("resume.txt")


def test_extract_text_from_pdf():
    text, page_count = extract_text_from_pdf(SAMPLE_PDF)
    assert page_count == 1
    assert text.strip()
    # Verify the fixture contains expected resume content
    assert "John Doe" in text or "Software Engineer" in text


def test_extract_text_from_docx():
    text = extract_text_from_docx(SAMPLE_DOCX)
    assert text.strip()


def test_normalize_text():
    text = """
        Python       SQL
       
        JavaScript     HTML
    """
    result = normalize_text(text)
    assert result == "Python SQL\nJavaScript HTML"


def test_empty_extracted_text():
    with pytest.raises(ValueError):
        validate_extracted_text("")


# corrupted PDF test case
def test_corrupted_pdf(tmp_path):
    corrupted_pdf = tmp_path / "corrupted_resume.pdf"
    corrupted_pdf.write_bytes(b"This is not a valid PDF file")
    with pytest.raises(Exception):
        extract_text_from_pdf(str(corrupted_pdf))


def test_parse_resume_pdf():
    result = parse_resume(SAMPLE_PDF)
    assert result["filename"] == "sample_resume.pdf"
    assert result["file_type"] == "pdf"
    assert result["page_count"] == 1
    assert result["status"] == "success"
    assert result["text"].strip()
