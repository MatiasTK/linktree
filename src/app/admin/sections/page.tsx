import { redirect } from 'next/navigation';

// Sections are edited together with their links.
export default function SectionsPage() {
  redirect('/admin/links');
}
