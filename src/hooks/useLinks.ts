'use client';

import { useConfirm } from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';
import type { ApiResponse, ApiResponseWithWarning, IconType, Link as LinkType, Section } from '@/lib/types';
import { useCallback, useEffect, useState } from 'react';

interface SwapWarning {
  message: string;
  conflictWith: LinkType;
  currentOrder: number;
}

interface UseLinksReturn {
  links: LinkType[];
  sections: Section[];
  loading: boolean;
  swapWarning: SwapWarning | null;
  filterSection: string;
  setFilterSection: (sectionId: string) => void;
  fetchLinks: () => Promise<void>;
  createLink: (data: LinkFormData, confirmSwap?: boolean) => Promise<boolean>;
  updateLink: (id: number, data: Partial<LinkFormData>, confirmSwap?: boolean) => Promise<boolean>;
  deleteLink: (id: number) => Promise<boolean>;
  toggleVisibility: (link: LinkType) => Promise<void>;
  reorderLinks: (reordered: LinkType[]) => Promise<void>;
  clearSwapWarning: () => void;
  getSectionName: (sectionId: number) => string;
}

export interface LinkFormData {
  section_id: number;
  label: string;
  url: string;
  icon_type: IconType;
  is_visible: boolean;
  display_order: number;
  group_title: string;
  group_order: number;
}

export function useLinks(): UseLinksReturn {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [swapWarning, setSwapWarning] = useState<SwapWarning | null>(null);
  const [filterSection, setFilterSection] = useState<string>('');
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
    }
  }, []);

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

  useEffect(() => {
    Promise.all([fetchLinks(), fetchSections()]).finally(() => setLoading(false));
  }, [fetchLinks, fetchSections]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const createLink = useCallback(
    async (formData: LinkFormData, confirmSwap = false): Promise<boolean> => {
      try {
        const res = await fetch('/api/links', {
          method: 'POST',
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
          return false;
        }

        if (data.success) {
          toast.success('Link created successfully');
          fetchLinks();
          return true;
        } else {
          toast.error(data.error || 'Failed to create link');
          return false;
        }
      } catch (error) {
        console.error('Error creating link:', error);
        toast.error('Failed to create link');
        return false;
      }
    },
    [fetchLinks, toast],
  );

  const updateLink = useCallback(
    async (id: number, formData: Partial<LinkFormData>, confirmSwap = false): Promise<boolean> => {
      try {
        const res = await fetch(`/api/links/${id}`, {
          method: 'PUT',
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
          return false;
        }

        if (data.success) {
          toast.success('Link updated successfully');
          fetchLinks();
          return true;
        } else {
          toast.error(data.error || 'Failed to update link');
          return false;
        }
      } catch (error) {
        console.error('Error updating link:', error);
        toast.error('Failed to update link');
        return false;
      }
    },
    [fetchLinks, toast],
  );

  const deleteLink = useCallback(
    async (id: number): Promise<boolean> => {
      const confirmed = await confirm({
        title: 'Delete Link',
        message: 'Are you sure you want to delete this link? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger',
      });

      if (!confirmed) return false;

      try {
        const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
        const data: ApiResponse<{ deleted: boolean }> = await res.json();

        if (data.success) {
          toast.success('Link deleted successfully');
          fetchLinks();
          return true;
        } else {
          toast.error(data.error || 'Failed to delete link');
          return false;
        }
      } catch (error) {
        console.error('Error deleting link:', error);
        toast.error('Failed to delete link');
        return false;
      }
    },
    [confirm, fetchLinks, toast],
  );

  const toggleVisibility = useCallback(
    async (link: LinkType) => {
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
    },
    [fetchLinks],
  );

  const reorderLinks = useCallback(
    async (reorderedLinks: LinkType[]) => {
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
    },
    [fetchLinks],
  );

  const clearSwapWarning = useCallback(() => {
    setSwapWarning(null);
  }, []);

  const getSectionName = useCallback(
    (sectionId: number) => {
      return sections.find((s) => s.id === sectionId)?.title || 'Unknown';
    },
    [sections],
  );

  return {
    links,
    sections,
    loading,
    swapWarning,
    filterSection,
    setFilterSection,
    fetchLinks,
    createLink,
    updateLink,
    deleteLink,
    toggleVisibility,
    reorderLinks,
    clearSwapWarning,
    getSectionName,
  };
}
