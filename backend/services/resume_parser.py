from pathlib import Path
import pymupdf
from docx import Document


SUPPORTED_EXTENSIONS = {".pdf", ".docx"}


#validates the file type and returns the extension if valid, raises ValueError if not valid
def validate_file_type(file_path: str) -> str:
    path = Path(file_path)
    extension = path.suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type: {extension} . Supported file types are: {', '.join(SUPPORTED_EXTENSIONS)}"
        )
    return extension


# extracts text from PDF files using PyMuPDF and returns the extracted text along with the number of pages in the document
def extract_text_from_pdf(file_path: str)-> tuple[str, int]:
    document = pymupdf.open(file_path)
    text_parts = []
    for page in document:
        text_parts.append(page.get_text())
    document.close()
    text = "\n".join(text_parts)
    return text, len(text_parts)

# extracts text from DOCX files using python-docx and returns the extracted text
def extract_text_from_docx(file_path: str) -> str:
    document = Document(file_path)
    paragraphs = []
    for paragraph in document.paragraphs:
        if paragraph.text.strip():
            paragraphs.append(paragraph.text.strip())
    return "\n".join(paragraphs)

#to noramlize the text obtained from both the pdfs and docx files
def normalize_text(text: str) -> str:
    if not text:
        return ""
    text = (
        text.replace("\u200b", "")
        .replace("\u200c", "")
        .replace("\u200d", "")
        .replace("\ufeff", "")
        .replace("\u00a0", " ")
        .replace("\u2013", "-")
        .replace("\u2014", "-")
        .replace("\u2018", "'")
        .replace("\u2019", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2022", "•")
        .replace("\u25cf", "•")
    )
    lines = []
    for line in text.splitlines():
        cleaned_line = " ".join(line.split())
        if cleaned_line:
            lines.append(cleaned_line)
    return "\n".join(lines)

#validates the file type and extracts text based on the file type
def validate_extracted_text(text: str) -> str:
    if not text.strip():
        raise ValueError("Extracted text is empty. Please check the file content.")


#main parse function 
def parse_resume(file_path: str) -> dict:
    validate_file_exists(file_path)
    extension = validate_file_type(file_path)
    if extension == ".pdf":
        text, page_count = extract_text_from_pdf(file_path)
    else:
        text = extract_text_from_docx(file_path)
        page_count = None
    text = normalize_text(text)
    validate_extracted_text(text)
    return {
    "filename": Path(file_path).name,
    "file_type": extension.lstrip("."),
    "text": text,
    "page_count": page_count,
    "status": "success",
}

#validates if the file exists at the given path, raises FileNotFoundError if not found
def validate_file_exists(file_path: str) -> None:
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Resume file not found: {file_path}"
        )

#     print(validate_file_type("resume.txt"))  # This will raise a ValueError