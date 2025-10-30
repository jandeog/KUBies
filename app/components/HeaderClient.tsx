'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function HeaderClient() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // theme toggle (same behavior as before)
  type Theme = 'system' | 'light' | 'dark';
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as Theme) || 'system';
    applyTheme(saved);
  }, []);

  function applyTheme(next: Theme) {
    setTheme(next);
    localStorage.setItem('theme', next);
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (next === 'dark') root.classList.add('dark');
    if (next === 'light') root.classList.add('light');
  }

  function cycleTheme() {
    const order: Theme[] = ['system', 'dark', 'light'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    applyTheme(next);
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  // close on outside click / Esc
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open || !panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const items = [
    { href: '/', label: 'Home' },
    { href: '/site-diary', label: 'Site Diary' },
    { href: '/sites', label: 'Site Explorer' },
    { href: '/subbies', label: 'Subbie-Supplier' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <div className="header" data-open={open ? 'true' : 'false'}>
      <div className="brand">
        <Link href="/" className="brand-link">KUBE</Link>
      </div>

      <div ref={panelRef} style={{ position: 'relative' }}>
        <button
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          Menu
        </button>

        {/* Keep the node in the tree and toggle with the .menu/.open CSS */}
        <div role="menu" className={`menu ${open ? 'open' : ''}`}>
          <div className="menu-section">
            {items.map(({ href, label }) => {
              const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  className={`menu-item${active ? ' active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="menu-section">
            <button role="menuitem" className="menu-item" onClick={cycleTheme}>
              Theme: {theme}
            </button>
            <button role="menuitem" className="menu-item" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
