import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-mono font-bold text-cyan-DEFAULT tracking-tight">
          FakeNews<span className="text-slate-400">Analyzer</span>
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link href="/analyze" className="text-slate-400 hover:text-white transition-colors">
            Analyser
          </Link>
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
