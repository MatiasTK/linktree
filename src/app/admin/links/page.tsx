'use client';

import { DynamicIcon, IconSelector } from '@/components/icons';
import { SortableList } from '@/components/SortableList';
import { useToast } from '@/components/Toast';
import type { ApiResponse, ApiResponseWithWarning, IconType, Link as LinkType, Section } from '@/lib/types';
import { ExternalLink, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface SwapWarning {
  message: string;
  conflictWith: LinkType;
  currentOrder: number;
}

export default function LinksPage() {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);
  const [filterSection, setFilterSection] = useState<string>('');
  const [swapWarning, setSwapWarning] = useState<SwapWarning | null>(null);
  const toast = useToast();
  const [formData, setFormData] = useState({
    section_id: 0,
    label: '',
    url: '',
    icon_type: 'link' as IconType,
    is_visible: true,
    display_order: 0,
    group_title: '',
    group_order: 0,
  });

  const fetchLinks = useCallback(async () => {
    try {
      const url = filterSection ? `/api/links?sectionId=${filterSection}` : '/api/links';
      const res = await fetch(url);
      const data: ApiResponse<LinkType[]> = await res.json();
      if (data.success && data.data) {
        setLinks(data.data);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
    }
  }, [filterSection]);

  const fetchSections = useCallback(async () => {
    try {
      const res = await fetch('/api/sections');
      const data: ApiResponse<Section[]> = await res.json();
      if (data.success && data.data) {
        setSections(data.data);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchLinks(), fetchSections()]).finally(() => setLoading(false));
  }, [fetchLinks, fetchSections]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  function resetForm() {
    setFormData({
      section_id: sections[0]?.id || 0,
      label: '',
      url: '',
      icon_type: 'link',
      is_visible: true,
      display_order: 0,
      group_title: '',
      group_order: 0,
    });
    setEditingLink(null);
    setShowForm(false);
    setSwapWarning(null);
  }

  function handleEdit(link: LinkType) {
    setFormData({
      section_id: link.section_id,
      label: link.label,
      url: link.url,
      icon_type: link.icon_type as IconType,
      is_visible: link.is_visible === 1,
      display_order: link.display_order,
      group_title: link.group_title || '',
      group_order: link.group_order || 0,
    });
    setEditingLink(link);
    setShowForm(true);
    setSwapWarning(null);
  }

  function openAddForm() {
    setFormData({
      section_id: sections[0]?.id || 0,
      label: '',
      url: '',
      icon_type: 'link',
      is_visible: true,
      display_order: 0,
      group_title: '',
      group_order: 0,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent, confirmSwap = false) {
    e.preventDefault();

    const url = editingLink ? `/api/links/${editingLink.id}` : '/api/links';
    const method = editingLink ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, confirmSwap }),
      });
      const data: ApiResponseWithWarning<LinkType, LinkType> = await res.json();

      if (data.warning && !confirmSwap) {
        setSwapWarning({
          message: data.message!,
          conflictWith: data.conflictWith!,
          currentOrder: data.currentOrder!,
        });
        return;
      }

      if (data.success) {
        fetchLinks();
        resetForm();
      } else {
        toast.error(data.error || 'Failed to save link');
      }
    } catch (error) {
      console.error('Error saving link:', error);
      toast.error('Failed to save link');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this link?')) {
      return;
    }

    try {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
      const data: ApiResponse<{ deleted: boolean }> = await res.json();

      if (data.success) {
        fetchLinks();
      } else {
        toast.error(data.error || 'Failed to delete link');
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('Failed to delete link');
    }
  }

  async function toggleVisibility(link: LinkType) {
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: link.is_visible !== 1 }),
      });
      const data: ApiResponse<LinkType> = await res.json();

      if (data.success) {
        fetchLinks();
      }
    } catch (error) {
      console.error('Error updating link:', error);
    }
  }

  // Handle drag-drop reorder
  async function handleReorder(reorderedLinks: LinkType[]) {
    setLinks(reorderedLinks);
    for (let i = 0; i < reorderedLinks.length; i++) {
      const link = reorderedLinks[i];
      if (link.display_order !== i) {
        await fetch(`/api/links/${link.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display_order: i, confirmSwap: true }),
        });
      }
    }
    fetchLinks();
  }

  function getSectionName(sectionId: number) {
    return sections.find((s) => s.id === sectionId)?.title || 'Unknown';
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
        <h1 className="text-2xl font-bold">Links</h1>
        <button onClick={openAddForm} className="btn btn-primary" disabled={sections.length === 0}>
          <Plus size={18} />
          Add Link
        </button>
      </div>

      {sections.length === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <p className="text-yellow-600 dark:text-yellow-400">
            You need to create a section first before adding links.
          </p>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          className="select max-w-xs"
        >
          <option value="">All Sections</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.title}
            </option>
          ))}
        </select>
      </div>

      {/* Swap Warning */}
      {swapWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4 text-yellow-500">Order Conflict</h2>
            <p className="text-muted-foreground mb-4">{swapWarning.message}</p>
            <p className="text-sm mb-6">
              &quot;{swapWarning.conflictWith.label}&quot; will get order {swapWarning.currentOrder}{' '}
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
            <h2 className="text-lg font-semibold mb-4">{editingLink ? 'Edit Link' : 'New Link'}</h2>
            <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Section *</label>
                <select
                  value={formData.section_id}
                  onChange={(e) =>
                    setFormData({ ...formData, section_id: parseInt(e.target.value) })
                  }
                  className="select"
                  required
                >
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Label *</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="input"
                  placeholder="e.g. My GitHub"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL *</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="input"
                  placeholder="https://..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Icon</label>
                <IconSelector
                  value={formData.icon_type}
                  onChange={(icon) => setFormData({ ...formData, icon_type: icon })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Group Title</label>
                <input
                  type="text"
                  value={formData.group_title}
                  onChange={(e) => setFormData({ ...formData, group_title: e.target.value })}
                  className="input"
                  placeholder="e.g. Work, Social, etc."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Links with same group title are grouped
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Group Order</label>
                  <input
                    type="number"
                    value={formData.group_order}
                    onChange={(e) =>
                      setFormData({ ...formData, group_order: parseInt(e.target.value) || 0 })
                    }
                    className="input"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Order of the group</p>
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
                  <p className="text-xs text-muted-foreground mt-1">Order within group</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.is_visible}
                    onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="text-sm">Visible</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {editingLink ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Links List with Drag-Drop */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {links.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p>
              {filterSection
                ? 'No links in this section.'
                : 'No links yet. Create your first link!'}
            </p>
          </div>
        ) : (
          <SortableList
            items={links}
            onReorder={handleReorder}
            renderItem={(link) => (
              <div className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <DynamicIcon name={link.icon_type} className="text-primary" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{link.label}</p>
                  <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                      {getSectionName(link.section_id)}
                    </span>
                    {link.group_title && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {link.group_title}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Order: {link.display_order}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                    title="Open link"
                  >
                    <ExternalLink size={18} />
                  </a>
                  <button
                    onClick={() => toggleVisibility(link)}
                    className={`p-2 rounded-lg transition-colors ${
                      link.is_visible
                        ? 'text-green-500 hover:bg-green-500/10'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                    title={link.is_visible ? 'Visible' : 'Hidden'}
                  >
                    {link.is_visible ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button
                    onClick={() => handleEdit(link)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                    title="Edit"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
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
