// app/site-diary/page.tsx
export const metadata = { title: 'Site Diary' };

export default function SiteDiaryPage() {
  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24 }}>Site Diary</h1>
      <p style={{ opacity: 0.75 }}>Εδώ θα εμφανίζεται το ημερολόγιο εργοταξίου.</p>
    </main>
  );
}
