import DOMPurify from 'isomorphic-dompurify';

type Props = {
  html: string;
  className?: string;
};

function isEmptyRichText(html: string): boolean {
  const stripped = html
    .replace(/<p><br><\/p>/gi, '')
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
  return !stripped;
}

export function ProductDescription({ html, className = '' }: Props) {
  if (!html || isEmptyRichText(html)) return null;

  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });

  if (!clean || isEmptyRichText(clean)) return null;

  return (
    <div
      className={`product-description ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
