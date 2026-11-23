import { ShortLinksWorkspace } from '@/components/admin/ShortLinksWorkspace';
import { validatePositiveInt } from '@/lib/validation';
import { shortLinksService } from '@/services/short-links.service';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function ShortLinksPage({ searchParams }: PageProps) {
  const { edit } = await searchParams;
  const result = await shortLinksService.list();

  if (!result.success) {
    return (
      <div className="adm-dash">
        <header className="adm-head">
          <div className="adm-head__title">
            <h1>Short links</h1>
          </div>
        </header>
        <div className="adm-dash__body">
          <div className="adm-empty">
            <h2>Short links need one migration</h2>
            <p>The short links and their visit history live in two new tables. Apply them once:</p>
            <code className="adm-code">npx wrangler d1 execute linktree-db --file=./migrations/0009_short_links.sql</code>
          </div>
        </div>
      </div>
    );
  }

  const editId = edit ? validatePositiveInt(edit, -1) : -1;
  return <ShortLinksWorkspace initialLinks={result.data} editId={editId > 0 ? editId : undefined} />;
}
