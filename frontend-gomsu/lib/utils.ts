export function getImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const origin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || '';
  return `${origin}${url}`;
}

export function formatPrice(v: number): string {
  return v.toLocaleString('vi-VN') + 'đ';
}
