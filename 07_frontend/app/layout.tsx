import "./globals.css";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>FakeNews Analyzer</title>
        <meta name="description" content="Détection de fake news par IA — FakeNews Analyzer" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem" }}>
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
