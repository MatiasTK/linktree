'use client';

import { MAX_LENGTHS, SHORT_CODE_MAX } from '@/lib/validation';
import type { Link, Section } from '@/lib/types';
import { useState } from 'react';
import { api } from './api';
import { EditorPanel } from './EditorPanel';
import { IconPicker, SelectField, Switch, TextAreaField, TextField } from './fields';

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LENGTHS.slug);
}

/** Accept "github.com/x" as "https://github.com/x" and an address as mailto:. */
export function normalizeUrl(raw: string) {
  const value = raw.trim();
  if (!value) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(value)) return `mailto:${value}`;
  return `https://${value}`;
}

// ---------------------------------------------------------------------------
// Link
// ---------------------------------------------------------------------------

interface LinkEditorProps {
  link: Link | null;
  sectionId: number;
  sections: Section[];
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
  onDelete?: () => void;
}

export function LinkEditor({ link, sectionId, sections, onClose, onSaved, onDelete }: LinkEditorProps) {
  const [form, setForm] = useState({
    section_id: String(link?.section_id ?? sectionId),
    label: link?.label ?? '',
    url: link?.url ?? '',
    description: link?.description ?? '',
    icon_type: link?.icon_type ?? 'auto',
    is_visible: link ? link.is_visible === 1 : true,
    // new links get a short link; existing ones keep what they have
    short_link: link ? Boolean(link.short_code) : true,
    short_code: link?.short_code ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    const url = normalizeUrl(form.url);
    if (!form.label.trim()) return setError('Give the link a name; it is the big text on its key.');
    if (!url) return setError('Add the address the link opens.');
    setSaving(true);
    setError(null);
    try {
      const { short_code, ...rest } = form;
      const code = short_code.trim();
      const body = {
        ...rest,
        url,
        section_id: Number(form.section_id),
        // only send a code that was chosen or changed: an empty one means "random"
        ...(code && code !== link?.short_code ? { short_code: code } : {}),
      };
      if (link) await api(`/api/links/${link.id}`, 'PUT', body);
      else await api('/api/links', 'POST', body);
      await onSaved(link ? 'Link saved' : 'Link added');
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <EditorPanel
      title={link ? link.label : 'New link'}
      submitLabel={link ? 'Save link' : 'Add link'}
      saving={saving}
      error={error}
      onSubmit={submit}
      onClose={onClose}
      onDelete={onDelete}
    >
      <TextField
        label="Name"
        value={form.label}
        onChange={(label) => set({ label })}
        maxLength={MAX_LENGTHS.label}
        placeholder="GitHub"
      />
      <TextField
        label="Address"
        value={form.url}
        onChange={(url) => set({ url })}
        onBlur={() => set({ url: normalizeUrl(form.url) })}
        maxLength={MAX_LENGTHS.url}
        placeholder="github.com/matiastk"
        inputMode="url"
        mono
        hint="https, mailto: or tel:. A bare domain gets https:// added."
      />
      <TextAreaField
        label="Description"
        value={form.description}
        onChange={(description) => set({ description })}
        maxLength={MAX_LENGTHS.link_description}
        rows={2}
        showCount
        placeholder="Optional. One short line under the name."
      />
      <SelectField
        label="Section"
        value={form.section_id}
        onChange={(section_id) => set({ section_id })}
        options={sections.map((s) => ({ value: String(s.id), label: `${s.title}  /${s.slug}` }))}
        hint={link && Number(form.section_id) !== link.section_id ? 'Moves to the end of the other section.' : undefined}
      />
      <IconPicker value={form.icon_type} url={normalizeUrl(form.url)} onChange={(icon_type) => set({ icon_type })} />
      <Switch
        label="Visible"
        description="Hidden links stay here but leave the public page."
        checked={form.is_visible}
        onChange={(is_visible) => set({ is_visible })}
      />
      <ShortLinkFields
        link={link}
        url={normalizeUrl(form.url)}
        enabled={form.short_link}
        code={form.short_code}
        onEnabled={(short_link) => set({ short_link })}
        onCode={(short_code) => set({ short_code })}
      />
    </EditorPanel>
  );
}

interface ShortLinkFieldsProps {
  link: Link | null;
  url: string;
  enabled: boolean;
  code: string;
  onEnabled: (enabled: boolean) => void;
  onCode: (code: string) => void;
}

/** The link's own short link: on by default, with its code. */
function ShortLinkFields({ link, url, enabled, code, onEnabled, onCode }: ShortLinkFieldsProps) {
  const linkable = !url || /^https?:/i.test(url);
  const had = Boolean(link?.short_code);
  const trimmed = code.trim();

  let hint: React.ReactNode;
  if (had && trimmed && trimmed !== link!.short_code) hint = <>The old address /l/{link!.short_code} stops working.</>;
  else if (trimmed) hint = <>Share <span className="adm-mono">/l/{trimmed}</span> anywhere; visits show up in its stats and on the dashboard.</>;
  else hint = 'Leave empty for a random code.';

  return (
    <>
      <Switch
        label="Short link"
        description={
          linkable
            ? had && !enabled
              ? `Turning it off deletes /l/${link!.short_code} and its visit history.`
              : 'A /l/ address for this link, with full visit stats. It follows the link’s address.'
            : 'Only for http and https addresses.'
        }
        checked={enabled && linkable}
        onChange={onEnabled}
      />
      {enabled && linkable && (
        <TextField
          label="Short code"
          value={code}
          onChange={(value) => onCode(value.toLowerCase())}
          onBlur={() => code && onCode(slugify(code).slice(0, SHORT_CODE_MAX))}
          maxLength={SHORT_CODE_MAX}
          placeholder="random"
          mono
          hint={hint}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

interface SectionEditorProps {
  section: Section | null;
  onClose: () => void;
  onSaved: (message: string, slug?: string) => Promise<void>;
  onDelete?: () => void;
}

export function SectionEditor({ section, onClose, onSaved, onDelete }: SectionEditorProps) {
  const [form, setForm] = useState({
    title: section?.title ?? '',
    slug: section?.slug ?? '',
    description: section?.description ?? '',
    show_in_main: section ? section.show_in_main === 1 : true,
    profile_image_url: section?.profile_image_url ?? '',
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(section));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    if (!form.title.trim()) return setError('Give the section a title; it is the name on its key.');
    if (!form.slug) return setError('Pick the address of the section page.');
    setSaving(true);
    setError(null);
    try {
      if (section) await api(`/api/sections/${section.id}`, 'PUT', form);
      else await api('/api/sections', 'POST', form);
      await onSaved(section ? 'Section saved' : 'Section created', form.slug);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <EditorPanel
      title={section ? section.title : 'New section'}
      submitLabel={section ? 'Save section' : 'Create section'}
      saving={saving}
      error={error}
      onSubmit={submit}
      onClose={onClose}
      onDelete={onDelete}
      deleteLabel="Delete section"
    >
      <TextField
        label="Title"
        value={form.title}
        onChange={(title) => set({ title, ...(slugTouched ? {} : { slug: slugify(title) }) })}
        maxLength={MAX_LENGTHS.title}
        placeholder="Social"
      />
      <TextField
        label="Address"
        value={form.slug}
        onChange={(slug) => {
          setSlugTouched(true);
          set({ slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '') });
        }}
        maxLength={MAX_LENGTHS.slug}
        placeholder="social"
        mono
        hint={
          <>
            The page lives at <span className="adm-mono">/{form.slug || '…'}</span>. Lowercase letters, numbers and dashes.
            {section && form.slug !== section.slug && ' Changing it breaks links already shared.'}
          </>
        }
      />
      <TextAreaField
        label="Description"
        value={form.description}
        onChange={(description) => set({ description })}
        maxLength={MAX_LENGTHS.description}
        rows={2}
        placeholder="Optional. Shown under the title on the section page."
      />
      <Switch
        label="On the home page"
        description="Off keeps the page reachable by its address only."
        checked={form.show_in_main}
        onChange={(show_in_main) => set({ show_in_main })}
      />
      <TextField
        label="Image URL"
        value={form.profile_image_url}
        onChange={(profile_image_url) => set({ profile_image_url })}
        placeholder="https://…"
        inputMode="url"
        mono
        hint="Optional picture beside the title on this page. HTTPS only."
      />
    </EditorPanel>
  );
}
