'use client';

import { useEffect, useRef } from 'react';
import type Quill from 'quill';

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['link', 'image', 'video'],
  ['clean'],
];

interface RichTextEditorProps {
  value?: string;
  onChange: (content: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isInternalChange = useRef<boolean>(false); // Ngăn chặn vòng lặp vô hạn

  useEffect(() => {
    let isMounted = true;

    if (containerRef.current && !quillRef.current) {
      // Import động quill để tránh lỗi document is not defined (SSR)
      import('quill').then((QuillModule) => {
        if (!isMounted || quillRef.current || !containerRef.current) return;

        // Dọn dẹp DOM trước khi khởi tạo (chống double render ở React Strict Mode)
        containerRef.current.innerHTML = '';
        const toolbar = containerRef.current.previousSibling as HTMLElement | null;
        if (toolbar && toolbar.classList.contains('ql-toolbar')) {
          toolbar.remove();
        }

        const editor = new QuillModule.default(containerRef.current, {
          theme: 'snow',
          modules: { toolbar: TOOLBAR_OPTIONS },
        });
        quillRef.current = editor;

        // Set giá trị ban đầu nếu có
        if (value) {
          editor.clipboard.dangerouslyPasteHTML(value);
        }

        // Lắng nghe sự kiện người dùng gõ
        editor.on('text-change', () => {
          isInternalChange.current = true;
          onChange(editor.root.innerHTML);
        });
      });
    }

    return () => {
      isMounted = false;
    };
  }, []); // Chỉ khởi tạo 1 lần

  // Cập nhật nội dung nếu value thay đổi từ bên ngoài (ví dụ lúc fetch data)
  useEffect(() => {
    if (quillRef.current && value !== undefined) {
      // Chỉ cập nhật nếu không phải do Quill tự trigger onChange
      if (isInternalChange.current) {
        isInternalChange.current = false;
        return;
      }

      const currentHtml = quillRef.current.root.innerHTML;
      if (value !== currentHtml && value !== '<p><br></p>') {
        quillRef.current.clipboard.dangerouslyPasteHTML(value);
      }
    }
  }, [value]);

  return (
    <div className="bg-white mb-12">
      <div ref={containerRef} className="h-96" />
    </div>
  );
}
