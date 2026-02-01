import { execute, queryFirst } from '@/lib/db';

// ============================================================================
// Service Result Type
// ============================================================================

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number }
  | {
      success: false;
      warning: true;
      message: string;
      conflictWith: unknown;
      currentOrder: number;
    };

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check for display_order conflict and optionally swap
 * Returns null if no conflict or swap was handled, otherwise returns a warning result
 */
export async function handleDisplayOrderSwap<T extends { id: number; display_order: number }>(options: {
  table: 'sections' | 'links';
  currentItem: T;
  newOrder: number;
  confirmSwap: boolean;
  /** For links, we need to scope conflict check to the same section */
  sectionId?: number;
  /** Field to use for conflict message (e.g., 'title' for sections, 'label' for links) */
  nameField: keyof T;
}): Promise<ServiceResult<null> | null> {
  const { table, currentItem, newOrder, confirmSwap, sectionId, nameField } = options;

  // No change in display_order
  if (newOrder === currentItem.display_order) {
    return null;
  }

  // Build conflict query based on table type
  let conflictQuery: string;
  let conflictParams: unknown[];

  if (table === 'links' && sectionId !== undefined) {
    conflictQuery = `SELECT * FROM ${table} WHERE section_id = ? AND display_order = ? AND id != ?`;
    conflictParams = [sectionId, newOrder, currentItem.id];
  } else {
    conflictQuery = `SELECT * FROM ${table} WHERE display_order = ? AND id != ?`;
    conflictParams = [newOrder, currentItem.id];
  }

  const conflict = await queryFirst<T>(conflictQuery, conflictParams);

  if (!conflict) {
    return null; // No conflict
  }

  if (!confirmSwap) {
    return {
      success: false,
      warning: true,
      message: `Display order ${newOrder} is already used by "${conflict[nameField]}". Confirm to swap orders.`,
      conflictWith: conflict,
      currentOrder: currentItem.display_order,
    };
  }

  // Perform the swap
  await execute(
    `UPDATE ${table} SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [currentItem.display_order, conflict.id]
  );

  return null; // Swap handled
}

/**
 * Build and execute a dynamic UPDATE statement
 * Returns the number of fields that were updated
 */
export async function buildAndExecuteUpdate(options: {
  table: 'sections' | 'links' | 'settings';
  id: number;
  data: Record<string, unknown>;
  fieldMappings: {
    field: string;
    column: string;
    transform?: (value: unknown) => unknown;
  }[];
}): Promise<number> {
  const { table, id, data, fieldMappings } = options;

  const updates: string[] = [];
  const values: unknown[] = [];

  for (const mapping of fieldMappings) {
    if (mapping.field in data && data[mapping.field] !== undefined) {
      updates.push(`${mapping.column} = ?`);
      const value = data[mapping.field];
      values.push(mapping.transform ? mapping.transform(value) : value);
    }
  }

  if (updates.length === 0) {
    return 0;
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  await execute(`UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`, values);

  return updates.length - 1; // Exclude updated_at from count
}

/**
 * Convert boolean to SQLite integer (0 or 1)
 */
export function boolToInt(value: unknown): number {
  return value ? 1 : 0;
}
