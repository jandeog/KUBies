import dynamic from 'next/dynamic';

// Load the client component only in the browser
const SitesClient = dynamic(() => import('./SitesClient'), { ssr: false });

// Optional: ensure no ISR caching
export const revalidate = 0;

export default function Page() {
  return <SitesClient />;
}
