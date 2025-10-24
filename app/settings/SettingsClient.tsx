'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type AppUser = {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  phone_number: string | null;
};

export default function SettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [profile, setProfile] = useState<AppUser | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null); setOk(null);

      const res = await fetch('/api/me', { cache: 'no-store' });
      if (!res.ok) {
        setError('Δεν υπάρχει ενεργό login.');
        setLoading(false);
        return;
      }
      const json = await res.json();
      const row = json?.user as AppUser | null;
      if (!row) {
        setError('Δεν βρέθηκε χρήστης.');
        setLoading(false);
        return;
      }
      setProfile(row);
      setName(row.name || '');
      setEmail(row.email || '');
      setPhone(row.phone_number || '');
      setLoading(false);
    })();
  }, []);

  async function onSave() {
    if (!profile) return;
    setSaving(true);
    setError(null); setOk(null);

    try {
      if (!email.trim()) throw new Error('Το email είναι υποχρεωτικό.');
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, phone_number: phone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Αποτυχία αποθήκευσης.');
      setOk('Αποθηκεύτηκαν οι αλλαγές.');
      setProfile({ ...profile, name, email, phone_number: phone });
    } catch (e:any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="muted">Φόρτωση…</div>;
  if (error) return <div className="error">{error}</div>;
  if (!profile) return null;

  return (
    <form
      className="settings-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div className="field">
        <label className="label">Name</label>
        <input className="input" value={name} onChange={(e)=>setName(e.target.value)} />
      </div>

      <div className="field">
        <label className="label">Email</label>
        <input className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
      </div>

      <div className="field">
        <label className="label">Phone number</label>
        <input className="input" type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} />
      </div>

      <div className="actions">
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
      </div>

      {ok && <div className="ok">{ok}</div>}
      {error && <div className="error">{error}</div>}
    </form>
  );
}
