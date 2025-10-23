'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HeaderClient() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'system'|'light'|'dark'>('system');

  // Initialize theme from localStorage / system
  useEffect(() => {
    const saved = (localStorage.getItem('theme') as 'system'|'light'|'dark') || 'system';
    applyTheme(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyTheme(next: 'system'|'light'|'dark') {
    setTheme(next);
    localStorage.setItem('theme', next);
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (next === 'dark') root.classList.add('dark');
    if (next === 'light') root.classList.add('light');
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  const items = [
    { href: '/', label: 'Home' },
    { href: '/site-diary', label: 'Site Diary' },
    { href: '/sites', label: 'Site Explorer' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <div className="header-wrap">
      <nav className="nav">
        {items.map(({ href, label }) => {
          const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`nav-link${active ? ' active' : ''}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="actions">
        <button
          className="toggle"
          title={`Theme: ${theme}`}
          onClick={() => {
            const order: ('system'|'dark'|'light')[] = ['system', 'dark', 'light'];
            const next = order[(order.indexOf(theme) + 1) % order.length];
            applyTheme(next);
          }}
        >
          🌓 <span className="badge">{theme}</span>
        </button>

        <button className="nav-link" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}
