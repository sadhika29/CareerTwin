import io
import logging
import os
from pathlib import Path
from dotenv import load_dotenv
import pymupdf
from docx import Document

load_dotenv()
logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {".pdf", ".docx"}


# Validates the file type and returns the extension if valid, raises ValueError if not valid
def validate_file_type(file_path: str) -> str:
    path = Path(file_path)
    extension = path.suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type: {extension} . Supported file types are: {', '.join(SUPPORTED_EXTENSIONS)}"
        )
    return extension


def is_meaningful_resume_text(text: str) -> bool:
    """
    Checks if extracted text represents meaningful resume content
    rather than empty space, watermarks, or sparse metadata.
    A valid resume typically contains at least 20 words and 100+ characters.
    """
    if not text:
        return False
    cleaned = text.strip()
    if len(cleaned) < 100:
        return False
    words = [w for w in cleaned.split() if any(c.isalpha() for c in w)]
    return len(words) >= 20


def _extract_text_via_vision(file_path: str) -> str:
    """
    Fallback OCR using Gemini Vision for scanned, flattened, image-based, or vector-outlined PDFs
    where standard text layer extraction returns empty or negligible text.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY is not configured; cannot perform Vision OCR fallback.")
        return ""

    try:
        doc = pymupdf.open(file_path)
        extracted_pages = []

        prompt = (
            "Extract all text from this resume image verbatim and completely. "
            "Preserve sections, headers, contact details, experiences, education, skills, and bullet points. "
            "Do not include conversational commentary, disclaimers, or markdown code blocks."
        )

        env_model = os.getenv("GEMINI_MODEL") or "gemini-2.5-flash"
        candidate_models = [
            env_model,
            "gemini-2.5-flash",
            "gemini-flash-lite-latest",
            "gemini-flash-latest",
            "gemini-3.8-flash",
        ]
        # Deduplicate while preserving priority order
        seen = set()
        deduped_models = []
        for m in candidate_models:
            if m and m not in seen:
                seen.add(m)
                deduped_models.append(m)

        # Scan up to 5 pages (standard resumes are 1-4 pages)
        num_pages_to_scan = min(len(doc), 5)

        # Try google.genai first, then fallback to google.generativeai
        genai_client = None
        legacy_genai = None
        try:
            from google import genai
            genai_client = genai.Client(api_key=api_key)
        except Exception as client_err:
            logger.debug(f"google.genai initialization failed: {client_err}")
            try:
                import google.generativeai as legacy_genai
                legacy_genai.configure(api_key=api_key)
            except Exception as leg_err:
                logger.warning(f"Both genai clients failed: {leg_err}")

        for page_idx in range(num_pages_to_scan):
            page = doc[page_idx]
            pix = page.get_pixmap(dpi=150)
            img_bytes = pix.tobytes("png")
            page_text = ""

            for model_name in deduped_models:
                try:
                    if genai_client:
                        from google.genai import types
                        response = genai_client.models.generate_content(
                            model=model_name,
                            contents=[
                                types.Part.from_bytes(data=img_bytes, mime_type="image/png"),
                                prompt,
                            ],
                        )
                        if response and response.text:
                            page_text = response.text.strip()
                            break
                    elif legacy_genai:
                        import PIL.Image
                        image = PIL.Image.open(io.BytesIO(img_bytes))
                        model = legacy_genai.GenerativeModel(model_name)
                        response = model.generate_content([image, prompt])
                        if response and response.text:
                            page_text = response.text.strip()
                            break
                except Exception as model_err:
                    logger.warning(f"Vision OCR model '{model_name}' on page {page_idx + 1} failed: {model_err}")

            if page_text:
                extracted_pages.append(page_text)

        doc.close()
        return "\n\n".join(extracted_pages)
    except Exception as exc:
        logger.warning(f"Vision OCR fallback failed: {exc}")
        return ""


# Extracts text from PDF files using PyMuPDF and returns the extracted text along with the number of pages in the document
def extract_text_from_pdf(file_path: str) -> tuple[str, int]:
    try:
        document = pymupdf.open(file_path)
    except Exception as exc:
        raise ValueError(f"Unable to read PDF file: {exc}")

    # Check for password protection
    if document.is_encrypted:
        authenticated = document.authenticate("")
        if not authenticated:
            document.close()
            raise ValueError("This PDF is password-protected. Please remove the password and try again.")

    page_count = len(document)
    text_parts = []
    for page in document:
        # Use sort=True for natural reading order (especially for multi-column resumes)
        page_text = page.get_text("text", sort=True)
        text_parts.append(page_text)
    document.close()
    text = "\n".join(text_parts)

    # If text is empty or sparse/watermark-only (e.g. scanned resume, vector curves, Canva flattened export),
    # fallback to Vision OCR
    if not is_meaningful_resume_text(text):
        vision_text = _extract_text_via_vision(file_path)
        if vision_text.strip():
            text = vision_text

    return text, page_count


# Extracts text from DOCX files using python-docx, including tables, textboxes, shapes, and headers
def extract_text_from_docx(file_path: str) -> str:
    try:
        document = Document(file_path)
    except Exception as exc:
        raise ValueError(f"Unable to read DOCX file: {exc}")

    paragraphs = []
    for paragraph in document.paragraphs:
        if paragraph.text.strip():
            paragraphs.append(paragraph.text.strip())

    # Extract text from tables if present
    for table in document.tables:
        for row in table.rows:
            for cell in row.cells:
                cleaned = cell.text.strip()
                if cleaned and cleaned not in paragraphs:
                    paragraphs.append(cleaned)

    # Extract text from headers and footers
    for section in document.sections:
        if section.header:
            for p in section.header.paragraphs:
                cleaned = p.text.strip()
                if cleaned and cleaned not in paragraphs:
                    paragraphs.append(cleaned)
        if section.footer:
            for p in section.footer.paragraphs:
                cleaned = p.text.strip()
                if cleaned and cleaned not in paragraphs:
                    paragraphs.append(cleaned)

    # Extract text from textboxes (used in many resume templates)
    try:
        from docx.text.paragraph import Paragraph
        for txbx in document.element.xpath('.//w:txbxContent'):
            for p in txbx.xpath('.//w:p'):
                text = Paragraph(p, document).text.strip()
                if text and text not in paragraphs:
                    paragraphs.append(text)
    except Exception as exc:
        logger.debug(f"Error extracting textboxes from docx: {exc}")

    # Extract text from drawing runs (DrawingML shapes and text)
    try:
        for drawing in document.element.xpath('.//w:drawing'):
            for t in drawing.xpath('.//a:t'):
                if t.text and t.text.strip() and t.text.strip() not in paragraphs:
                    paragraphs.append(t.text.strip())
    except Exception as exc:
        logger.debug(f"Error extracting drawings from docx: {exc}")

    # Extract text from structured document tags (SDT content controls)
    try:
        for sdt in document.element.xpath('.//w:sdt'):
            for t in sdt.xpath('.//w:t'):
                if t.text and t.text.strip() and t.text.strip() not in paragraphs:
                    paragraphs.append(t.text.strip())
    except Exception as exc:
        logger.debug(f"Error extracting SDT from docx: {exc}")

    return "\n".join(paragraphs)


# Normalizes the text obtained from both PDFs and DOCX files
def normalize_text(text: str) -> str:
    if not text:
        return ""
    text = (
        text.replace("\x00", "")
        .replace("\u200b", "")
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
        .replace("ﬁ", "fi")
        .replace("ﬂ", "fl")
        .replace("ﬃ", "ffi")
        .replace("ﬄ", "ffl")
    )
    lines = []
    for line in text.splitlines():
        cleaned_line = " ".join(line.split())
        if cleaned_line:
            lines.append(cleaned_line)
    return "\n".join(lines)


# Validates that extracted text is not empty
def validate_extracted_text(text: str) -> str:
    if not text or not text.strip():
        raise ValueError(
            "Extracted text is empty. The document may be scanned, image-only, or corrupt. Please ensure the file contains readable text."
        )
    return text


# Main parse function
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


# Validates if the file exists at the given path, raises FileNotFoundError if not found
def validate_file_exists(file_path: str) -> None:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Resume file not found: {file_path}")
