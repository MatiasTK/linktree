import { LinksWorkspace } from '@/components/admin/LinksWorkspace';
import { linksService, sectionsService } from '@/services';

export const dynamic = 'force-dynamic';

export default async function LinksPage() {
  const [sections, links] = await Promise.all([sectionsService.getAll(), linksService.getAll()]);
  return <LinksWorkspace initialSections={sections} initialLinks={links} />;
}
