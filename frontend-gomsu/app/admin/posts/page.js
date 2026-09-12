'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch } from '../../../lib/adminAuth';
import { BRAND_CATEGORY_SLUG } from '../../../lib/brand';

export default function AdminPostsPage() {
  const [posts, setPosts] = useState([]);

  function loadPosts() {
    authFetch(`/blog/admin/list?categorySlug=${BRAND_CATEGORY_SLUG}`).then((res) => setPosts(res.data || []));
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function handleDelete(id) {
    if (!confirm('Xoá bài viết này?')) return;
    await authFetch(`/blog/${id}`, { method: 'DELETE' });
    loadPosts();
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Bài viết</h1>
      <Link href="/admin/posts/new" className="text-blue-600 hover:underline">+ Viết bài mới</Link>
      <ul className="mt-4 divide-y divide-gray-200">
        {posts.map((post) => (
          <li key={post.id} className="py-2 flex items-center justify-between gap-2">
            <span>
              {post.title} — <em className="text-gray-500">{post.status}</em>
            </span>
            <span className="flex gap-3 shrink-0">
              <Link href={`/admin/posts/${post.id}/edit`} className="text-blue-600 hover:underline">Sửa</Link>
              <button onClick={() => handleDelete(post.id)} className="text-red-600">Xoá</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
