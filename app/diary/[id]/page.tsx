// app/diary/[id]/page.tsx
import DiaryClient from './DiaryClient';

export default function Page({ params }: { params: { id: string } }) {
  return <DiaryClient id={params.id} />;
}
