'use client';

import { useConfirm } from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';
import type { PortfolioProfile } from '@/content/portfolio';
import type { Project } from '@/lib/types';
import { Eye, EyeOff, ImageOff, Plus, UserRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { EditorPanel } from './EditorPanel';
import { Switch, TextAreaField, TextField } from './fields';
import { slugify } from './LinkEditors';
import { ProfileEditor } from './ProfileEditor';
import { Sortable, SortableRow } from './Sortable';
import { Workbench } from './Workbench';

type Form = {
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

function toForm(p: Project | null): Form {
  return {
    slug: p?.slug ?? '',
    name: p?.name ?? '',
    year: p?.year ?? String(new Date().getFullYear()),
    kind_en: p?.kind_en ?? '',
    kind_es: p?.kind_es ?? '',
    summary_en: p?.summary_en ?? '',
    summary_es: p?.summary_es ?? '',
    body_en: p?.body_en ?? '',
    body_es: p?.body_es ?? '',
    stack: p?.stack ?? '',
    image_url: p?.image_url ?? '',
    site_url: p?.site_url ?? '',
    repo_url: p?.repo_url ?? '',
    is_visible: p ? p.is_visible === 1 : true,
  };
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

interface PortfolioWorkspaceProps {
  initialProjects: Project[];
  initialProfile: PortfolioProfile;
  loadError: boolean;
}

export function PortfolioWorkspace({ initialProjects, initialProfile, loadError }: PortfolioWorkspaceProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [projects, setProjects] = useState(initialProjects);
  const [editing, setEditing] = useState<number | 'new' | 'profile' | null>(null);
  const [profile, setProfile] = useState(initialProfile);
  const [previewPath, setPreviewPath] = useState('/portfolio?lang=en');
  const [previewVersion, setPreviewVersion] = useState(0);

  const refresh = useCallback(async () => {
    try {
      setProjects(await api<Project[]>('/api/projects'));
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [toast]);

  const bump = () => setPreviewVersion((v) => v + 1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditing('new');
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const open = (p: Project) => {
    setEditing(p.id);
    setPreviewPath(`/portfolio/${p.slug}?lang=en`);
  };

  const toggle = async (p: Project) => {
    const next = p.is_visible ? 0 : 1;
    setProjects((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_visible: next } : x)));
    try {
      await api(`/api/projects/${p.id}`, 'PUT', { is_visible: next === 1 });
      bump();
    } catch (error) {
      setProjects((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_visible: p.is_visible } : x)));
      toast.error((error as Error).message);
    }
  };

  const reorder = async (next: Project[]) => {
    const before = projects;
    setProjects(next);
    try {
      await api('/api/projects/reorder', 'PUT', { ids: next.map((p) => p.id) });
      bump();
    } catch (error) {
      setProjects(before);
      toast.error((error as Error).message);
    }
  };

  const remove = async (p: Project) => {
    const ok = await confirm({
      title: `Delete “${p.name}”?`,
      message: `It leaves /portfolio and /portfolio/${p.slug} stops working. This cannot be undone.`,
      confirmText: 'Delete project',
    });
    if (!ok) return;
    try {
      await api(`/api/projects/${p.id}`, 'DELETE');
      await refresh();
      setEditing(null);
      setPreviewPath('/portfolio?lang=en');
      bump();
      toast.success('Project deleted');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const closeEditor = useCallback(() => setEditing(null), []);
  const current = typeof editing === 'number' ? (projects.find((p) => p.id === editing) ?? null) : null;

  const editor =
    editing === null ? null : editing === 'profile' ? (
      <ProfileEditor
        initial={profile}
        onClose={closeEditor}
        onSaved={(saved) => {
          setProfile(saved);
          setEditing(null);
          setPreviewPath('/portfolio?lang=en');
          bump();
          toast.success('Profile saved');
        }}
      />
    ) : (
      <ProjectEditor
        key={String(editing)}
        project={current}
        onClose={closeEditor}
        onDelete={current ? () => remove(current) : undefined}
        onSaved={async (message, slug) => {
          await refresh();
          setEditing(null);
          setPreviewPath(`/portfolio/${slug}?lang=en`);
          bump();
          toast.success(message);
        }}
      />
    );

  const previewPages = [
    { path: '/portfolio?lang=en', label: '/portfolio  EN' },
    { path: '/portfolio?lang=es', label: '/portfolio  ES' },
    ...projects.flatMap((p) => [
      { path: `/portfolio/${p.slug}?lang=en`, label: `/${p.slug}  EN` },
      { path: `/portfolio/${p.slug}?lang=es`, label: `/${p.slug}  ES` },
    ]),
  ];

  const visible = projects.filter((p) => p.is_visible).length;

  return (
    <Workbench
      title="Portfolio"
      meta={`${projects.length} projects · ${visible} visible`}
      actions={
        <>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setEditing('profile');
              setPreviewPath('/portfolio?lang=en');
            }}
          >
            <UserRound size={17} aria-hidden />
            Profile
          </button>
          <button
            type="button"
            className={editing !== null ? 'btn btn-secondary' : 'btn btn-primary'}
            onClick={() => setEditing('new')}
            aria-keyshortcuts="N"
          >
            <Plus size={17} aria-hidden />
            Project
            <span className="adm-kbd adm-kbd--hint" aria-hidden>
              N
            </span>
          </button>
        </>
      }
      editor={editor}
      onCloseEditor={closeEditor}
      previewPages={previewPages}
      previewPath={previewPath}
      onPreviewPathChange={setPreviewPath}
      previewVersion={previewVersion}
    >
      <p className="adm-note">
        /portfolio lists projects newest year first; the order here only breaks ties within a year. Your name, headline,
        experience, stack, education and contact text are under <strong>Profile</strong>.
      </p>

      {loadError ? (
        <div className="adm-empty">
          <h2>Projects could not load</h2>
          <p>The projects table is probably missing. Apply the portfolio migration, then reload:</p>
          <code className="adm-code">npx wrangler d1 execute linktree-db --file=./migrations/0007_portfolio.sql</code>
        </div>
      ) : projects.length === 0 ? (
        <div className="adm-empty">
          <h2>No projects yet</h2>
          <p>Each project gets a row on /portfolio and its own case page, in English and Spanish.</p>
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
            <Plus size={17} aria-hidden />
            New project
          </button>
        </div>
      ) : (
        <div className="adm-section">
          <Sortable items={projects} onReorder={reorder}>
            <ul className="adm-links adm-links--flush" role="list">
              {projects.map((p) => {
                const hidden = p.is_visible !== 1;
                return (
                  <SortableRow
                    key={p.id}
                    id={p.id}
                    className="adm-link adm-link--project"
                    label={p.name}
                    as="li"
                    dataAttrs={{
                      'data-selected': editing === p.id ? 'true' : undefined,
                      'data-hidden': hidden ? 'true' : undefined,
                    }}
                  >
                    {(handle) => (
                      <>
                        {handle}
                        <span className="adm-thumb" aria-hidden>
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url} alt="" loading="lazy" />
                          ) : (
                            <ImageOff size={16} />
                          )}
                        </span>
                        <button type="button" className="adm-link__text" onClick={() => open(p)}>
                          <span className="adm-link__label">
                            {p.name}
                            {hidden && <span className="adm-tag adm-tag--warn adm-link__state">hidden</span>}
                          </span>
                          {p.kind_en && <span className="adm-link__desc">{p.kind_en}</span>}
                          <span className="adm-link__host adm-mono">/portfolio/{p.slug}</span>
                        </button>
                        <span className="adm-link__clicks adm-mono">{p.year ?? '—'}</span>
                        <span className="adm-link__tools">
                          <button
                            type="button"
                            className={hidden ? 'adm-tool adm-tool--off' : 'adm-tool'}
                            aria-pressed={!hidden}
                            onClick={() => toggle(p)}
                            title={
                              hidden
                                ? 'Hidden from /portfolio. Click to show.'
                                : 'Visible on /portfolio. Click to hide.'
                            }
                          >
                            {hidden ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
                            <span className="sr-only">Visible on /portfolio</span>
                          </button>
                        </span>
                      </>
                    )}
                  </SortableRow>
                );
              })}
            </ul>
          </Sortable>
        </div>
      )}
    </Workbench>
  );
}

interface ProjectEditorProps {
  project: Project | null;
  onClose: () => void;
  onDelete?: () => void;
  onSaved: (message: string, slug: string) => Promise<void>;
}

function ProjectEditor({ project, onClose, onDelete, onSaved }: ProjectEditorProps) {
  const [form, setForm] = useState<Form>(() => toForm(project));
  const [slugTouched, setSlugTouched] = useState(Boolean(project));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    if (!form.name.trim()) return setError('Give the project a name.');
    if (!form.slug) return setError('Pick the address of the case page.');
    setSaving(true);
    setError(null);
    try {
      if (project) await api(`/api/projects/${project.id}`, 'PUT', form);
      else await api('/api/projects', 'POST', form);
      await onSaved(project ? 'Project saved' : 'Project created', form.slug);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  const bodyHint = 'Blank line between paragraphs; start a line with "- " for a list.';

  return (
    <EditorPanel
      title={project ? project.name : 'New project'}
      submitLabel={project ? 'Save project' : 'Create project'}
      saving={saving}
      error={error}
      onSubmit={submit}
      onClose={onClose}
      onDelete={onDelete}
    >
      <TextField
        label="Name"
        value={form.name}
        onChange={(name) => set({ name, ...(slugTouched ? {} : { slug: slugify(name) }) })}
        placeholder="Matilist"
      />
      <div className="adm-field-row adm-field-row--2">
        <TextField
          label="Address"
          value={form.slug}
          onChange={(slug) => {
            setSlugTouched(true);
            set({ slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '') });
          }}
          mono
          hint={<span className="adm-mono">/portfolio/{form.slug || '…'}</span>}
        />
        <TextField
          label="Year"
          value={form.year}
          onChange={(year) => set({ year })}
          mono
          inputMode="numeric"
          maxLength={9}
        />
      </div>
      <TextField
        label="Stack"
        value={form.stack}
        onChange={(stack) => set({ stack })}
        hint="Comma-separated, most important first."
      />
      <Switch label="Visible on /portfolio" checked={form.is_visible} onChange={(is_visible) => set({ is_visible })} />

      <div className="adm-fieldset">
        <h3 className="adm-fieldset__title">English</h3>
        <TextField label="Type" value={form.kind_en} onChange={(kind_en) => set({ kind_en })} placeholder="Web app" />
        <TextAreaField
          label="Summary"
          value={form.summary_en}
          onChange={(summary_en) => set({ summary_en })}
          rows={2}
          hint="One sentence, shown on the list."
        />
        <TextAreaField
          label="Case"
          value={form.body_en}
          onChange={(body_en) => set({ body_en })}
          rows={7}
          hint={bodyHint}
        />
      </div>

      <div className="adm-fieldset">
        <h3 className="adm-fieldset__title" lang="es">
          Español
        </h3>
        <TextField
          label="Type"
          value={form.kind_es}
          onChange={(kind_es) => set({ kind_es })}
          placeholder="App web"
          lang="es"
        />
        <TextAreaField
          label="Summary"
          value={form.summary_es}
          onChange={(summary_es) => set({ summary_es })}
          rows={2}
          lang="es"
        />
        <TextAreaField label="Case" value={form.body_es} onChange={(body_es) => set({ body_es })} rows={7} lang="es" />
      </div>

      <div className="adm-fieldset">
        <h3 className="adm-fieldset__title">Links and image</h3>
        <TextField
          label="Site URL"
          value={form.site_url}
          onChange={(site_url) => set({ site_url })}
          mono
          inputMode="url"
          placeholder="https://…"
        />
        <TextField
          label="Repository URL"
          value={form.repo_url}
          onChange={(repo_url) => set({ repo_url })}
          mono
          inputMode="url"
          placeholder="https://github.com/…"
        />
        <TextField
          label="Image URL"
          value={form.image_url}
          onChange={(image_url) => set({ image_url })}
          mono
          inputMode="url"
          placeholder="https://…"
          hint="HTTPS. A 16:10 screenshot works best."
        />
      </div>
    </EditorPanel>
  );
}
