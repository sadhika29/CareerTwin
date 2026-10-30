/**
 * Job Data & Text Normalization Utilities for CareerTwin.
 * Safely converts HTML markup from external job providers into clean, readable text
 * with preserved paragraphs, headings, and bullet points.
 */

/**
 * Decodes standard and numerical HTML entities.
 */
export function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&middot;': '·',
    '&bull;': '•',
    '&ndash;': '–',
    '&mdash;': '—',
  };
  return str
    .replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp|middot|bull|ndash|mdash);/gi, m => entities[m.toLowerCase()] || m)
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Normalizes job descriptions containing raw HTML markup into clean, readable text.
 * Converts headings into clean text with line breaks, paragraphs into separated text,
 * and list items into readable bullet points. Preserves plain text formatting.
 */
export function normalizeJobDescription(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = rawText.trim();
  if (!text) return '';

  // Quick check: if no HTML tags, decode entities and normalize whitespace
  if (!/<[^>]+>/.test(text)) {
    const decoded = decodeHtmlEntities(text)
      .replace(/\u00a0/g, ' ')
      .replace(/[\u200b\ufeff]/g, '');
    return decoded.replace(/\n{3,}/g, '\n\n').trim();
  }

  // 1. Remove dangerous / non-content tags and their inner content
  text = text.replace(/<(script|style|head|noscript|iframe|object|embed|svg|canvas)[^>]*>[\s\S]*?<\/\1>/gi, '');

  // 2. Normalize carriage returns
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 3. Line breaks
  text = text.replace(/<(?:br|hr)\s*\/?>/gi, '\n');

  // 4. Headings & block elements
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<h[1-6][^>]*>/gi, '\n\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<p[^>]*>/gi, '');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<div[^>]*>/gi, '\n');

  // 5. List items -> bullets
  text = text.replace(/<\/li\s*>/gi, '\n');
  text = text.replace(/<li[^>]*>/gi, '\n• ');
  text = text.replace(/<\/?(?:ul|ol)[^>]*>/gi, '\n');

  // 6. Other blocks
  text = text.replace(/<\/(?:tr|blockquote|section|article|header|footer)>/gi, '\n');
  text = text.replace(/<\/(?:td|th)>/gi, ' ');

  // 7. Strip all remaining tags, substituting space to prevent concatenating words
  text = text.replace(/<[^>]+>/g, ' ');

  // 8. Decode HTML entities
  text = decodeHtmlEntities(text);

  // 9. Clean up non-breaking spaces and zero-width spaces
  text = text.replace(/\u00a0/g, ' ').replace(/[\u200b\ufeff]/g, '');

  // 10. Normalize lines and multiple newlines
  const lines = text.split('\n').map(line => {
    let cleaned = line.trim().replace(/\s+/g, ' ');
    // Clean spaces before punctuation caused by closing tags: "apps ." -> "apps."
    cleaned = cleaned.replace(/\s+([.,;:!?])/g, '$1');
    return cleaned;
  });

  let result = lines.join('\n');
  result = result.replace(/\n{3,}/g, '\n\n');
  result = result.replace(/\n+\s*•\s*/g, '\n• ');
  result = result.replace(/(?<!\n)• /g, '\n• ');

  return result.trim();
}

/**
 * Normalizes all description and string list fields in a job object.
 */
export function normalizeJobObject(job) {
  if (!job || typeof job !== 'object') return job;
  return {
    ...job,
    description: normalizeJobDescription(job.description),
    excerpt: normalizeJobDescription(job.excerpt),
    responsibilities: Array.isArray(job.responsibilities)
      ? job.responsibilities.map(r => normalizeJobDescription(r))
      : job.responsibilities,
    qualifications: Array.isArray(job.qualifications)
      ? job.qualifications.map(q => normalizeJobDescription(q))
      : job.qualifications,
    experience_requirements: Array.isArray(job.experience_requirements)
      ? job.experience_requirements.map(e => normalizeJobDescription(e))
      : job.experience_requirements,
  };
}

