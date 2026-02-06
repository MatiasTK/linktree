'use client';

import { Button, Input, Select, Toggle } from '@/components/atoms';
import { FormField, IconSelector } from '@/components/molecules';
import type { LinkFormData } from '@/hooks/useLinks';
import type { IconType, Section } from '@/lib/types';

interface LinkFormProps {
  formData: LinkFormData;
  sections: Section[];
  isEditing: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onChange: (data: Partial<LinkFormData>) => void;
}

export function LinkForm({
  formData,
  sections,
  isEditing,
  onSubmit,
  onCancel,
  onChange,
}: LinkFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField label="Section" required>
        <Select
          value={formData.section_id}
          onChange={(e) => onChange({ section_id: parseInt(e.target.value) })}
          required
        >
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.title}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Label" required>
        <Input
          type="text"
          value={formData.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="e.g. My GitHub"
          required
        />
      </FormField>

      <FormField label="URL" required>
        <Input
          type="url"
          value={formData.url}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="https://..."
          required
        />
      </FormField>

      <FormField label="Icon">
        <IconSelector
          value={formData.icon_type}
          onChange={(icon: IconType) => onChange({ icon_type: icon })}
        />
      </FormField>

      <FormField label="Display Order" hint="Order within section">
        <Input
          type="number"
          value={formData.display_order !== undefined ? formData.display_order + 1 : ''}
          onChange={(e) =>
            onChange({
              display_order: e.target.value === '' ? undefined : parseInt(e.target.value) - 1,
            })
          }
          min={1}
          placeholder="Auto (último)"
        />
      </FormField>

      <Toggle
        label="Visible"
        checked={formData.is_visible}
        onChange={(e) => onChange({ is_visible: e.target.checked })}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          {isEditing ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
