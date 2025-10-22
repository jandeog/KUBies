'use client';
import { useEffect, useState } from 'react';

export default function HeaderClient() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<'system'|'light'|'dark'>('system');

  // Initialize theme from localStorage / system
  useEffect(() => {
    const saved = (localStorage.getItem('theme') as any) || 'system';
    applyTheme(saved);
  }, []);

  function applyTheme(next: 'system'|'light'|'dark') {
    setTheme(next);
    localStorage.setItem('theme', next);
    const root = document.documentElement;
    // reset classes
    root.classList.remove('light', 'dark');
    if (next === 'dark') root.classList.add('dark');
    if (next === 'light') root.classList.add('light');
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <div style={{ position:'relative', display:'flex', alignItems:'center', gap:8 }}>
      {/* Theme toggle cycles system -> dark -> light */}
      <button className="toggle" title={`Theme: ${theme}`} onClick={()=>{
        const order: ('system'|'dark'|'light')[] = ['system','dark','light'];
        const next = order[(order.indexOf(theme)+1)%order.length];
        applyTheme(next);
      }}>
        🌓 <span className="badge">{theme}</span>
      </button>

      {/* Hamburger menu */}
      <button className="kebab" aria-label="Menu" onClick={()=>setOpen(v=>!v)}>☰</button>
      {open && (
        <div className="menu" onMouseLeave={()=>setOpen(false)}>
          <a href="/">🏠 Home</a>
          <a href="/">📒 Site Diary</a>
              <a href="/sites">🗂️ Site Explorer</a>
          <button onClick={logout}>🚪 Logout</button>
        </div>
      )}
    </div>
  );
}
