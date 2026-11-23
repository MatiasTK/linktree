'use client';

import { LinkIcon } from '@/components/atoms';
import { useConfirm } from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';
import { hostOf } from '@/lib/link-icon';
import type { Link, Section } from '@/lib/types';
import { Eye, EyeOff, House, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { LinkEditor, SectionEditor } from './LinkEditors';
import { Sortable, SortableRow } from './Sortable';
import { Workbench } from './Workbench';

type Editing =
  | { kind: 'link'; id: number | null; sectionId: number }
  | { kind: 'section'; id: number | null }
  | null;

interface LinksWorkspaceProps {
  initialSections: Section[];
  initialLinks: Link[];
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function LinksWorkspace({ initialSections, initialLinks }: LinksWorkspaceProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [sections, setSections] = useState(initialSections);
  const [links, setLinks] = useState(initialLinks);
  const [editing, setEditing] = useState<Editing>(null);
  const [previewPath, setPreviewPath] = useState('/');
  const [previewVersion, setPreviewVersion] = useState(0);

  const linksBySection = useMemo(() => {
    const map = new Map<number, Link[]>();
    for (const s of sections) map.set(s.id, []);
    for (const l of [...links].sort((a, b) => a.display_order - b.display_order)) map.get(l.section_id)?.push(l);
    return map;
  }, [sections, links]);

  const refresh = useCallback(async () => {
    try {
      const [nextSections, nextLinks] = await Promise.all([
        api<Section[]>('/api/sections'),
        api<Link[]>('/api/links'),
      ]);
      setSections(nextSections);
      setLinks(nextLinks);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [toast]);

  const saved = useCallback(
    async (message: string) => {
      await refresh();
      setEditing(null);
      setPreviewVersion((v) => v + 1);
      toast.success(message);
    },
    [refresh, toast],
  );

  const sectionOf = (id: number) => sections.find((s) => s.id === id);

  const openLink = (link: Link) => {
    setEditing({ kind: 'link', id: link.id, sectionId: link.section_id });
    const section = sectionOf(link.section_id);
    if (section) setPreviewPath(`/${section.slug}`);
  };

  const newLink = useCallback(
    (sectionId?: number) => {
      const target = sectionId ?? (editing?.kind === 'link' ? editing.sectionId : sections[0]?.id);
      if (target === undefined) {
        setEditing({ kind: 'section', id: null });
        return;
      }
      setEditing({ kind: 'link', id: null, sectionId: target });
    },
    [editing, sections],
  );

  const openSection = (section: Section) => {
    setEditing({ kind: 'section', id: section.id });
    setPreviewPath(`/${section.slug}`);
  };

  // N: new link, from anywhere on the page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        newLink();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [newLink]);

  const toggleLink = async (link: Link) => {
    const next = link.is_visible ? 0 : 1;
    setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, is_visible: next } : l)));
    try {
      await api(`/api/links/${link.id}`, 'PUT', { is_visible: next === 1 });
      setPreviewVersion((v) => v + 1);
    } catch (error) {
      setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, is_visible: link.is_visible } : l)));
      toast.error((error as Error).message);
    }
  };

  const toggleHome = async (section: Section) => {
    const next = section.show_in_main ? 0 : 1;
    setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, show_in_main: next } : s)));
    try {
      await api(`/api/sections/${section.id}`, 'PUT', { show_in_main: next === 1 });
      setPreviewPath('/');
      setPreviewVersion((v) => v + 1);
    } catch (error) {
      setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, show_in_main: section.show_in_main } : s)));
      toast.error((error as Error).message);
    }
  };

  const reorderSections = async (next: Section[]) => {
    const before = sections;
    setSections(next.map((s, i) => ({ ...s, display_order: i })));
    try {
      await api('/api/sections/reorder', 'PUT', { ids: next.map((s) => s.id) });
      setPreviewPath('/');
      setPreviewVersion((v) => v + 1);
    } catch (error) {
      setSections(before);
      toast.error((error as Error).message);
    }
  };

  const reorderLinks = async (sectionId: number, next: Link[]) => {
    const before = links;
    const order = new Map(next.map((l, i) => [l.id, i]));
    setLinks((prev) => prev.map((l) => (order.has(l.id) ? { ...l, display_order: order.get(l.id)! } : l)));
    try {
      await api('/api/links/reorder', 'PUT', { ids: next.map((l) => l.id) });
      const section = sectionOf(sectionId);
      if (section) setPreviewPath(`/${section.slug}`);
      setPreviewVersion((v) => v + 1);
    } catch (error) {
      setLinks(before);
      toast.error((error as Error).message);
    }
  };

  const deleteLink = async (link: Link) => {
    const ok = await confirm({
      title: `Delete “${link.label}”?`,
      message: `It disappears from the page right away and its ${plural(link.clicks, 'click')} are dropped. This cannot be undone.`,
      confirmText: 'Delete link',
    });
    if (!ok) return;
    try {
      await api(`/api/links/${link.id}`, 'DELETE');
      await saved('Link deleted');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const deleteSection = async (section: Section) => {
    const count = linksBySection.get(section.id)?.length ?? 0;
    const ok = await confirm({
      title: `Delete “${section.title}”?`,
      message: `The page /${section.slug} goes away${count ? ` together with its ${plural(count, 'link')}` : ''}. This cannot be undone.`,
      confirmText: 'Delete section',
    });
    if (!ok) return;
    try {
      await api(`/api/sections/${section.id}`, 'DELETE');
      setPreviewPath('/');
      await saved('Section deleted');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const closeEditor = useCallback(() => setEditing(null), []);

  let editor: React.ReactNode = null;
  if (editing?.kind === 'link') {
    const link = editing.id === null ? null : links.find((l) => l.id === editing.id) ?? null;
    editor = (
      <LinkEditor
        key={`link-${editing.id ?? `new-${editing.sectionId}`}`}
        link={link}
        sectionId={editing.sectionId}
        sections={sections}
        onClose={closeEditor}
        onSaved={saved}
        onDelete={link ? () => deleteLink(link) : undefined}
      />
    );
  } else if (editing?.kind === 'section') {
    const section = editing.id === null ? null : sections.find((s) => s.id === editing.id) ?? null;
    editor = (
      <SectionEditor
        key={`section-${editing.id ?? 'new'}`}
        section={section}
        onClose={closeEditor}
        onSaved={async (message, slug) => {
          if (slug) setPreviewPath(`/${slug}`);
          await saved(message);
        }}
        onDelete={section ? () => deleteSection(section) : undefined}
      />
    );
  }

  const previewPages = [
    { path: '/', label: 'Home' },
    ...sections.map((s) => ({ path: `/${s.slug}`, label: `/${s.slug}` })),
  ];

  return (
    <Workbench
      title="Links"
      meta={`${plural(sections.length, 'section')} · ${plural(links.length, 'link')}`}
      actions={
        <>
          <button type="button" className="btn btn-ghost" onClick={() => setEditing({ kind: 'section', id: null })}>
            <Plus size={17} aria-hidden />
            Section
          </button>
          <button
            type="button"
            className={editing ? 'btn btn-secondary' : 'btn btn-primary'}
            onClick={() => newLink()}
            aria-keyshortcuts="N"
          >
            <Plus size={17} aria-hidden />
            Link
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
      {sections.length === 0 ? (
        <div className="adm-empty">
          <h2>Start with a section</h2>
          <p>
            A section is one page of links, like <span className="adm-mono">/social</span> or{' '}
            <span className="adm-mono">/contact</span>, and one key on your home page. Create one, then add its links.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setEditing({ kind: 'section', id: null })}>
            <Plus size={17} aria-hidden />
            New section
          </button>
        </div>
      ) : (
        <Sortable items={sections} onReorder={reorderSections}>
          <div className="adm-sections">
            {sections.map((section) => {
              const sectionLinks = linksBySection.get(section.id) ?? [];
              const clicks = sectionLinks.reduce((sum, l) => sum + l.clicks, 0);
              const selected = editing?.kind === 'section' && editing.id === section.id;
              return (
                <SortableRow key={section.id} id={section.id} className="adm-section" label={section.title} as="div">
                  {(handle) => (
                    <>
                      <div className="adm-section__head" data-selected={selected || undefined}>
                        {handle}
                        <button type="button" className="adm-section__title" onClick={() => openSection(section)}>
                          <h2>{section.title}</h2>
                          <span className="adm-section__slug adm-mono">/{section.slug}</span>
                          {!section.show_in_main && <span className="adm-tag adm-tag--warn">not on home</span>}
                        </button>
                        <div className="adm-section__tools">
                          <span className="adm-tag" title="All-time clicks on this section's links">
                            {clicks} clicks
                          </span>
                          <button
                            type="button"
                            className={section.show_in_main ? 'adm-tool' : 'adm-tool adm-tool--off'}
                            aria-pressed={section.show_in_main === 1}
                            onClick={() => toggleHome(section)}
                            title={section.show_in_main ? 'Shown on the home page. Click to hide.' : 'Hidden from the home page. Click to show.'}
                          >
                            {section.show_in_main ? <House size={17} aria-hidden /> : <HouseOff />}
                            <span className="sr-only">Show on home page</span>
                          </button>
                        </div>
                      </div>

                      {sectionLinks.length === 0 ? (
                        <p className="adm-section__empty">No links yet. Its page shows an empty board until you add one.</p>
                      ) : (
                        <Sortable items={sectionLinks} onReorder={(next) => reorderLinks(section.id, next)}>
                          <ul className="adm-links" role="list">
                            {sectionLinks.map((link) => (
                              <LinkRow
                                key={link.id}
                                link={link}
                                selected={editing?.kind === 'link' && editing.id === link.id}
                                onOpen={() => openLink(link)}
                                onToggle={() => toggleLink(link)}
                              />
                            ))}
                          </ul>
                        </Sortable>
                      )}

                      <button type="button" className="adm-section__add" onClick={() => newLink(section.id)}>
                        <Plus size={16} aria-hidden />
                        Add link to {section.title}
                      </button>
                    </>
                  )}
                </SortableRow>
              );
            })}
          </div>
        </Sortable>
      )}
    </Workbench>
  );
}

function HouseOff() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M2 2l20 20" />
    </svg>
  );
}

interface LinkRowProps {
  link: Link;
  selected: boolean;
  onOpen: () => void;
  onToggle: () => void;
}

function LinkRow({ link, selected, onOpen, onToggle }: LinkRowProps) {
  const hidden = link.is_visible !== 1;
  return (
    <SortableRow
      id={link.id}
      className="adm-link"
      label={link.label}
      as="li"
      dataAttrs={{ 'data-selected': selected ? 'true' : undefined, 'data-hidden': hidden ? 'true' : undefined }}
    >
      {(handle) => (
        <>
          {handle}
          <span className="adm-link__icon" aria-hidden>
            <LinkIcon iconType={link.icon_type} url={link.url} size={16} />
          </span>
          <button type="button" className="adm-link__text" onClick={onOpen}>
            <span className="adm-link__label">
              {link.label}
              {hidden && <span className="adm-tag adm-tag--warn adm-link__state">hidden</span>}
            </span>
            {link.description && <span className="adm-link__desc">{link.description}</span>}
            <span className="adm-link__host adm-mono">
              {hostOf(link.url)}
              {link.short_code && <span className="adm-link__short"> · /l/{link.short_code}</span>}
            </span>
          </button>
          <span className="adm-link__clicks adm-mono" title="All-time clicks" aria-label={`${link.clicks} clicks`}>
            {link.clicks}
          </span>
          <span className="adm-link__tools">
            <button
              type="button"
              className={hidden ? 'adm-tool adm-tool--off' : 'adm-tool'}
              aria-pressed={!hidden}
              onClick={onToggle}
              title={hidden ? 'Hidden from the page. Click to show.' : 'Visible on the page. Click to hide.'}
            >
              {hidden ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
              <span className="sr-only">Visible on the page</span>
            </button>
          </span>
        </>
      )}
    </SortableRow>
  );
}
