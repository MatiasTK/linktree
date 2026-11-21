'use client';

import { Button, LoadingPage, Toggle } from '@/components/atoms';
import { useConfirm } from '@/components/ConfirmModal';
import { EmptyState, FormField, FormInput, IconButton } from '@/components/molecules';
import { Modal } from '@/components/organisms';
import { SortableList } from '@/components/SortableList';
import { AdminPageTemplate } from '@/components/templates';
import { useToast } from '@/components/Toast';
import type { ApiResponse, Project } from '@/lib/types';
import { ExternalLink, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type FormData = {
  slug: string;
  name: string;
  year: string;
  kind_en: string;
  kind_es: string;
  summary_en: string;
  summary_es: string;
  body_en: string;
  body_es: string;
  stack: string;
  image_url: string;
  site_url: string;
  repo_url: string;
  is_visible: boolean;
};

const EMPTY: FormData = {
  slug: '',
  name: '',
  year: '',
  kind_en: '',
  kind_es: '',
  summary_en: '',
  summary_es: '',
  body_en: '',
  body_es: '',
  stack: '',
  image_url: '',
  site_url: '',
  repo_url: '',
  is_visible: true,
};

function toForm(p: Project): FormData {
  return {
    slug: p.slug,
    name: p.name,
    year: p.year ?? '',
    kind_en: p.kind_en,
    kind_es: p.kind_es,
    summary_en: p.summary_en,
    summary_es: p.summary_es,
    body_en: p.body_en,
    body_es: p.body_es,
    stack: p.stack,
    image_url: p.image_url ?? '',
    site_url: p.site_url ?? '',
    repo_url: p.repo_url ?? '',
    is_visible: p.is_visible === 1,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function TextArea({
  label,
  hint,
  rows = 3,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  rows?: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormField label={label} hint={hint}>
      <textarea className="input min-h-0 resize-y" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </FormField>
  );
}

export default function PortfolioAdminPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Project | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data: ApiResponse<Project[]> = await res.json();
      if (data.success && data.data) setProjects(data.data);
      else toast.error(data.error || 'Could not load projects. Is migration 0007 applied?');
    } catch {
      toast.error('Could not load projects');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (updates: Partial<FormData>) => setForm((prev) => ({ ...prev, ...updates }));

  const openForm = (project?: Project) => {
    setEditing(project ?? null);
    setForm(project ? toForm(project) : EMPTY);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setEditing(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/projects/${editing.id}` : '/api/projects', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data: ApiResponse<Project> = await res.json();
      if (data.success) {
        toast.success(editing ? 'Project updated' : 'Project created');
        close();
        load();
      } else {
        toast.error(data.error || 'Could not save the project');
      }
    } catch {
      toast.error('Could not save the project');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (project: Project) => {
    const ok = await confirm({
      title: 'Delete project',
      message: `Delete "${project.name}" from the portfolio? This cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
    const data: ApiResponse<unknown> = await res.json();
    if (data.success) {
      toast.success('Project deleted');
      load();
    } else {
      toast.error(data.error || 'Could not delete the project');
    }
  };

  const toggleVisible = async (project: Project) => {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_visible: project.is_visible !== 1 }),
    });
    const data: ApiResponse<Project> = await res.json();
    if (data.success) load();
    else toast.error(data.error || 'Could not change visibility');
  };

  const reorder = async (reordered: Project[]) => {
    setProjects(reordered);
    const res = await fetch('/api/projects/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map((p) => p.id) }),
    });
    const data: ApiResponse<unknown> = await res.json();
    if (!data.success) {
      toast.error(data.error || 'Could not save the new order');
      load();
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <AdminPageTemplate
      title="Portfolio"
      action={
        <div className="flex items-center gap-2">
          <a href="/portfolio" target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            <ExternalLink size={16} aria-hidden />
            View page
          </a>
          <Button onClick={() => openForm()}>
            <Plus size={18} aria-hidden />
            Add project
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
        Projects on /portfolio are listed newest year first; the order here only breaks ties within the same year.
        Number keys 1–4 open the first four.
        Profile, experience, stack and education are edited in <code>src/content/portfolio.ts</code>.
      </p>

      <Modal isOpen={open} onClose={close} title={editing ? `Edit ${editing.name}` : 'New project'} className="max-w-3xl">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormInput
              label="Name"
              required
              value={form.name}
              onChange={(e) =>
                set({ name: e.target.value, ...(editing ? {} : { slug: slugify(e.target.value) }) })
              }
            />
            <FormInput
              label="Slug"
              required
              hint={`/portfolio/${form.slug || '…'}`}
              value={form.slug}
              onChange={(e) => set({ slug: e.target.value })}
            />
            <FormInput label="Year" value={form.year} onChange={(e) => set({ year: e.target.value })} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Type (EN)"
              placeholder="Web app"
              value={form.kind_en}
              onChange={(e) => set({ kind_en: e.target.value })}
            />
            <FormInput
              label="Tipo (ES)"
              placeholder="App web"
              value={form.kind_es}
              onChange={(e) => set({ kind_es: e.target.value })}
            />
            <TextArea label="Summary (EN)" hint="One sentence, shown on the list." value={form.summary_en} onChange={(v) => set({ summary_en: v })} />
            <TextArea label="Resumen (ES)" value={form.summary_es} onChange={(v) => set({ summary_es: v })} />
            <TextArea
              label="Case (EN)"
              rows={8}
              hint='Blank line between paragraphs; start a line with "- " for a list.'
              value={form.body_en}
              onChange={(v) => set({ body_en: v })}
            />
            <TextArea label="Caso (ES)" rows={8} value={form.body_es} onChange={(v) => set({ body_es: v })} />
          </div>

          <FormInput
            label="Stack"
            hint="Comma-separated, most important first."
            value={form.stack}
            onChange={(e) => set({ stack: e.target.value })}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <FormInput
              label="Image URL"
              type="url"
              placeholder="https://…"
              hint="HTTPS, 16:10 works best."
              value={form.image_url}
              onChange={(e) => set({ image_url: e.target.value })}
            />
            <FormInput label="Site URL" type="url" value={form.site_url} onChange={(e) => set({ site_url: e.target.value })} />
            <FormInput label="Repository URL" type="url" value={form.repo_url} onChange={(e) => set({ repo_url: e.target.value })} />
          </div>

          <Toggle label="Visible on /portfolio" checked={form.is_visible} onChange={(e) => set({ is_visible: e.target.checked })} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create project'}
            </Button>
          </div>
        </form>
      </Modal>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {projects.length === 0 ? (
          <EmptyState message="No projects yet. Add the first one, or apply migrations/0007_portfolio.sql to load the seed." />
        ) : (
          <SortableList
            items={projects}
            onReorder={reorder}
            renderItem={(project) => (
              <div className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    /portfolio/{project.slug}
                    {project.kind_en && ` · ${project.kind_en}`}
                    {!project.image_url && ' · no image'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <IconButton
                    icon={project.is_visible ? Eye : EyeOff}
                    variant={project.is_visible ? 'success' : 'muted'}
                    onClick={() => toggleVisible(project)}
                    title={project.is_visible ? 'Visible on /portfolio' : 'Hidden from /portfolio'}
                  />
                  <IconButton icon={Pencil} onClick={() => openForm(project)} title="Edit" />
                  <IconButton icon={Trash2} variant="danger" onClick={() => remove(project)} title="Delete" />
                </div>
              </div>
            )}
          />
        )}
      </div>
    </AdminPageTemplate>
  );
}
