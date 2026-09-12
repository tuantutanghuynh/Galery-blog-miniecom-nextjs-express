'use client';

import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Tải ReactQuill ở Client-side vì nó cần đối tượng `window`
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false, 
  loading: () => <div className="h-64 border border-gray-300 rounded flex items-center justify-center bg-gray-50 text-gray-400">Đang tải trình soạn thảo...</div>
});

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],        // Các nút định dạng
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],          // Thụt lề
    [{ 'align': [] }],
    ['link', 'image', 'video'],                       // Chèn link, ảnh, video
    ['clean']                                         // Nút xóa định dạng
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'indent',
  'align',
  'link', 'image', 'video'
];

export default function RichTextEditor({ value, onChange }) {
  return (
    <div className="bg-white">
      <ReactQuill 
        theme="snow" 
        value={value} 
        onChange={onChange} 
        modules={modules}
        formats={formats}
        className="h-96 mb-12" // mb-12 để chừa khoảng trống cho thanh toolbar ở dưới
      />
    </div>
  );
}
