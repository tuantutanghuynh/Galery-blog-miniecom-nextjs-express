export default function Footer() {
  return (
    <footer className="px-6 py-10 flex flex-col md:flex-row items-center justify-between text-xs text-gomsu-text-muted bg-[#0a0a0a]">
      <div className="font-serif text-lg text-white mb-4 md:mb-0 tracking-widest">Nghĩa Phái</div>
      <div className="tracking-widest">&copy; {new Date().getFullYear()} Nghĩa Phái Art &amp; Design. All rights reserved.</div>
    </footer>
  );
}
