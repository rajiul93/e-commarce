'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import 'quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[240px] animate-pulse rounded-lg border border-zinc-300 bg-zinc-50" />
  ),
});

type Props = {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

const TOOLBAR = [
  [{ header: [2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  ['link', 'blockquote'],
  ['clean'],
];

export function RichTextEditor({ label, value, onChange, placeholder }: Props) {
  const modules = useMemo(
    () => ({
      toolbar: TOOLBAR,
    }),
    [],
  );

  return (
    <div className="rich-text-editor space-y-1.5">
      {label ? <span className="text-sm font-medium text-zinc-700">{label}</span> : null}
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  );
}
