'use client';

import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const EMPTY_QUILL = '<p><br></p>';

function isEmptyQuillHtml(html: string): boolean {
  return !html || html === EMPTY_QUILL || html.replace(/<[^>]+>/g, '').trim() === '';
}

type Props = {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

const TOOLBAR_OPTIONS = [
  [{ header: [2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  ['link', 'blockquote'],
  ['clean'],
];

export function RichTextEditor({ label, value, onChange, placeholder }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);
  const lastHtmlRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const quill = new Quill(container, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: TOOLBAR_OPTIONS,
      },
    });

    if (value && !isEmptyQuillHtml(value)) {
      quill.clipboard.dangerouslyPasteHTML(value, 'silent');
    }
    lastHtmlRef.current = quill.root.innerHTML;

    quill.on('text-change', () => {
      const html = quill.root.innerHTML;
      lastHtmlRef.current = html;
      onChangeRef.current(isEmptyQuillHtml(html) ? '' : html);
    });

    quillRef.current = quill;

    return () => {
      quillRef.current = null;
      container.innerHTML = '';
    };
    // Quill mounts once; value sync is handled in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholder]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    if (value === lastHtmlRef.current) return;
    if (isEmptyQuillHtml(value) && isEmptyQuillHtml(quill.root.innerHTML)) return;

    const selection = quill.getSelection();
    quill.clipboard.dangerouslyPasteHTML(value || '', 'silent');
    lastHtmlRef.current = quill.root.innerHTML;
    if (selection) {
      quill.setSelection(selection);
    }
  }, [value]);

  return (
    <div className="rich-text-editor space-y-1.5">
      {label ? <span className="text-sm font-medium text-zinc-700">{label}</span> : null}
      <div ref={containerRef} />
    </div>
  );
}
