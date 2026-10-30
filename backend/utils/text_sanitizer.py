"""
Text Sanitizer and HTML Normalization Utility for CareerTwin.
Provides safe, clean conversion of HTML markup into readable, well-formatted plain text.
Preserves headings, paragraph breaks, and converts list items into clean bullet points.
"""

from __future__ import annotations

import html
import re
from typing import Any, Optional


def normalize_job_description(raw_text: Optional[str]) -> str:
    """
    Transform raw HTML or mixed job descriptions into clean, readable text.
    
    Features:
    - Converts headings (<h1> - <h6>) into distinct header lines.
    - Converts paragraphs (<p>) and line breaks (<br>) into appropriate paragraph breaks.
    - Converts list items (<li>) into bullet points (• ).
    - Decodes all HTML entities (&amp;, &nbsp;, &lt;, &gt;, &#39;, etc.).
    - Strips dangerous elements (<script>, <style>, <iframe>, etc.) completely.
    - Prevents accidental word concatenation when stripping tags.
    - Preserves plain text without alteration.
    - Trims excessive blank lines and whitespace.
    """
    if not raw_text or not isinstance(raw_text, str):
        return ""

    text = raw_text.strip()
    if not text:
        return ""

    # If no HTML tags are present, just decode entities and normalize whitespace
    if not re.search(r"<[^>]+>", text):
        decoded = html.unescape(text)
        decoded = decoded.replace("\u00a0", " ").replace("\u200b", "").replace("\ufeff", "")
        return re.sub(r"\n{3,}", "\n\n", decoded).strip()

    # 1. Completely remove dangerous tags along with their inner content
    text = re.sub(
        r"<(script|style|head|noscript|iframe|object|embed|svg|canvas)[^>]*>[\s\S]*?</\1>",
        "",
        text,
        flags=re.IGNORECASE,
    )

    # 2. Normalize carriage returns
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # 3. Handle break tags
    text = re.sub(r"<(?:br|hr)\s*/?>", "\n", text, flags=re.IGNORECASE)

    # 4. Handle headings: add newlines before and after
    text = re.sub(r"</h[1-6]>", "\n\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<h[1-6][^>]*>", "\n\n", text, flags=re.IGNORECASE)

    # 5. Handle paragraphs and divs
    text = re.sub(r"</p>", "\n\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<p[^>]*>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"</div>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<div[^>]*>", "\n", text, flags=re.IGNORECASE)

    # 6. Convert list items to bullet points
    text = re.sub(r"</li\s*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<li[^>]*>", "\n• ", text, flags=re.IGNORECASE)
    text = re.sub(r"</?[uo]l[^>]*>", "\n", text, flags=re.IGNORECASE)

    # 7. Convert table rows and block elements to newlines
    text = re.sub(r"</(?:tr|blockquote|section|article|header|footer)>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</(?:td|th)>", " ", text, flags=re.IGNORECASE)

    # 8. Strip all remaining HTML tags, substituting space to prevent concatenating words
    text = re.sub(r"<[^>]+>", " ", text)

    # 9. Decode HTML entities (&amp;, &nbsp;, &lt;, &gt;, &quot;, &#39;, etc.)
    text = html.unescape(text)

    # 10. Clean up non-breaking spaces and zero-width artifacts
    text = text.replace("\u00a0", " ").replace("\u200b", "").replace("\ufeff", "")

    # 11. Normalize lines: trim leading/trailing space from each line
    lines = []
    for line in text.split("\n"):
        cleaned_line = " ".join(line.split())
        # Clean up spaces before punctuation caused by closing inline tags: "apps ." -> "apps."
        cleaned_line = re.sub(r"\s+([.,;:!?])", r"\1", cleaned_line)
        lines.append(cleaned_line)

    result = "\n".join(lines)

    # 12. Normalize multiple newlines (max 2 consecutive newlines)
    result = re.sub(r"\n{3,}", "\n\n", result)

    # 13. Clean up bullet line spacing
    result = re.sub(r"\n+\s*•\s*", "\n• ", result)
    result = re.sub(r"(?<!\n)• ", "\n• ", result)

    return result.strip()


def normalize_job_dict(job: dict[str, Any]) -> dict[str, Any]:
    """Normalize description and related text fields in a job dictionary in-place and return it."""
    if not isinstance(job, dict):
        return job

    if "description" in job and isinstance(job["description"], str):
        job["description"] = normalize_job_description(job["description"])

    if "excerpt" in job and isinstance(job["excerpt"], str):
        job["excerpt"] = normalize_job_description(job["excerpt"])

    return job
