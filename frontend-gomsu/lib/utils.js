export function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${process.env.NEXT_PUBLIC_BACKEND_ORIGIN}${url}`;
}
