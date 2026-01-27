'use client';

import { useConfirm } from '@/components/ConfirmModal';
import { SortableList } from '@/components/SortableList';
import { useToast } from '@/components/Toast';
import type { ApiResponse, ApiResponseWithWarning, Section } from '@/lib/types';
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SwapWarning {
  message: string;
  conflictWith: Section;
  currentOrder: number;
}

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [swapWarning, setSwapWarning] = useState<SwapWarning | null>(null);
  const toast = useToast();
  const confirm = useConfirm();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    show_in_main: true,
    display_order: 0,
    description: '',
    profile_initial: '',
    profile_image_url: '',
  });

  useEffect(() => {
    fetchSections();
  }, []);

  async function fetchSections() {
    try {
      const res = await fetch('/api/sections');
      const data: ApiResponse<Section[]> = await res.json();
      if (data.success && data.data) {
        setSections(data.data);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      slug: '',
      show_in_main: true,
      display_order: 0,
      description: '',
      profile_initial: '',
      profile_image_url: '',
    });
    setEditingSection(null);
    setShowForm(false);
    setSwapWarning(null);
  }

  function handleEdit(section: Section) {
    setFormData({
      title: section.title,
      slug: section.slug,
      show_in_main: section.show_in_main === 1,
      display_order: section.display_order,
      description: section.description || '',
      profile_initial: section.profile_initial || '',
      profile_image_url: section.profile_image_url || '',
    });
    setEditingSection(section);
    setShowForm(true);
    setSwapWarning(null);
  }

  async function handleSubmit(e: React.FormEvent, confirmSwap = false) {
    e.preventDefault();

    const url = editingSection ? `/api/sections/${editingSection.id}` : '/api/sections';
    const method = editingSection ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, confirmSwap }),
      });
      const data: ApiResponseWithWarning<Section, Section> = await res.json();

      if (data.warning && !confirmSwap) {
        // Show swap confirmation
        setSwapWarning({
          message: data.message!,
          conflictWith: data.conflictWith!,
          currentOrder: data.currentOrder!,
        });
        return;
      }

      if (data.success) {
        toast.success(editingSection ? 'Section updated successfully' : 'Section created successfully');
        fetchSections();
        resetForm();
      } else {
        toast.error(data.error || 'Failed to save section');
      }
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error('Failed to save section');
    }
  }

  async function handleDelete(id: number) {
    const confirmed = await confirm({
      title: 'Delete Section',
      message: 'Are you sure you want to delete this section? All links in it will also be deleted.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/sections/${id}`, { method: 'DELETE' });
      const data: ApiResponse<{ deleted: boolean }> = await res.json();

      if (data.success) {
        toast.success('Section deleted successfully');
        fetchSections();
      } else {
        toast.error(data.error || 'Failed to delete section');
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    }
  }

  async function toggleVisibility(section: Section) {
    try {
      const res = await fetch(`/api/sections/${section.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_in_main: section.show_in_main !== 1 }),
      });
      const data: ApiResponse<Section> = await res.json();

      if (data.success) {
        fetchSections();
      }
    } catch (error) {
      console.error('Error updating section:', error);
    }
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Handle drag-drop reorder
  async function handleReorder(reorderedSections: Section[]) {
    // Update local state immediately for responsive UI
    setSections(reorderedSections);

    // Update display_order for each section
    for (let i = 0; i < reorderedSections.length; i++) {
      const section = reorderedSections[i];
      if (section.display_order !== i) {
        await fetch(`/api/sections/${section.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display_order: i, confirmSwap: true }),
        });
      }
    }
    fetchSections(); // Refresh to get accurate data
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sections</h1>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={18} />
          Add Section
        </button>
      </div>

      {/* Swap Warning Modal */}
      {swapWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4 text-yellow-500">Order Conflict</h2>
            <p className="text-muted-foreground mb-4">{swapWarning.message}</p>
            <p className="text-sm mb-6">
              &quot;{swapWarning.conflictWith.title}&quot; will get order {swapWarning.currentOrder}{' '}
              instead.
            </p>
            <div className="flex gap-3">
              <button onClick={resetForm} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={(e) => handleSubmit(e, true)} className="btn btn-primary flex-1">
                Swap Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && !swapWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md my-8">
            <h2 className="text-lg font-semibold mb-4">
              {editingSection ? 'Edit Section' : 'New Section'}
            </h2>
            <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      title: e.target.value,
                      slug: editingSection ? formData.slug : generateSlug(e.target.value),
                    });
                  }}
                  className="input"
                  placeholder="e.g. Social Media"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="input"
                  placeholder="e.g. social-media"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  placeholder="e.g. My social media profiles"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Profile Initial</label>
                  <input
                    type="text"
                    value={formData.profile_initial}
                    onChange={(e) =>
                      setFormData({ ...formData, profile_initial: e.target.value.charAt(0) })
                    }
                    className="input"
                    placeholder="S"
                    maxLength={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                    }
                    className="input"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Profile Image URL</label>
                <input
                  type="url"
                  value={formData.profile_image_url}
                  onChange={(e) => setFormData({ ...formData, profile_image_url: e.target.value })}
                  className="input"
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.show_in_main}
                    onChange={(e) => setFormData({ ...formData, show_in_main: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="text-sm">Show in main page</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {editingSection ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sections List with Drag-Drop */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {sections.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p>No sections yet. Create your first section!</p>
          </div>
        ) : (
          <SortableList
            items={sections}
            onReorder={handleReorder}
            renderItem={(section) => (
              <div className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{section.title}</p>
                  <p className="text-sm text-muted-foreground">/{section.slug}</p>
                </div>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                  Order: {section.display_order}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleVisibility(section)}
                    className={`p-2 rounded-lg transition-colors ${
                      section.show_in_main
                        ? 'text-green-500 hover:bg-green-500/10'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                    title={section.show_in_main ? 'Visible on main page' : 'Hidden from main page'}
                  >
                    {section.show_in_main ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button
                    onClick={() => handleEdit(section)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                    title="Edit"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(section.id)}
                    className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
