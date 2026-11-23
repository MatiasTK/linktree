'use client';

import { Icon, LinkIcon } from '@/components/atoms';
import { AVAILABLE_ICONS } from '@/lib/types';
import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';

interface FieldProps {
  label: string;
  hint?: ReactNode;
  /** shows "n/max" next to the label */
  count?: { value: string; max: number };
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

export function Field({ label, hint, count, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="adm-field">
      <label className="adm-field__label" htmlFor={id}>
        {label}
        {count && (
          <span className="adm-field__count">
            {count.value.length}/{count.max}
          </span>
        )}
      </label>
      {children(id, hintId)}
      {hint && (
        <span className="adm-field__hint" id={hintId}>
          {hint}
        </span>
      )}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  label: string;
  hint?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  mono?: boolean;
  showCount?: boolean;
};

export function TextField({ label, hint, value, onChange, mono, showCount, maxLength, ...rest }: TextFieldProps) {
  return (
    <Field label={label} hint={hint} count={showCount && maxLength ? { value, max: maxLength } : undefined}>
      {(id, describedBy) => (
        <input
          id={id}
          className="input"
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={describedBy}
          data-mono={mono ? '' : undefined}
          spellCheck={mono ? false : undefined}
          autoComplete="off"
          {...rest}
        />
      )}
    </Field>
  );
}

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> & {
  label: string;
  hint?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  showCount?: boolean;
};

export function TextAreaField({ label, hint, value, onChange, showCount, maxLength, rows = 3, ...rest }: TextAreaFieldProps) {
  return (
    <Field label={label} hint={hint} count={showCount && maxLength ? { value, max: maxLength } : undefined}>
      {(id, describedBy) => (
        <textarea
          id={id}
          className="input"
          rows={rows}
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={describedBy}
          {...rest}
        />
      )}
    </Field>
  );
}

interface SelectFieldProps {
  label: string;
  hint?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function SelectField({ label, hint, value, onChange, options }: SelectFieldProps) {
  return (
    <Field label={label} hint={hint}>
      {(id, describedBy) => (
        <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={describedBy}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({ label, description, checked, onChange }: SwitchProps) {
  return (
    <label className="adm-switch">
      <span className="adm-switch__text">
        {label}
        {description && <small>{description}</small>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="adm-switch__track" aria-hidden />
    </label>
  );
}

const ICON_LABELS: Record<string, string> = {
  auto: 'Site icon',
  'map-pin': 'map pin',
  'book-open': 'book',
  'file-text': 'document',
  'shopping-bag': 'shop',
  'pen-tool': 'pen',
  'message-circle': 'chat',
};

/** Icon choice for a link: the site's own favicon first, then the glyph set. */
export function IconPicker({ value, url, onChange }: { value: string; url: string; onChange: (icon: string) => void }) {
  const labelId = useId();
  return (
    <div className="adm-field">
      <span className="adm-field__label" id={labelId}>
        Icon
      </span>
      <div className="adm-icons" role="radiogroup" aria-labelledby={labelId}>
        {AVAILABLE_ICONS.map((name) => {
          const checked = value === name;
          const label = ICON_LABELS[name] ?? name;
          return (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={label}
              title={label}
              tabIndex={checked || (!AVAILABLE_ICONS.includes(value as never) && name === 'auto') ? 0 : -1}
              className={name === 'auto' ? 'adm-icons__item adm-icons__item--auto' : 'adm-icons__item'}
              onClick={() => onChange(name)}
              onKeyDown={(e) => {
                const i = AVAILABLE_ICONS.indexOf(name);
                const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
                if (!step) return;
                e.preventDefault();
                const next = AVAILABLE_ICONS[(i + step + AVAILABLE_ICONS.length) % AVAILABLE_ICONS.length];
                onChange(next);
                const group = e.currentTarget.parentElement;
                requestAnimationFrame(() => group?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus());
              }}
            >
              {name === 'auto' ? (
                <>
                  <LinkIcon iconType="auto" url={url || 'https://example.com'} size={16} />
                  Site icon
                </>
              ) : (
                <Icon name={name} size={18} />
              )}
            </button>
          );
        })}
      </div>
      <span className="adm-field__hint">Site icon uses the destination&apos;s favicon.</span>
    </div>
  );
}
