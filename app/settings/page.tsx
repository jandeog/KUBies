// app/settings/page.tsx
import SettingsClient from './SettingsClient';

export const metadata = { title: 'Settings' };

export default function Page() {
  return (
    <main className="page">
      <h1 className="page-title">Settings</h1>
      <SettingsClient />
    </main>
  );
}
