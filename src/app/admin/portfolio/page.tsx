import { PortfolioWorkspace } from '@/components/admin/PortfolioWorkspace';
import { portfolioProfileService, projectsService } from '@/services';

export const dynamic = 'force-dynamic';

export default async function PortfolioAdminPage() {
  const [result, profile] = await Promise.all([projectsService.findAll(), portfolioProfileService.get()]);
  return (
    <PortfolioWorkspace
      initialProjects={result.success ? result.data : []}
      initialProfile={profile}
      loadError={!result.success}
    />
  );
}
