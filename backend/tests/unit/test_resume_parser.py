import pytest
from backend.services.resume_parser import (
    normalize_text,
    validate_file_type,
    SUPPORTED_EXTENSIONS,
)


def test_supported_extensions():
    assert ".pdf" in SUPPORTED_EXTENSIONS
    assert ".docx" in SUPPORTED_EXTENSIONS


def test_validate_file_type_valid():
    assert validate_file_type("resume.pdf") == ".pdf"
    assert validate_file_type("resume.docx") == ".docx"
    assert validate_file_type("path/to/my_resume.PDF") == ".pdf"


def test_validate_file_type_invalid():
    with pytest.raises(ValueError, match="Unsupported file type"):
        validate_file_type("resume.txt")


def test_normalize_text():
    sample = "  John   Doe  \n\n  Software Engineer \n"
    normalized = normalize_text(sample)
    assert "John Doe" in normalized
    assert "Software Engineer" in normalized
