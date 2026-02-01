'use client';

import { Button, LoadingPage } from '@/components/atoms';
import { EmptyState } from '@/components/molecules';
import { Modal, SectionForm, SectionListItem, SwapWarningModal } from '@/components/organisms';
import { SortableList } from '@/components/SortableList';
import { AdminPageTemplate } from '@/components/templates';
import { useModal, useSections, type SectionFormData } from '@/hooks';
import type { Section } from '@/lib/types';
import { Plus } from 'lucide-react';
import { useState } from 'react';

const initialFormData: SectionFormData = {
  title: '',
  slug: '',
  show_in_main: true,
  display_order: 0,
  description: '',
  profile_initial: '',
  profile_image_url: '',
};

export default function SectionsPage() {
  const {
    sections,
    loading,
    swapWarning,
    createSection,
    updateSection,
    deleteSection,
    toggleVisibility,
    reorderSections,
    clearSwapWarning,
  } = useSections();

  const formModal = useModal<Section>();
  const editingSection = formModal.data;
  const [formData, setFormData] = useState<SectionFormData>(initialFormData);

  const handleOpenForm = (section?: Section) => {
    if (section) {
      setFormData({
        title: section.title,
        slug: section.slug,
        show_in_main: section.show_in_main === 1,
        display_order: section.display_order,
        description: section.description || '',
        profile_initial: section.profile_initial || '',
        profile_image_url: section.profile_image_url || '',
      });
      formModal.open(section);
    } else {
      setFormData(initialFormData);
      formModal.open();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let success: boolean;
    if (editingSection) {
      success = await updateSection(editingSection.id, formData, false);
    } else {
      success = await createSection(formData, false);
    }

    if (success) {
      formModal.close();
      setFormData(initialFormData);
    }
  };

  const handleConfirmSwap = async () => {
    let success: boolean;
    if (editingSection) {
      success = await updateSection(editingSection.id, formData, true);
    } else {
      success = await createSection(formData, true);
    }

    if (success) {
      formModal.close();
      setFormData(initialFormData);
    }
  };

  const handleFormChange = (updates: Partial<SectionFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleCancel = () => {
    formModal.close();
    clearSwapWarning();
    setFormData(initialFormData);
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <AdminPageTemplate
      title="Sections"
      action={
        <Button onClick={() => handleOpenForm()}>
          <Plus size={18} />
          Add Section
        </Button>
      }
    >
      {/* Swap Warning Modal */}
      <SwapWarningModal
        isOpen={!!swapWarning}
        message={swapWarning?.message || ''}
        conflictLabel={swapWarning?.conflictWith?.title || ''}
        newOrder={swapWarning?.currentOrder || 0}
        onCancel={handleCancel}
        onConfirm={handleConfirmSwap}
      />

      {/* Form Modal */}
      <Modal
        isOpen={formModal.isOpen && !swapWarning}
        onClose={handleCancel}
        title={editingSection ? 'Edit Section' : 'New Section'}
      >
        <SectionForm
          formData={formData}
          isEditing={!!editingSection}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onChange={handleFormChange}
        />
      </Modal>

      {/* Sections List with Drag-Drop */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {sections.length === 0 ? (
          <EmptyState message="No sections yet. Create your first section!" />
        ) : (
          <SortableList
            items={sections}
            onReorder={reorderSections}
            renderItem={(section) => (
              <SectionListItem
                section={section}
                onEdit={() => handleOpenForm(section)}
                onDelete={() => deleteSection(section.id)}
                onToggleVisibility={() => toggleVisibility(section)}
              />
            )}
          />
        )}
      </div>
    </AdminPageTemplate>
  );
}
