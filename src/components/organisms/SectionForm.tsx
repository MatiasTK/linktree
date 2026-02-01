'use client';

import { Button, Input, Toggle } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import type { SectionFormData } from '@/hooks/useSections';
import { generateSlug } from '@/lib/utils';

interface SectionFormProps {
  formData: SectionFormData;
  isEditing: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onChange: (data: Partial<SectionFormData>) => void;
}

export function SectionForm({
  formData,
  isEditing,
  onSubmit,
  onCancel,
  onChange,
}: SectionFormProps) {
  const handleTitleChange = (title: string) => {
    onChange({
      title,
      slug: isEditing ? formData.slug : generateSlug(title),
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField label="Title" required>
        <Input
          type="text"
          value={formData.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g. Social Media"
          required
        />
      </FormField>

      <FormField label="Slug" required>
        <Input
          type="text"
          value={formData.slug}
          onChange={(e) => onChange({ slug: e.target.value })}
          placeholder="e.g. social-media"
          required
        />
      </FormField>

      <FormField label="Description">
        <Input
          type="text"
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="e.g. My social media profiles"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Profile Initial">
          <Input
            type="text"
            value={formData.profile_initial}
            onChange={(e) => onChange({ profile_initial: e.target.value.charAt(0) })}
            placeholder="S"
            maxLength={1}
          />
        </FormField>

        <FormField label="Display Order">
          <Input
            type="number"
            value={formData.display_order}
            onChange={(e) => onChange({ display_order: parseInt(e.target.value) || 0 })}
            min={0}
          />
        </FormField>
      </div>

      <FormField label="Profile Image URL">
        <Input
          type="url"
          value={formData.profile_image_url}
          onChange={(e) => onChange({ profile_image_url: e.target.value })}
          placeholder="https://..."
        />
      </FormField>

      <Toggle
        label="Show in main page"
        checked={formData.show_in_main}
        onChange={(e) => onChange({ show_in_main: e.target.checked })}
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
