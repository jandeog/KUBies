import "./globals.css";
import HeaderClient from "./components/HeaderClient";

export const metadata = { title: 'Site Diary', description: 'Diaries for construction sites' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ maxWidth: 900, margin: '0 auto', padding: 12, fontFamily: 'system-ui' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <h1 style={{ fontSize: 20, margin: 0 }}><a href="/" style={{textDecoration:'none', color:'inherit'}}>Site Diary</a></h1>
          <HeaderClient />
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}

