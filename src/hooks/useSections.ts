'use client';

import { useConfirm } from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';
import type { ApiResponse, ApiResponseWithWarning, Section } from '@/lib/types';
import { useCallback, useEffect, useState } from 'react';

interface SwapWarning {
  message: string;
  conflictWith: Section;
  currentOrder: number;
}

interface UseSectionsReturn {
  sections: Section[];
  loading: boolean;
  swapWarning: SwapWarning | null;
  fetchSections: () => Promise<void>;
  createSection: (data: SectionFormData, confirmSwap?: boolean) => Promise<boolean>;
  updateSection: (id: number, data: Partial<SectionFormData>, confirmSwap?: boolean) => Promise<boolean>;
  deleteSection: (id: number) => Promise<boolean>;
  toggleVisibility: (section: Section) => Promise<void>;
  reorderSections: (reordered: Section[]) => Promise<void>;
  clearSwapWarning: () => void;
}

export interface SectionFormData {
  title: string;
  slug: string;
  show_in_main: boolean;
  display_order: number;
  description: string;
  profile_initial: string;
  profile_image_url: string;
}

export function useSections(): UseSectionsReturn {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [swapWarning, setSwapWarning] = useState<SwapWarning | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const fetchSections = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const createSection = useCallback(
    async (formData: SectionFormData, confirmSwap = false): Promise<boolean> => {
      try {
        const res = await fetch('/api/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, confirmSwap }),
        });
        const data: ApiResponseWithWarning<Section, Section> = await res.json();

        if (data.warning && !confirmSwap) {
          setSwapWarning({
            message: data.message!,
            conflictWith: data.conflictWith!,
            currentOrder: data.currentOrder!,
          });
          return false;
        }

        if (data.success) {
          toast.success('Section created successfully');
          fetchSections();
          return true;
        } else {
          toast.error(data.error || 'Failed to create section');
          return false;
        }
      } catch (error) {
        console.error('Error creating section:', error);
        toast.error('Failed to create section');
        return false;
      }
    },
    [fetchSections, toast],
  );

  const updateSection = useCallback(
    async (id: number, formData: Partial<SectionFormData>, confirmSwap = false): Promise<boolean> => {
      try {
        const res = await fetch(`/api/sections/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, confirmSwap }),
        });
        const data: ApiResponseWithWarning<Section, Section> = await res.json();

        if (data.warning && !confirmSwap) {
          setSwapWarning({
            message: data.message!,
            conflictWith: data.conflictWith!,
            currentOrder: data.currentOrder!,
          });
          return false;
        }

        if (data.success) {
          toast.success('Section updated successfully');
          fetchSections();
          return true;
        } else {
          toast.error(data.error || 'Failed to update section');
          return false;
        }
      } catch (error) {
        console.error('Error updating section:', error);
        toast.error('Failed to update section');
        return false;
      }
    },
    [fetchSections, toast],
  );

  const deleteSection = useCallback(
    async (id: number): Promise<boolean> => {
      const confirmed = await confirm({
        title: 'Delete Section',
        message: 'Are you sure you want to delete this section? All links in it will also be deleted.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger',
      });

      if (!confirmed) return false;

      try {
        const res = await fetch(`/api/sections/${id}`, { method: 'DELETE' });
        const data: ApiResponse<{ deleted: boolean }> = await res.json();

        if (data.success) {
          toast.success('Section deleted successfully');
          fetchSections();
          return true;
        } else {
          toast.error(data.error || 'Failed to delete section');
          return false;
        }
      } catch (error) {
        console.error('Error deleting section:', error);
        toast.error('Failed to delete section');
        return false;
      }
    },
    [confirm, fetchSections, toast],
  );

  const toggleVisibility = useCallback(
    async (section: Section) => {
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
    },
    [fetchSections],
  );

  const reorderSections = useCallback(
    async (reorderedSections: Section[]) => {
      setSections(reorderedSections);

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
      fetchSections();
    },
    [fetchSections],
  );

  const clearSwapWarning = useCallback(() => {
    setSwapWarning(null);
  }, []);

  return {
    sections,
    loading,
    swapWarning,
    fetchSections,
    createSection,
    updateSection,
    deleteSection,
    toggleVisibility,
    reorderSections,
    clearSwapWarning,
  };
}
