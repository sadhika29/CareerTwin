const NON_CONTENT_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'CANVAS', 'TEMPLATE']);
const BLOCK_TAGS = new Set(['ADDRESS', 'ARTICLE', 'BLOCKQUOTE', 'DD', 'DIV', 'DL', 'DT', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'LI', 'OL', 'P', 'SECTION', 'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'UL']);

function tidyMarkupText(text) {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[\t\f\v ]+\n/g, '\n')
    .replace(/\n[\t\f\v ]+/g, '\n')
    .replace(/[\t\f\v ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Convert untrusted job-description markup into safe, readable plain text. */
export function normalizeJobDescription(value) {
  if (typeof value !== 'string' || !value) return '';
  if (typeof DOMParser === 'undefined') return value;

  const htmlSource = value.replace(/&lt;(\/?[a-z][^&]*?)&gt;/gi, (_match, tag) => `<${tag}>`);
  const document = new DOMParser().parseFromString(htmlSource, 'text/html');
  const hasMarkup = /<\/?[a-z][^>]*>/i.test(htmlSource);
  if (!hasMarkup) {
    return document.body.textContent?.replace(/\u00a0/g, ' ') ?? value;
  }

  const output = [];
  let listItemDepth = 0;
  const appendBreak = (count = 1) => {
    const current = output.join('');
    const trailing = current.match(/\n*$/)?.[0].length ?? 0;
    if (trailing < count) output.push('\n'.repeat(count - trailing));
  };

  const visit = node => {
    if (node.nodeType === Node.TEXT_NODE) {
      output.push(node.nodeValue || '');
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName;
    if (NON_CONTENT_TAGS.has(tag)) return;
    const isHeading = /^H[1-6]$/.test(tag);
    if ((BLOCK_TAGS.has(tag) || tag === 'BR') && !(listItemDepth > 0 && tag === 'P')) {
      appendBreak(tag === 'P' || isHeading ? 2 : 1);
    }
    if (tag === 'LI') {
      output.push('• ');
      listItemDepth += 1;
    }
    for (const child of node.childNodes) visit(child);
    if (tag === 'BR' || tag === 'HR' || tag === 'LI') appendBreak(1);
    else if (BLOCK_TAGS.has(tag) && !(listItemDepth > 0 && tag === 'P')) appendBreak(tag === 'P' || isHeading ? 2 : 1);
    if (tag === 'LI' && listItemDepth > 0) listItemDepth -= 1;
  };

  for (const child of document.body.childNodes) visit(child);
  return tidyMarkupText(output.join(''));
}

export function normalizeJobRecord(job) {
  return job && typeof job === 'object'
    ? { ...job, description: normalizeJobDescription(job.description) }
    : job;
}
