'use client';

import { useConfirm } from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';
import { hostOf } from '@/lib/link-icon';
import type { ShortLink } from '@/lib/types';
import { MAX_LENGTHS, SHORT_CODE_MAX } from '@/lib/validation';
import type { ShortLinkRow } from '@/services/short-links.service';
import { BarChart3, Pause, Pencil, Play, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { CopyButton } from './CopyButton';
import { EditorPanel } from './EditorPanel';
import { Switch, TextField } from './fields';
import { normalizeUrl, slugify } from './LinkEditors';
import { Workbench } from './Workbench';

type Editing = { id: number | null } | null;

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

const number = new Intl.NumberFormat('en');
const plural = (n: number, word: string) => `${number.format(n)} ${word}${n === 1 ? '' : 's'}`;

const ago = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
function since(ms: number | null) {
  if (!ms) return 'never clicked';
  const minutes = Math.round((ms - Date.now()) / 60000);
  if (minutes > -60) return ago.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours > -24) return ago.format(hours, 'hour');
  return ago.format(Math.round(hours / 24), 'day');
}

interface ShortLinksWorkspaceProps {
  initialLinks: ShortLinkRow[];
  /** open this link's editor on arrival (from the stats page) */
  editId?: number;
}

export function ShortLinksWorkspace({ initialLinks, editId }: ShortLinksWorkspaceProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const pathname = usePathname();
  const [links, setLinks] = useState(initialLinks);
  const [editing, setEditing] = useState<Editing>(
    editId && initialLinks.some((l) => l.id === editId) ? { id: editId } : null,
  );

  // drop ?edit= once used, so a reload does not reopen the editor
  useEffect(() => {
    if (editId) router.replace(pathname, { scroll: false });
  }, [editId, pathname, router]);

  const refresh = useCallback(async () => {
    try {
      setLinks(await api<ShortLinkRow[]>('/api/short-links'));
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [toast]);

  const closeEditor = useCallback(() => setEditing(null), []);

  // N: new short link
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditing({ id: null });
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const toggleActive = async (link: ShortLinkRow) => {
    const next = link.is_active ? 0 : 1;
    setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, is_active: next } : l)));
    try {
      await api(`/api/short-links/${link.id}`, 'PUT', { is_active: next === 1 });
      toast.success(next ? `/l/${link.code} redirects again` : `/l/${link.code} paused; it now sends visitors home`);
    } catch (error) {
      setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, is_active: link.is_active } : l)));
      toast.error((error as Error).message);
    }
  };

  const deleteLink = async (link: ShortLink) => {
    const ok = await confirm({
      title: `Delete /l/${link.code}?`,
      message: `The address stops working and its ${plural(link.clicks, 'click')} of history are dropped.${
        link.link_id !== null ? ' The link stays on your page, without a short link.' : ''
      } Pausing keeps the history. This cannot be undone.`,
      confirmText: 'Delete short link',
    });
    if (!ok) return;
    try {
      await api(`/api/short-links/${link.id}`, 'DELETE');
      await refresh();
      setEditing(null);
      toast.success('Short link deleted');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  let editor: React.ReactNode = null;
  if (editing) {
    const link = editing.id === null ? null : (links.find((l) => l.id === editing.id) ?? null);
    editor = (
      <ShortLinkEditor
        key={editing.id ?? 'new'}
        link={link}
        onClose={closeEditor}
        onSaved={async (saved, created) => {
          await refresh();
          setEditing(null);
          if (created) {
            try {
              await navigator.clipboard.writeText(`${window.location.origin}/l/${saved.code}`);
              toast.success(`/l/${saved.code} created and copied`);
            } catch {
              toast.success(`/l/${saved.code} created`);
            }
          } else {
            toast.success('Short link saved');
          }
        }}
        onDelete={link ? () => deleteLink(link) : undefined}
      />
    );
  }

  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);

  return (
    <Workbench
      title="Short links"
      meta={`${plural(links.length, 'link')} · ${plural(totalClicks, 'click')}`}
      actions={
        <button
          type="button"
          className={editing ? 'btn btn-secondary' : 'btn btn-primary'}
          onClick={() => setEditing({ id: null })}
          aria-keyshortcuts="N"
        >
          <Plus size={17} aria-hidden />
          Short link
          <span className="adm-kbd adm-kbd--hint" aria-hidden>
            N
          </span>
        </button>
      }
      editor={editor}
      onCloseEditor={closeEditor}
    >
      {links.length === 0 ? (
        <div className="adm-empty">
          <h2>Shorten any address</h2>
          <p>
            A short link like <span className="adm-mono">/l/cv</span> sends visitors to any URL and records each visit: when,
            from which app or site, country and city, device and browser. It does not appear on your public page.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setEditing({ id: null })}>
            <Plus size={17} aria-hidden />
            New short link
          </button>
        </div>
      ) : (
        <ul className="adm-links adm-shorts" role="list">
          {links.map((link) => {
            const paused = link.is_active !== 1;
            return (
              <li
                key={link.id}
                className="adm-short"
                data-selected={editing?.id === link.id ? 'true' : undefined}
                data-hidden={paused ? 'true' : undefined}
              >
                <Link href={`/admin/short-links/${link.id}`} className="adm-short__main">
                  <span className="adm-short__code adm-mono">
                    /l/{link.code}
                    {paused && <span className="adm-tag adm-tag--warn">paused</span>}
                    {link.link_id !== null && (
                      <span className="adm-tag" title="Belongs to a link on your page; it follows that link's address">
                        on page
                      </span>
                    )}
                  </span>
                  {(link.link_label ?? link.label) && <span className="adm-short__label">{link.link_label ?? link.label}</span>}
                  <span className="adm-short__dest adm-mono">→ {hostOf(link.url)}</span>
                </Link>
                <span className="adm-short__stats adm-mono">
                  <strong title="Clicks in the last 7 days">{number.format(link.week)}</strong>
                  <small>this week</small>
                  <small title="All-time clicks">
                    {number.format(link.clicks)} total · {since(link.last_click)}
                  </small>
                </span>
                <span className="adm-short__tools">
                  <CopyButton value={`/l/${link.code}`} label={`Copy /l/${link.code}`} />
                  <Link href={`/admin/short-links/${link.id}`} className="adm-tool" title="Open stats">
                    <BarChart3 size={17} aria-hidden />
                    <span className="sr-only">Open stats</span>
                  </Link>
                  <button
                    type="button"
                    className={paused ? 'adm-tool adm-tool--off' : 'adm-tool'}
                    aria-pressed={!paused}
                    onClick={() => toggleActive(link)}
                    title={paused ? 'Paused: visitors go to your home page. Click to resume.' : 'Redirecting. Click to pause.'}
                  >
                    {paused ? <Play size={17} aria-hidden /> : <Pause size={17} aria-hidden />}
                    <span className="sr-only">Redirecting</span>
                  </button>
                  <button type="button" className="adm-tool" onClick={() => setEditing({ id: link.id })} title="Edit">
                    <Pencil size={17} aria-hidden />
                    <span className="sr-only">Edit /l/{link.code}</span>
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Workbench>
  );
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

interface ShortLinkEditorProps {
  link: ShortLink | null;
  onClose: () => void;
  onSaved: (link: ShortLink, created: boolean) => Promise<void>;
  onDelete?: () => void;
}

function ShortLinkEditor({ link, onClose, onSaved, onDelete }: ShortLinkEditorProps) {
  const [form, setForm] = useState({
    url: link?.url ?? '',
    code: link?.code ?? '',
    label: link?.label ?? '',
    is_active: link ? link.is_active === 1 : true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    const url = normalizeUrl(form.url);
    if (!url) return setError('Add the address the short link opens.');
    if (link && !form.code.trim()) return setError('An existing short link keeps a code. Type one.');
    setSaving(true);
    setError(null);
    try {
      const body = followsLink
        ? { code: form.code.trim(), is_active: form.is_active }
        : { ...form, url, code: form.code.trim() };
      const saved = link
        ? await api<ShortLink>(`/api/short-links/${link.id}`, 'PUT', body)
        : await api<ShortLink>('/api/short-links', 'POST', body);
      await onSaved(saved, !link);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  const codeChanged = link && form.code.trim() && form.code.trim() !== link.code;
  const followsLink = link !== null && link.link_id !== null;

  return (
    <EditorPanel
      title={link ? `/l/${link.code}` : 'New short link'}
      submitLabel={link ? 'Save short link' : 'Create short link'}
      saving={saving}
      error={error}
      onSubmit={submit}
      onClose={onClose}
      onDelete={onDelete}
    >
      <TextField
        label="Destination"
        value={form.url}
        onChange={(url) => set({ url })}
        onBlur={() => set({ url: normalizeUrl(form.url) })}
        maxLength={MAX_LENGTHS.url}
        placeholder="docs.google.com/…/my-cv.pdf"
        inputMode="url"
        mono
        readOnly={followsLink}
        hint={
          followsLink ? (
            <>
              Follows its link on your page. Change the address in <a href="/admin/links">Links</a>.
            </>
          ) : (
            'Any http or https address. A bare domain gets https:// added.'
          )
        }
      />
      <TextField
        label="Code"
        value={form.code}
        onChange={(code) => set({ code: code.toLowerCase() })}
        onBlur={() => form.code && set({ code: slugify(form.code).slice(0, SHORT_CODE_MAX) })}
        maxLength={SHORT_CODE_MAX}
        placeholder={link ? '' : 'leave empty for a random one'}
        mono
        hint={
          codeChanged ? (
            <>The old address /l/{link.code} stops working.</>
          ) : (
            <>
              Becomes <span className="adm-mono">/l/{form.code.trim() || 'xxxxx'}</span>. Letters, numbers and hyphens.
            </>
          )
        }
      />
      <TextField
        label="Name"
        value={form.label}
        onChange={(label) => set({ label })}
        maxLength={MAX_LENGTHS.label}
        placeholder="Optional. Only you see it."
        readOnly={followsLink}
        hint={followsLink ? 'The name of its link.' : undefined}
      />
      <Switch
        label="Redirecting"
        description="Paused links send visitors to your home page and keep their history."
        checked={form.is_active}
        onChange={(is_active) => set({ is_active })}
      />
      <div className="adm-note">
        <strong>Tag where you share it.</strong> Apps like Instagram and WhatsApp often hide where a visit came from. Add{' '}
        <span className="adm-mono">?s=ig</span>, <span className="adm-mono">?s=qr</span> or any name to the address you post,
        and <span className="adm-mono">?c=launch</span> for a campaign. Standard <span className="adm-mono">utm_source</span>{' '}
        and <span className="adm-mono">utm_campaign</span> work too.
      </div>
    </EditorPanel>
  );
}
