import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-mono text-4xl font-bold text-cyan-DEFAULT mb-4">
        FakeNews Analyzer
      </h1>
      <p className="text-slate-400 text-lg mb-10 max-w-xl">
        Détection de fake news par apprentissage automatique — DistilBERT + Spark
      </p>
      <div className="flex gap-4">
        <Link
          href="/analyze"
          className="px-6 py-3 bg-cyan-DEFAULT text-background font-mono font-bold rounded-lg hover:bg-cyan-dim transition-colors"
        >
          Analyser un texte
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-3 border border-border text-slate-300 font-mono rounded-lg hover:border-cyan-DEFAULT hover:text-cyan-DEFAULT transition-colors"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
