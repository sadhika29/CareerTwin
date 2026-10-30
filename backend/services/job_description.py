"""Safe conversion of untrusted job description HTML to readable plain text."""

from __future__ import annotations

import re
from html.parser import HTMLParser


class _JobDescriptionHTMLParser(HTMLParser):
    _BLOCK_TAGS = {
        "address", "article", "blockquote", "dd", "div", "dl", "dt",
        "h1", "h2", "h3", "h4", "h5", "h6", "hr", "li", "ol",
        "p", "section", "table", "tbody", "td", "tfoot", "th",
        "thead", "tr", "ul",
    }
    _DROP_TAGS = {"script", "style", "noscript", "iframe", "object", "embed", "svg", "canvas", "template"}
    _VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.ignored_tags: list[str] = []
        self.list_item_depth = 0

    def _line_break(self, count: int = 1) -> None:
        current = "".join(self.parts)
        trailing = len(current) - len(current.rstrip("\n"))
        if trailing < count:
            self.parts.append("\n" * (count - trailing))

    def handle_starttag(self, tag: str, attrs) -> None:
        if self.ignored_tags:
            if tag not in self._VOID_TAGS:
                self.ignored_tags.append(tag)
            return
        if tag in self._DROP_TAGS:
            self.ignored_tags.append(tag)
            return
        is_heading = tag in {"h1", "h2", "h3", "h4", "h5", "h6"}
        if (tag in self._BLOCK_TAGS or tag == "br") and not (self.list_item_depth and tag == "p"):
            self._line_break(2 if tag == "p" or is_heading else 1)
        if tag == "li":
            self.parts.append("• ")
            self.list_item_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if self.ignored_tags:
            if tag in self.ignored_tags:
                index = len(self.ignored_tags) - 1 - self.ignored_tags[::-1].index(tag)
                self.ignored_tags = self.ignored_tags[:index]
            return
        is_heading = tag in {"h1", "h2", "h3", "h4", "h5", "h6"}
        if tag in {"br", "hr", "li"}:
            self._line_break()
        elif tag in self._BLOCK_TAGS and not (self.list_item_depth and tag == "p"):
            self._line_break(2 if tag == "p" or is_heading else 1)
        if tag == "li" and self.list_item_depth:
            self.list_item_depth -= 1

    def handle_data(self, data: str) -> None:
        if not self.ignored_tags:
            self.parts.append(data)


def normalize_job_description(value: object) -> str:
    """Return readable text while preserving paragraph and list structure.

    The source string is never modified in storage by this helper; callers can
    normalize only the value they display or pass to analysis/matching.
    """
    if not isinstance(value, str) or not value:
        return ""
    parser = _JobDescriptionHTMLParser()
    try:
        source = re.sub(r"&lt;(/?[a-z][^\n]*?)&gt;", lambda match: f"<{match.group(1)}>", value, flags=re.IGNORECASE)
        parser.feed(source)
        parser.close()
    except Exception:
        # HTMLParser is tolerant, but malformed external markup should not
        # prevent a job from being displayed.
        safe = re.sub(r"<(script|style|noscript|iframe|object|embed|svg|canvas|template)\b[^>]*>.*?</\1\s*>", " ", value, flags=re.IGNORECASE | re.DOTALL)
        return re.sub(r"<[^>]*>", " ", safe)

    text = "".join(parser.parts).replace("\xa0", " ")
    text = re.sub(r"[\t\f\v ]+\n", "\n", text)
    text = re.sub(r"\n[\t\f\v ]+", "\n", text)
    text = re.sub(r"[\t\f\v ]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
