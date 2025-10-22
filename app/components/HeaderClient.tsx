'use client';

export default function HeaderClient() {
  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      <a href="/" style={{ textDecoration:'none' }}>Home</a>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
