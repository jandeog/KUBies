// (no 'use client' here)
import SitesClient from './SitesClient';

// Optional: keep if you had it; it's allowed in a server file
export const revalidate = 0;

export default function Page() {
  return <SitesClient />;
}
