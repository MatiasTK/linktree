'use client';

import { Button, LoadingPage, Select } from '@/components/atoms';
import { EmptyState } from '@/components/molecules';
import { LinkForm, LinkListItem, Modal, SwapWarningModal } from '@/components/organisms';
import { SortableList } from '@/components/SortableList';
import { AdminPageTemplate } from '@/components/templates';
import { useLinks, useModal, type LinkFormData } from '@/hooks';
import type { IconType, Link as LinkType } from '@/lib/types';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

const initialFormData: LinkFormData = {
  section_id: 0,
  label: '',
  url: '',
  icon_type: 'link' as IconType,
  is_visible: true,
  display_order: undefined,
};

export default function LinksPage() {
  const {
    links,
    sections,
    loading,
    swapWarning,
    filterSection,
    setFilterSection,
    createLink,
    updateLink,
    deleteLink,
    toggleVisibility,
    reorderLinks,
    clearSwapWarning,
    getSectionName,
  } = useLinks();

  const formModal = useModal<LinkType>();
  const editingLink = formModal.data;
  const [formData, setFormData] = useState<LinkFormData>(initialFormData);

  const handleOpenForm = (link?: LinkType) => {
    if (link) {
      setFormData({
        section_id: link.section_id,
        label: link.label,
        url: link.url,
        icon_type: link.icon_type as IconType,
        is_visible: link.is_visible === 1,
        display_order: link.display_order,
      });
      formModal.open(link);
    } else {
      setFormData({ ...initialFormData, section_id: sections[0]?.id || 0 });
      formModal.open();
    }
  };

  const handleSubmit = async (e: React.FormEvent, confirmSwap = false) => {
    e.preventDefault();

    let success: boolean;
    if (editingLink) {
      success = await updateLink(editingLink.id, formData, confirmSwap);
    } else {
      success = await createLink(formData, confirmSwap);
    }

    if (success) {
      formModal.close();
      setFormData(initialFormData);
    }
  };

  const handleConfirmSwap = async () => {
    let success: boolean;
    if (editingLink) {
      success = await updateLink(editingLink.id, formData, true);
    } else {
      success = await createLink(formData, true);
    }

    clearSwapWarning();
    if (success) {
      formModal.close();
      setFormData(initialFormData);
    }
  };

  const handleFormChange = (updates: Partial<LinkFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleCancel = () => {
    formModal.close();
    clearSwapWarning();
    setFormData(initialFormData);
  };

  // Group links by section for the "All Sections" view
  const linksBySection = useMemo(() => {
    if (filterSection) return [];
    const grouped: { section: (typeof sections)[number]; links: LinkType[] }[] = [];
    for (const section of sections) {
      const sectionLinks = links.filter((l) => l.section_id === section.id);
      if (sectionLinks.length > 0) {
        grouped.push({ section, links: sectionLinks });
      }
    }
    return grouped;
  }, [links, sections, filterSection]);

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <AdminPageTemplate
      title="Links"
      action={
        <Button onClick={() => handleOpenForm()} disabled={sections.length === 0}>
          <Plus size={18} />
          Add Link
        </Button>
      }
    >
      {sections.length === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <p className="text-yellow-600 dark:text-yellow-400">
            You need to create a section first before adding links.
          </p>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <Select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          className="max-w-xs"
        >
          <option value="">All Sections</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.title}
            </option>
          ))}
        </Select>
      </div>

      {/* Swap Warning */}
      <SwapWarningModal
        isOpen={!!swapWarning}
        message={swapWarning?.message || ''}
        conflictLabel={swapWarning?.conflictWith?.label || ''}
        newOrder={swapWarning?.currentOrder || 0}
        onCancel={handleCancel}
        onConfirm={handleConfirmSwap}
      />

      {/* Form Modal */}
      <Modal
        isOpen={formModal.isOpen && !swapWarning}
        onClose={handleCancel}
        title={editingLink ? 'Edit Link' : 'New Link'}
      >
        <LinkForm
          formData={formData}
          sections={sections}
          isEditing={!!editingLink}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onChange={handleFormChange}
        />
      </Modal>

      {/* Links List with Drag-Drop */}
      {links.length === 0 ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <EmptyState
            message={
              filterSection ? 'No links in this section.' : 'No links yet. Create your first link!'
            }
          />
        </div>
      ) : filterSection ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <SortableList
            items={links}
            onReorder={reorderLinks}
            renderItem={(link) => (
              <LinkListItem
                link={link}
                sectionName={getSectionName(link.section_id)}
                onEdit={() => handleOpenForm(link)}
                onDelete={() => deleteLink(link.id)}
                onToggleVisibility={() => toggleVisibility(link)}
              />
            )}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {linksBySection.map(({ section, links: sectionLinks }) => (
            <div
              key={section.id}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border bg-secondary/30">
                <h3 className="text-sm font-medium text-muted-foreground">{section.title}</h3>
              </div>
              <SortableList
                items={sectionLinks}
                onReorder={reorderLinks}
                renderItem={(link) => (
                  <LinkListItem
                    link={link}
                    sectionName={section.title}
                    onEdit={() => handleOpenForm(link)}
                    onDelete={() => deleteLink(link.id)}
                    onToggleVisibility={() => toggleVisibility(link)}
                  />
                )}
              />
            </div>
          ))}
        </div>
      )}
    </AdminPageTemplate>
  );
}
