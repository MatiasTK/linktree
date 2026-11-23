'use client';

import type { Credential, Experience, PortfolioProfile, SpecRow, StackGroup, T, WorkNote } from '@/content/portfolio';
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { api } from './api';
import { EditorPanel } from './EditorPanel';
import { TextField } from './fields';

const EMPTY_T: T = { en: '', es: '' };

/** One text in both languages: EN and ES inputs (or textareas) under one label. */
function BiField({
  label,
  value,
  onChange,
  multiline,
  rows = 3,
  hint,
  stack,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  multiline?: boolean;
  /** single-line, but EN over ES because the values run long */
  stack?: boolean;
  rows?: number;
  hint?: string;
}) {
  const id = useId();
  const input = (lang: 'en' | 'es') => {
    const common = {
      id: `${id}-${lang}`,
      className: 'input',
      value: value[lang],
      lang,
      'aria-label': `${label} (${lang === 'en' ? 'English' : 'Spanish'})`,
    };
    return (
      <span className="adm-bi__item" key={lang}>
        <span className="adm-bi__lang adm-mono" aria-hidden>
          {lang.toUpperCase()}
        </span>
        {multiline ? (
          <textarea {...common} rows={rows} onChange={(e) => onChange({ ...value, [lang]: e.target.value })} />
        ) : (
          <input {...common} onChange={(e) => onChange({ ...value, [lang]: e.target.value })} autoComplete="off" />
        )}
      </span>
    );
  };
  return (
    <div className="adm-field">
      <span className="adm-field__label" id={`${id}-label`}>
        {label}
      </span>
      <div
        className={multiline || stack ? 'adm-bi adm-bi--stack' : 'adm-bi'}
        role="group"
        aria-labelledby={`${id}-label`}
      >
        {input('en')}
        {input('es')}
      </div>
      {hint && <span className="adm-field__hint">{hint}</span>}
    </div>
  );
}

/** A reorderable list of small cards with add / move / remove. */
function RepeatList<I>({
  title,
  items,
  onChange,
  make,
  itemLabel,
  addLabel,
  render,
}: {
  title: string;
  items: I[];
  onChange: (items: I[]) => void;
  make: () => I;
  itemLabel: (item: I, index: number) => string;
  addLabel: string;
  render: (item: I, update: (patch: Partial<I>) => void) => ReactNode;
}) {
  const move = (from: number, to: number) => {
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  };
  return (
    <div className="adm-fieldset">
      <h3 className="adm-fieldset__title">{title}</h3>
      {items.map((item, i) => {
        const label = itemLabel(item, i);
        return (
          <div className="adm-repeat" key={i}>
            <div className="adm-repeat__head">
              <span className="adm-repeat__title">{label}</span>
              <button
                type="button"
                className="adm-tool"
                disabled={i === 0}
                onClick={() => move(i, i - 1)}
                title="Move up"
              >
                <ArrowUp size={16} aria-hidden />
                <span className="sr-only">Move {label} up</span>
              </button>
              <button
                type="button"
                className="adm-tool"
                disabled={i === items.length - 1}
                onClick={() => move(i, i + 1)}
                title="Move down"
              >
                <ArrowDown size={16} aria-hidden />
                <span className="sr-only">Move {label} down</span>
              </button>
              <button
                type="button"
                className="adm-tool adm-tool--danger"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                title="Remove"
              >
                <X size={16} aria-hidden />
                <span className="sr-only">Remove {label}</span>
              </button>
            </div>
            {render(item, (patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it))))}
          </div>
        );
      })}
      <button type="button" className="adm-repeat__add" onClick={() => onChange([...items, make()])}>
        <Plus size={16} aria-hidden />
        {addLabel}
      </button>
    </div>
  );
}

const pick = (x: T) => x.en || x.es;

interface ProfileEditorProps {
  initial: PortfolioProfile;
  onClose: () => void;
  onSaved: (profile: PortfolioProfile) => Promise<void> | void;
}

/** Everything on /portfolio that is not a project: profile, spec sheet, experience, stack, education, contact. */
export function ProfileEditor({ initial, onClose, onSaved }: ProfileEditorProps) {
  const [p, setP] = useState<PortfolioProfile>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<PortfolioProfile>) => setP((prev) => ({ ...prev, ...patch }));

  const submit = async () => {
    if (!p.name.trim()) return setError('The portfolio needs your name; it is the big title.');
    setSaving(true);
    setError(null);
    try {
      const saved = await api<PortfolioProfile>('/api/portfolio-profile', 'PUT', p);
      await onSaved(saved);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <EditorPanel
      title="Portfolio profile"
      submitLabel="Save profile"
      saving={saving}
      error={error}
      onSubmit={submit}
      onClose={onClose}
    >
      <TextField label="Name" value={p.name} onChange={(name) => set({ name })} />
      <BiField
        label="Headline"
        value={p.thesis}
        onChange={(thesis) => set({ thesis })}
        multiline
        rows={3}
        hint="The sentence under your name."
      />

      <div className="adm-fieldset">
        <h3 className="adm-fieldset__title">Contact keys</h3>
        <TextField label="Email" value={p.email} onChange={(email) => set({ email })} mono inputMode="email" />
        <TextField
          label="LinkedIn URL"
          value={p.linkedin}
          onChange={(linkedin) => set({ linkedin })}
          mono
          inputMode="url"
        />
        <TextField label="GitHub URL" value={p.github} onChange={(github) => set({ github })} mono inputMode="url" />
        <TextField
          label="CV URL"
          value={p.cvUrl ?? ''}
          onChange={(cvUrl) => set({ cvUrl: cvUrl || null })}
          mono
          inputMode="url"
          placeholder="https://…"
          hint="The Download CV key appears only when this is set."
        />
      </div>

      <RepeatList<SpecRow>
        title="Spec sheet"
        items={p.spec}
        onChange={(spec) => set({ spec })}
        make={() => ({ label: { ...EMPTY_T }, value: { ...EMPTY_T } })}
        itemLabel={(r, i) => pick(r.label) || `Row ${i + 1}`}
        addLabel="Add row"
        render={(r, update) => (
          <>
            <BiField label="Label" value={r.label} onChange={(label) => update({ label })} />
            <BiField label="Value" value={r.value} onChange={(value) => update({ value })} stack />
          </>
        )}
      />

      <RepeatList<Experience>
        title="Experience"
        items={p.experience}
        onChange={(experience) => set({ experience })}
        make={() => ({
          company: '',
          team: { ...EMPTY_T },
          role: '',
          period: { ...EMPTY_T },
          body: { ...EMPTY_T },
          tags: [],
        })}
        itemLabel={(e, i) => e.company || `Job ${i + 1}`}
        addLabel="Add job"
        render={(e, update) => (
          <>
            <div className="adm-field-row adm-field-row--2">
              <TextField label="Company" value={e.company} onChange={(company) => update({ company })} />
              <TextField label="Role" value={e.role} onChange={(role) => update({ role })} />
            </div>
            <BiField label="Team" value={e.team} onChange={(team) => update({ team })} stack />
            <BiField label="Period" value={e.period} onChange={(period) => update({ period })} />
            <BiField label="What you do" value={e.body} onChange={(body) => update({ body })} multiline rows={4} />
            <TextField
              label="Tags"
              value={e.tags.join(', ')}
              onChange={(tags) => update({ tags: tags.split(',').map((s) => s.trimStart()) })}
              hint="Comma-separated."
            />
          </>
        )}
      />
      <p className="adm-field__hint">The first job also appears under your name as the current role.</p>

      <RepeatList<WorkNote>
        title="How I work"
        items={p.howIWork}
        onChange={(howIWork) => set({ howIWork })}
        make={() => ({ title: { ...EMPTY_T }, body: { ...EMPTY_T } })}
        itemLabel={(n, i) => pick(n.title) || `Note ${i + 1}`}
        addLabel="Add note"
        render={(n, update) => (
          <>
            <BiField label="Title" value={n.title} onChange={(title) => update({ title })} />
            <BiField label="Text" value={n.body} onChange={(body) => update({ body })} multiline rows={3} />
          </>
        )}
      />

      <RepeatList<StackGroup>
        title="Stack"
        items={p.stack}
        onChange={(stack) => set({ stack })}
        make={() => ({ label: { ...EMPTY_T }, items: [] })}
        itemLabel={(g, i) => pick(g.label) || `Group ${i + 1}`}
        addLabel="Add group"
        render={(g, update) => (
          <>
            <BiField label="Group" value={g.label} onChange={(label) => update({ label })} />
            <TextField
              label="Tools"
              value={g.items.join(', ')}
              onChange={(items) => update({ items: items.split(',').map((s) => s.trimStart()) })}
              hint="Comma-separated."
            />
          </>
        )}
      />

      <div className="adm-fieldset">
        <h3 className="adm-fieldset__title">Education</h3>
        <BiField
          stack
          label="Studies"
          value={p.education.name}
          onChange={(name) => set({ education: { ...p.education, name } })}
        />
        <BiField
          stack
          label="School"
          value={p.education.school}
          onChange={(school) => set({ education: { ...p.education, school } })}
        />
      </div>

      <RepeatList<Credential>
        title="Credentials"
        items={p.credentials}
        onChange={(credentials) => set({ credentials })}
        make={() => ({ name: '', issuer: '', date: { ...EMPTY_T } })}
        itemLabel={(c, i) => c.name || `Credential ${i + 1}`}
        addLabel="Add credential"
        render={(c, update) => (
          <>
            <TextField label="Name" value={c.name} onChange={(name) => update({ name })} />
            <TextField label="Issuer" value={c.issuer} onChange={(issuer) => update({ issuer })} />
            <BiField label="Date" value={c.date} onChange={(date) => update({ date })} />
            <TextField
              label="Credential URL"
              value={c.url ?? ''}
              onChange={(url) => update({ url: url || undefined })}
              mono
              inputMode="url"
              placeholder="https://…"
            />
          </>
        )}
      />

      <div className="adm-fieldset">
        <h3 className="adm-fieldset__title">Contact section</h3>
        <BiField
          label="Title"
          value={p.contact.title}
          onChange={(title) => set({ contact: { ...p.contact, title } })}
        />
        <BiField
          label="Text"
          value={p.contact.body}
          onChange={(body) => set({ contact: { ...p.contact, body } })}
          multiline
          rows={3}
        />
      </div>
    </EditorPanel>
  );
}
