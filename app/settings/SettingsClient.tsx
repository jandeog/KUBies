'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';

type AppUser = {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  phone_number: string | null;
};

const sb = supabaseBrowser();

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
      setError(null);
      setOk(null);

      // 1) Πάρε τον συνδεδεμένο χρήστη από Supabase Auth
      const { data: userRes, error: userErr } = await sb.auth.getUser();
      if (userErr || !userRes?.user) {
        setError('Δεν βρέθηκε ενεργό login. Κάνε login και ξαναπροσπάθησε.');
        setLoading(false);
        return;
      }
      const authUser = userRes.user;

      // 2) Διάβασε το row από app_users
      //    Προσπαθούμε πρώτα με id == auth.uid(), μετά με email == auth.email,
      //    μετά με username == auth.email (fallback για παλαιότερα setups).
      let row: AppUser | null = null;

      {
        const { data } = await sb
          .from('app_users')
          .select('id,username,name,email,phone_number')
          .eq('id', authUser.id)
          .maybeSingle();
        if (data) row = data as AppUser;
      }
      if (!row && authUser.email) {
        const { data } = await sb
          .from('app_users')
          .select('id,username,name,email,phone_number')
          .eq('email', authUser.email)
          .maybeSingle();
        if (data) row = data as AppUser;
      }
      if (!row && authUser.email) {
        const { data } = await sb
          .from('app_users')
          .select('id,username,name,email,phone_number')
          .eq('username', authUser.email)
          .maybeSingle();
        if (data) row = data as AppUser;
      }

      if (!row) {
        setError(
          'Δεν βρέθηκε εγγραφή στο app_users για τον λογαριασμό σου. ' +
          'Επικοινώνησε με admin για να συνδέσει τον χρήστη με τον πίνακα app_users.'
        );
        setLoading(false);
        return;
      }

      setProfile(row);
      setName(row.name || '');
      setEmail(row.email || authUser.email || '');
      setPhone(row.phone_number || '');
      setLoading(false);
    })();
  }, []);

  async function onSave() {
    if (!profile) return;
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      // Αν θέλεις basic validation:
      if (!email.trim()) throw new Error('Το email είναι υποχρεωτικό.');

      const { error: upErr } = await sb
        .from('app_users')
        .update({
          name: name || null,
          email: email || null,
          phone_number: phone || null,
        })
        .eq('id', profile.id);

      if (upErr) throw upErr;

      setOk('Αποθηκεύτηκαν οι αλλαγές.');
      setProfile({ ...profile, name: name || null, email: email || null, phone_number: phone || null });
    } catch (e: any) {
      setError(e?.message || 'Αποτυχία αποθήκευσης.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="muted">Φόρτωση…</div>;
  }
  if (error) {
    return <div className="error">{error}</div>;
  }
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
        <input
          className="input"
          type="text"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Πλήρες όνομα"
        />
      </div>

      <div className="field">
        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          placeholder="name@example.com"
          required
        />
      </div>

      <div className="field">
        <label className="label">Phone number</label>
        <input
          className="input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.currentTarget.value)}
          placeholder="+30 69..."
        />
      </div>

      <div className="actions">
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
      </div>

      {ok && <div className="ok">{ok}</div>}
      {error && <div className="error">{error}</div>}
    </form>
  );
}
