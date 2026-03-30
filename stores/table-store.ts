/**
 * Table Store — Zustand (persisted to localStorage)
 *
 * Holds filter, pagination, and sort state for data tables.
 * State persists across navigation — user can leave the orders page,
 * come back, and their filters are still applied.
 *
 * Usage:
 *   const { getState, setPage, setSearch } = useTableStore()
 *   const state = getState('orders')      // get state for a domain
 *   setSearch('orders', 'john')           // update search
 *   setFilters('orders', { status: 'pending' })
 *
 * Domain keys — use these consistently:
 *   'orders' | 'products' | 'branches' | 'categories' | 'coupons'
 *   'employees' | 'reviews' | 'reservations' | 'analytics' | ...
 *
 * Do NOT use this for:
 *   - API data → TanStack Query
 *   - Modal/dialog open state → useState
 *   - Confirm dialogs → useUIStore
 *   - Layout state → useLayout()
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SortDir = 'asc' | 'desc';

export interface TableState {
  page: number;
  pageSize: number;
  search: string;
  sortBy: string | null;
  sortDir: SortDir;
  filters: Record<string, unknown>;
}

const defaultState = (): TableState => ({
  page: 1,
  pageSize: 10,
  search: '',
  sortBy: null,
  sortDir: 'asc',
  filters: {},
});

interface TableStoreState {
  tables: Record<string, TableState>;

  /** Get state for a domain — returns defaults if not yet set */
  getState: (domain: string) => TableState;

  setPage: (domain: string, page: number) => void;
  setPageSize: (domain: string, pageSize: number) => void;

  /** Resets to page 1 when search changes */
  setSearch: (domain: string, search: string) => void;

  setSorting: (domain: string, sortBy: string, sortDir: SortDir) => void;

  /** Merges partial filters — resets to page 1 */
  setFilters: (domain: string, filters: Record<string, unknown>) => void;

  /** Clear a single filter key */
  clearFilter: (domain: string, key: string) => void;

  /** Reset all state for a domain */
  resetTable: (domain: string) => void;
}

function patch(
  tables: Record<string, TableState>,
  domain: string,
  partial: Partial<TableState>,
): Record<string, TableState> {
  return {
    ...tables,
    [domain]: { ...(tables[domain] ?? defaultState()), ...partial },
  };
}

export const useTableStore = create<TableStoreState>()(
  persist(
    (set, get) => ({
      tables: {},

      getState: (domain) => get().tables[domain] ?? defaultState(),

      setPage: (domain, page) =>
        set((s) => ({ tables: patch(s.tables, domain, { page }) })),

      setPageSize: (domain, pageSize) =>
        set((s) => ({ tables: patch(s.tables, domain, { pageSize, page: 1 }) })),

      setSearch: (domain, search) =>
        set((s) => ({ tables: patch(s.tables, domain, { search, page: 1 }) })),

      setSorting: (domain, sortBy, sortDir) =>
        set((s) => ({ tables: patch(s.tables, domain, { sortBy, sortDir }) })),

      setFilters: (domain, filters) =>
        set((s) => ({ tables: patch(s.tables, domain, { filters, page: 1 }) })),

      clearFilter: (domain, key) =>
        set((s) => {
          const current = s.tables[domain] ?? defaultState();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [key]: _removed, ...rest } = current.filters;
          return { tables: patch(s.tables, domain, { filters: rest, page: 1 }) };
        }),

      resetTable: (domain) =>
        set((s) => ({ tables: patch(s.tables, domain, defaultState()) })),
    }),
    {
      name: 'ordrat-tables',
      // Only persist what matters — skip transient fields if needed
      partialize: (state) => ({ tables: state.tables }),
    },
  ),
);
