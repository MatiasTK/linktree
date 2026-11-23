'use client';

import { useToast } from '@/components/Toast';
import type { Settings } from '@/lib/types';
import { MAX_LENGTHS } from '@/lib/validation';
import { useState } from 'react';
import { api } from './api';
import { TextAreaField, TextField } from './fields';
import { Workbench } from './Workbench';

export function SettingsWorkspace({ initialSettings }: { initialSettings: Settings }) {
  const toast = useToast();
  const [saved, setSaved] = useState(initialSettings);
  const [form, setForm] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewPath, setPreviewPath] = useState('/');
  const [previewVersion, setPreviewVersion] = useState(0);
  const [imageBroken, setImageBroken] = useState(false);

  const dirty =
    form.site_title !== saved.site_title ||
    form.site_description !== saved.site_description ||
    form.profile_image_url !== saved.profile_image_url;

  const set = (patch: Partial<Settings>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.site_title.trim()) return setError('The site needs a title; it is the big name on the home page.');
    setSaving(true);
    setError(null);
    try {
      const next = await api<Settings>('/api/settings', 'PUT', {
        site_title: form.site_title,
        site_description: form.site_description,
        profile_image_url: form.profile_image_url,
      });
      setSaved(next);
      setForm(next);
      setPreviewPath('/');
      setPreviewVersion((v) => v + 1);
      toast.success('Settings saved');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Workbench
      title="Settings"
      meta="home page profile"
      editor={null}
      onCloseEditor={() => {}}
      previewPages={[{ path: '/', label: 'Home' }]}
      previewPath={previewPath}
      onPreviewPathChange={setPreviewPath}
      previewVersion={previewVersion}
    >
      <form className="adm-form" onSubmit={submit} noValidate>
        <div className="adm-form__card">
          {error && (
            <p className="adm-panel__error" role="alert">
              {error}
            </p>
          )}
          <TextField
            label="Site title"
            value={form.site_title}
            onChange={(site_title) => set({ site_title })}
            maxLength={MAX_LENGTHS.site_title}
            hint="The big name on the home page, and the browser tab title."
          />
          <TextAreaField
            label="Description"
            value={form.site_description}
            onChange={(site_description) => set({ site_description })}
            maxLength={MAX_LENGTHS.site_description}
            rows={3}
            showCount
            hint="The line under the name, and the text link previews show."
          />
          <div className="adm-field-row adm-avatar-row">
            <span className="adm-avatar" aria-hidden>
              {form.profile_image_url && !imageBroken ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.profile_image_url} alt="" onError={() => setImageBroken(true)} onLoad={() => setImageBroken(false)} />
              ) : (
                (form.site_title.trim()[0] ?? 'M').toUpperCase()
              )}
            </span>
            <TextField
              label="Profile image URL"
              value={form.profile_image_url}
              onChange={(profile_image_url) => {
                setImageBroken(false);
                set({ profile_image_url });
              }}
              placeholder="https://…"
              inputMode="url"
              mono
              hint={imageBroken ? 'This address does not load an image.' : 'HTTPS only. Leave empty for no picture.'}
            />
          </div>
        </div>
        <div className="adm-form__actions">
          <button type="submit" className="btn btn-primary" disabled={saving || !dirty}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          {dirty && !saving && (
            <button type="button" className="btn btn-ghost" onClick={() => setForm(saved)}>
              Discard changes
            </button>
          )}
          <span className="adm-status" role="status">
            {dirty ? 'Unsaved changes' : 'All changes saved'}
          </span>
        </div>
      </form>
    </Workbench>
  );
}
