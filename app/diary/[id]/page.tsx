// app/diary/[id]/page.tsx
import DiaryClient from './DiaryClient';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DiaryClient id={id} />;
}
