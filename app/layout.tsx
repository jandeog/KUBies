import "./globals.css";
import HeaderClient from "./components/HeaderClient";

export const metadata = { title: 'KUBE Contractors', description: 'Diaries for construction sites' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ maxWidth: 900, margin: '0 auto', padding: 12, fontFamily: 'system-ui' }}>
        <header className="header">
          <h1 className="brand">
            <a href="/" style={{textDecoration:'none', color:'inherit'}}>KUBE Contractors</a>
          </h1>
          <HeaderClient />
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
