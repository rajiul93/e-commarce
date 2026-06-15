import sanitizeHtml from 'sanitize-html';

type Props = {
  html: string;
  className?: string;
};

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Wrap legacy plain-text descriptions so spacing and line breaks render correctly. */
export function normalizeProductDescriptionHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return '';

  if (/<\s*(p|h[1-6]|ul|ol|li|div|blockquote|br)\b/i.test(trimmed)) {
    return trimmed;
  }

  return trimmed
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function isEmptyRichText(html: string): boolean {
  const stripped = html
    .replace(/<p><br><\/p>/gi, '')
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
  return !stripped;
}

export function sanitizeProductDescription(html: string): string {
  const normalized = normalizeProductDescriptionHtml(html);
  if (!normalized) return '';

  try {
    return sanitizeHtml(normalized, {
      allowedTags: ALLOWED_TAGS,
      allowedAttributes: {
        a: ['href', 'target', 'rel'],
        '*': ['class'],
      },
    });
  } catch {
    return escapeHtml(normalized.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  }
}

export function ProductDescription({ html, className = '' }: Props) {
  const clean = sanitizeProductDescription(html);
  if (!clean || isEmptyRichText(clean)) return null;

  return (
    <div
      className={`product-description ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
