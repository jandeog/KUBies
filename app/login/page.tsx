'use client';
import { useState } from 'react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ username, password })
    });
    setLoading(false);
    if (res.ok) {
      const next = new URLSearchParams(window.location.search).get('next') || '/';
      window.location.href = next;
    } else {
      const j = await res.json().catch(()=>({error:'Login failed'}));
      setErr(j.error || 'Invalid credentials');
    }
  }

  return (
    <div style={{maxWidth: 360, margin:'80px auto', padding:20}} className="card">
      <h2>Sign in</h2>
      <form onSubmit={onSubmit}>
        <label>Username</label>
        <input value={username} onChange={e=>setUsername(e.target.value)} autoFocus />
        <label>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        {err && <div style={{color:'crimson', marginTop:8}}>{err}</div>}
        <button style={{marginTop:12, width:'100%'}} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
