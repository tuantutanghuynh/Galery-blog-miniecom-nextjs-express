'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch } from '../../../lib/adminAuth';
import { BRAND_CATEGORY_SLUG } from '../../../lib/brand';

function getWeekDays(offset = 0) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Tính khoảng cách đến Thứ 2 gần nhất
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  // Tạo ngày Thứ 2 của tuần được chỉ định (dựa vào offset)
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday + (offset * 7));

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'week'
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [weekOffset, setWeekOffset] = useState(0); // 0 = tuần này, -1 = tuần trước, 1 = tuần sau
  
  const weekDays = getWeekDays(weekOffset);

  function loadPosts() {
    let url = `/blog/admin/list?categorySlug=${BRAND_CATEGORY_SLUG}&pageSize=200`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status) url += `&status=${status}`;
    
    authFetch(url).then((res) => setPosts(res.data || []));
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPosts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, status]);

  async function handleDelete(id) {
    if (!confirm('Xoá bài viết này?')) return;
    await authFetch(`/blog/${id}`, { method: 'DELETE' });
    loadPosts();
  }

  function getStatusLabel(post) {
    if (post.status === 'draft') return { label: 'Lưu nháp', cls: 'border-amber-300 text-amber-700 bg-amber-50' };
    if (post.publishedAt && new Date(post.publishedAt) > new Date()) return { label: 'Chờ đăng', cls: 'border-blue-300 text-blue-700 bg-blue-50' };
    return { label: 'Đã xuất bản', cls: 'border-green-300 text-green-700 bg-green-50' };
  }

  const postsByDay = weekDays.map(day => {
    return posts.filter(post => {
      const postDate = new Date(post.publishedAt || post.createdAt);
      return postDate.getDate() === day.getDate() && 
             postDate.getMonth() === day.getMonth() &&
             postDate.getFullYear() === day.getFullYear();
    });
  });

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-gray-900 tracking-wide">Quản lý Bài viết</h1>
        <Link href="/admin/posts/new" className="bg-black text-white px-6 py-2.5 text-sm uppercase tracking-wider font-medium hover:bg-gray-800 transition-colors rounded">
          + Viết bài mới
        </Link>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="min-w-[200px]">
            <input 
              type="text" placeholder="Tìm kiếm bài viết..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 text-sm focus:outline-none focus:border-black"
            />
          </div>
          <select 
            value={status} onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 text-sm focus:outline-none focus:border-black bg-white"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="published">Đã xuất bản</option>
            <option value="scheduled">Đang chờ đăng (Lên lịch)</option>
            <option value="draft">Lưu nháp</option>
          </select>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Week Navigation (Only visible in week mode) */}
          {viewMode === 'week' && (
            <div className="flex items-center border border-gray-300 rounded overflow-hidden mr-4">
              <button 
                onClick={() => setWeekOffset(prev => prev - 1)}
                className="px-3 py-2 bg-gray-50 text-gray-600 hover:bg-gray-200 hover:text-black border-r border-gray-300 transition-colors"
                title="Tuần trước"
              >
                ←
              </button>
              <button 
                onClick={() => setWeekOffset(0)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${weekOffset === 0 ? 'bg-gray-200 text-black' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                Tuần này
              </button>
              <button 
                onClick={() => setWeekOffset(prev => prev + 1)}
                className="px-3 py-2 bg-gray-50 text-gray-600 hover:bg-gray-200 hover:text-black border-l border-gray-300 transition-colors"
                title="Tuần sau"
              >
                →
              </button>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded overflow-hidden shrink-0">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium ${viewMode === 'list' ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              Danh sách
            </button>
            <button 
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 text-sm font-medium ${viewMode === 'week' ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              Lịch
            </button>
          </div>
        </div>
      </div>
      
      {viewMode === 'list' ? (
        <div className="bg-white border border-gray-200 overflow-hidden shadow-sm rounded-lg">
          <ul className="divide-y divide-gray-200">
            {posts.map((post) => {
              const st = getStatusLabel(post);
              return (
                <li key={post.id} className="p-6 flex items-center gap-6 hover:bg-gray-50 transition-colors">
                  <div className="w-24 h-24 shrink-0 bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center rounded">
                    {post.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`${process.env.NEXT_PUBLIC_BACKEND_ORIGIN}${post.coverImageUrl}`} alt={post.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400">Trống</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-serif text-gray-900 truncate mb-2" title={post.title}>{post.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 font-light">
                      <span className={`px-2 py-0.5 border text-xs tracking-widest uppercase rounded ${st.cls}`}>{st.label}</span>
                      <span>•</span>
                      <span>
                        {post.publishedAt 
                          ? new Date(post.publishedAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : new Date(post.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' })
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 px-4">
                    <Link href={`/admin/posts/${post.id}/edit`} className="text-sm uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors font-medium">Sửa</Link>
                    <button onClick={() => handleDelete(post.id)} className="text-sm uppercase tracking-widest text-red-600 hover:text-red-800 transition-colors font-medium">Xoá</button>
                  </div>
                </li>
              );
            })}
            {posts.length === 0 && (
              <li className="p-12 text-center text-gray-500 font-light">Không tìm thấy bài viết nào.</li>
            )}
          </ul>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day, idx) => {
            const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
            const isToday = new Date().toDateString() === day.toDateString();
            
            return (
              <div key={idx} className={`flex flex-col border rounded-lg overflow-hidden bg-white ${isToday ? 'border-black shadow-md' : 'border-gray-200'}`}>
                <div className={`p-3 text-center border-b ${isToday ? 'bg-black text-white' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                  <div className="text-sm font-bold uppercase tracking-wider">{dayNames[day.getDay()]}</div>
                  <div className={`text-xs mt-1 font-medium ${isToday ? 'text-gray-300' : 'text-gray-500'}`}>{day.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                </div>
                
                <div className="p-3 flex-1 flex flex-col gap-3 min-h-[400px] bg-gray-50/50">
                  {postsByDay[idx].map(post => {
                    const st = getStatusLabel(post);
                    return (
                      <div key={post.id} className="bg-white border border-gray-200 p-3 rounded shadow-sm hover:shadow-md transition-shadow relative group">
                        <div className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight mb-2" title={post.title}>
                          {post.title}
                        </div>
                        <div className="flex flex-col gap-1.5 mt-2">
                          <span className={`w-fit px-1.5 py-0.5 border text-[10px] tracking-wider uppercase rounded ${st.cls}`}>{st.label}</span>
                          <span className="text-[11px] text-gray-400 font-medium">
                            {post.publishedAt ? new Date(post.publishedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                           <Link href={`/admin/posts/${post.id}/edit`} className="bg-white text-black px-3 py-1 rounded text-xs font-bold">Sửa</Link>
                        </div>
                      </div>
                    );
                  })}
                  {postsByDay[idx].length === 0 && (
                    <div className="text-center text-gray-400 text-xs italic mt-4">Trống</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
