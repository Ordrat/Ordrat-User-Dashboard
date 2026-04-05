'use client';

import { useMemo, useState } from 'react';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Globe,
  Smartphone,
  Monitor,
  Columns3,
} from 'lucide-react';

import { usePageMeta } from '@/hooks/use-page-meta';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { DataGrid, DataGridContainer } from '@/components/ui/data-grid';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridColumnFilter } from '@/components/ui/data-grid-column-filter';
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility';
import { DataGridTableDnd } from '@/components/ui/data-grid-table-dnd';
import { DataGridTableDndRows, DataGridTableDndRowHandle } from '@/components/ui/data-grid-table-dnd-rows';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Mock data ────────────────────────────────────────────────────────────────

type Order = {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Failed';
  channel: 'Web' | 'Mobile' | 'POS';
  date: string;
};

const ORDERS: Order[] = [
  { id: '1',  customer: 'Ahmed Hassan',     product: 'Shawarma Plate',      amount: 45.50,  status: 'Paid',    channel: 'Web',    date: '2026-03-28' },
  { id: '2',  customer: 'Sara Al-Rashidi',  product: 'Grilled Chicken',     amount: 62.00,  status: 'Pending', channel: 'Mobile', date: '2026-03-27' },
  { id: '3',  customer: 'Omar Khalil',      product: 'Family Burger Meal',   amount: 120.00, status: 'Paid',    channel: 'POS',    date: '2026-03-27' },
  { id: '4',  customer: 'Layla Mansour',    product: 'Caesar Salad',        amount: 28.75,  status: 'Failed',  channel: 'Web',    date: '2026-03-26' },
  { id: '5',  customer: 'Khalid Al-Farsi',  product: 'Kofta Platter',       amount: 55.00,  status: 'Paid',    channel: 'Mobile', date: '2026-03-26' },
  { id: '6',  customer: 'Nora Saleh',       product: 'Mixed Grill',         amount: 95.50,  status: 'Paid',    channel: 'POS',    date: '2026-03-25' },
  { id: '7',  customer: 'Tariq Nasser',     product: 'Hummus & Bread',      amount: 22.00,  status: 'Pending', channel: 'Web',    date: '2026-03-25' },
  { id: '8',  customer: 'Rania Qassem',     product: 'Lamb Ouzi',           amount: 140.00, status: 'Paid',    channel: 'Mobile', date: '2026-03-24' },
  { id: '9',  customer: 'Faisal Al-Otaibi', product: 'Falafel Wrap',        amount: 18.50,  status: 'Failed',  channel: 'Web',    date: '2026-03-24' },
  { id: '10', customer: 'Hana Karimi',      product: 'Chicken Tikka',       amount: 48.00,  status: 'Paid',    channel: 'POS',    date: '2026-03-23' },
  { id: '11', customer: 'Yousef Braik',     product: 'Margherita Pizza',    amount: 35.00,  status: 'Pending', channel: 'Web',    date: '2026-03-23' },
  { id: '12', customer: 'Mona Al-Zahrani',  product: 'Seafood Pasta',       amount: 72.00,  status: 'Paid',    channel: 'Mobile', date: '2026-03-22' },
  { id: '13', customer: 'Bilal Hussain',    product: 'Steak & Fries',       amount: 88.50,  status: 'Paid',    channel: 'POS',    date: '2026-03-22' },
  { id: '14', customer: 'Dima Al-Harbi',    product: 'Vegetarian Bowl',     amount: 32.00,  status: 'Failed',  channel: 'Web',    date: '2026-03-21' },
  { id: '15', customer: 'Saad Al-Mutairi',  product: 'BBQ Ribs',            amount: 110.00, status: 'Paid',    channel: 'Mobile', date: '2026-03-21' },
  { id: '16', customer: 'Amal Turki',       product: 'Lentil Soup & Bread', amount: 16.00,  status: 'Pending', channel: 'Web',    date: '2026-03-20' },
  { id: '17', customer: 'Hamad Al-Dosari',  product: 'Chicken Kabsa',       amount: 75.00,  status: 'Paid',    channel: 'POS',    date: '2026-03-20' },
  { id: '18', customer: 'Sana Ibrahim',     product: 'Fish Tacos',          amount: 42.00,  status: 'Paid',    channel: 'Mobile', date: '2026-03-19' },
  { id: '19', customer: 'Majid Al-Shamsi',  product: 'Burger & Shake',      amount: 58.00,  status: 'Failed',  channel: 'Web',    date: '2026-03-19' },
  { id: '20', customer: 'Rana Jassim',      product: 'Mezze Platter',       amount: 65.00,  status: 'Paid',    channel: 'POS',    date: '2026-03-18' },
];

// ─── Shared cell renderers ────────────────────────────────────────────────────

const STATUS_STYLES: Record<Order['status'], string> = {
  Paid:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  Failed:  'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-rose-200 dark:border-rose-800',
};

const STATUS_ICONS: Record<Order['status'], React.ReactNode> = {
  Paid:    <CheckCircle2 className="size-3" />,
  Pending: <Clock className="size-3" />,
  Failed:  <XCircle className="size-3" />,
};

const CHANNEL_ICONS: Record<Order['channel'], React.ReactNode> = {
  Web:    <Globe className="size-3" />,
  Mobile: <Smartphone className="size-3" />,
  POS:    <Monitor className="size-3" />,
};

function StatusBadge({ status }: { status: Order['status'] }) {
  return (
    <Badge variant="outline" className={`gap-1 font-medium text-xs ${STATUS_STYLES[status]}`}>
      {STATUS_ICONS[status]}
      {status}
    </Badge>
  );
}

function ChannelBadge({ channel }: { channel: Order['channel'] }) {
  return (
    <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
      {CHANNEL_ICONS[channel]}
      {channel}
    </Badge>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function DemoSection({
  name,
  description,
  children,
  toolbar,
}: {
  name: string;
  description: string;
  children: React.ReactNode;
  toolbar?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-mono text-sm font-semibold text-foreground">{name}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── Column helpers ───────────────────────────────────────────────────────────

const col = createColumnHelper<Order>();

function baseColumns() {
  return [
    col.accessor('customer', {
      header: 'Customer',
      meta: { headerTitle: 'Customer' },
    }),
    col.accessor('product', {
      header: 'Product',
      meta: { headerTitle: 'Product' },
    }),
    col.accessor('amount', {
      header: 'Amount',
      cell: ({ getValue }) => (
        <span className="tabular-nums">SAR {getValue().toFixed(2)}</span>
      ),
      meta: { headerTitle: 'Amount' },
    }),
    col.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
      meta: { headerTitle: 'Status' },
    }),
    col.accessor('channel', {
      header: 'Channel',
      cell: ({ getValue }) => <ChannelBadge channel={getValue()} />,
      meta: { headerTitle: 'Channel' },
    }),
    col.accessor('date', {
      header: 'Date',
      meta: { headerTitle: 'Date' },
    }),
  ];
}

// ════════════════════════════════════════════════════════════════════════════════
// 1. BASIC
// ════════════════════════════════════════════════════════════════════════════════

function DemoBasic() {
  const columns = useMemo(() => baseColumns(), []);
  const table = useReactTable({ data: ORDERS, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <DemoSection
      name="DataGrid + DataGridTable"
      description="Default table — rows, headers, hover states. No extras."
    >
      <DataGrid table={table} recordCount={ORDERS.length}>
        <DataGridContainer>
          <DataGridTable />
        </DataGridContainer>
      </DataGrid>
    </DemoSection>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// 2. PAGINATED
// ════════════════════════════════════════════════════════════════════════════════

function DemoPaginated() {
  const columns = useMemo(() => baseColumns(), []);
  const table = useReactTable({
    data: ORDERS,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5, pageIndex: 0 } },
  });

  return (
    <DemoSection
      name="DataGrid + DataGridPagination"
      description="Client-side pagination with page size selector and page navigation."
    >
      <DataGrid table={table} recordCount={ORDERS.length}>
        <DataGridContainer>
          <DataGridTable />
        </DataGridContainer>
        <DataGridPagination sizes={[5, 10, 20]} className="px-4 py-3 border-t border-border" />
      </DataGrid>
    </DemoSection>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// 3. SORTABLE
// ════════════════════════════════════════════════════════════════════════════════

function DemoSortable() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      col.accessor('customer', {
        header: ({ column }) => <DataGridColumnHeader column={column} title="Customer" />,
        enableSorting: true,
        meta: { headerTitle: 'Customer' },
      }),
      col.accessor('product', {
        header: 'Product',
        enableSorting: false,
        meta: { headerTitle: 'Product' },
      }),
      col.accessor('amount', {
        header: ({ column }) => <DataGridColumnHeader column={column} title="Amount" />,
        cell: ({ getValue }) => <span className="tabular-nums">SAR {getValue().toFixed(2)}</span>,
        enableSorting: true,
        meta: { headerTitle: 'Amount' },
      }),
      col.accessor('status', {
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue()} />,
        enableSorting: false,
        meta: { headerTitle: 'Status' },
      }),
      col.accessor('channel', {
        header: 'Channel',
        cell: ({ getValue }) => <ChannelBadge channel={getValue()} />,
        enableSorting: false,
        meta: { headerTitle: 'Channel' },
      }),
      col.accessor('date', {
        header: ({ column }) => <DataGridColumnHeader column={column} title="Date" />,
        enableSorting: true,
        meta: { headerTitle: 'Date' },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: ORDERS,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <DemoSection
      name="DataGridColumnHeader"
      description="Click Customer, Amount, or Date headers to sort ascending → descending → clear."
    >
      <DataGrid table={table} recordCount={ORDERS.length}>
        <DataGridContainer>
          <DataGridTable />
        </DataGridContainer>
      </DataGrid>
    </DemoSection>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// 4. COLUMN FILTER (faceted)
// ════════════════════════════════════════════════════════════════════════════════

function DemoFilter() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const statusFilterFn = (
    row: import('@tanstack/react-table').Row<Order>,
    columnId: string,
    filterValues: string[],
  ) => {
    if (!filterValues.length) return true;
    return filterValues.includes(row.getValue(columnId));
  };
  statusFilterFn.autoRemove = (val: unknown) => !val || !(val as string[]).length;

  const columns = useMemo(
    () => [
      col.accessor('customer', { header: 'Customer', meta: { headerTitle: 'Customer' } }),
      col.accessor('product',  { header: 'Product',  meta: { headerTitle: 'Product' } }),
      col.accessor('amount', {
        header: 'Amount',
        cell: ({ getValue }) => <span className="tabular-nums">SAR {getValue().toFixed(2)}</span>,
        meta: { headerTitle: 'Amount' },
      }),
      col.accessor('status', {
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue()} />,
        filterFn: statusFilterFn,
        meta: { headerTitle: 'Status' },
      }),
      col.accessor('channel', {
        header: 'Channel',
        cell: ({ getValue }) => <ChannelBadge channel={getValue()} />,
        meta: { headerTitle: 'Channel' },
      }),
      col.accessor('date', { header: 'Date', meta: { headerTitle: 'Date' } }),
    ],
    [],
  );

  const table = useReactTable({
    data: ORDERS,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const statusOptions = [
    { label: 'Paid',    value: 'Paid' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Failed',  value: 'Failed' },
  ];

  const channelOptions = [
    { label: 'Web',    value: 'Web' },
    { label: 'Mobile', value: 'Mobile' },
    { label: 'POS',    value: 'POS' },
  ];

  return (
    <DemoSection
      name="DataGridColumnFilter"
      description="Faceted multi-select filter — shows count of matching rows per option."
      toolbar={
        <>
          <DataGridColumnFilter
            column={table.getColumn('status')}
            title="Status"
            options={statusOptions}
          />
          <DataGridColumnFilter
            column={table.getColumn('channel')}
            title="Channel"
            options={channelOptions}
          />
        </>
      }
    >
      <DataGrid table={table} recordCount={table.getFilteredRowModel().rows.length}>
        <DataGridContainer>
          <DataGridTable />
        </DataGridContainer>
      </DataGrid>
    </DemoSection>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// 5. COLUMN VISIBILITY
// ════════════════════════════════════════════════════════════════════════════════

function DemoVisibility() {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const columns = useMemo(() => baseColumns(), []);

  const table = useReactTable({
    data: ORDERS,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <DemoSection
      name="DataGridColumnVisibility"
      description="Toggle which columns are visible using the dropdown menu."
      toolbar={
        <DataGridColumnVisibility
          table={table}
          trigger={
            <Button variant="outline" size="sm">
              <Columns3 className="size-4" />
              Columns
            </Button>
          }
        />
      }
    >
      <DataGrid table={table} recordCount={ORDERS.length}>
        <DataGridContainer>
          <DataGridTable />
        </DataGridContainer>
      </DataGrid>
    </DemoSection>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// 6. DnD COLUMNS
// ════════════════════════════════════════════════════════════════════════════════

function DemoDndColumns() {
  const columns = useMemo(() => baseColumns(), []);

  const initialOrder = useMemo(
    () => columns.map((c) => (c as { accessorKey?: string; id?: string }).accessorKey ?? (c as { id?: string }).id ?? ''),
    [columns],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(initialOrder);

  const table = useReactTable({
    data: ORDERS.slice(0, 8),
    columns,
    state: { columnOrder },
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  return (
    <DemoSection
      name="DataGridTableDnd"
      description="Drag the grip handle in each column header to reorder columns."
    >
      <DataGrid
        table={table}
        recordCount={ORDERS.slice(0, 8).length}
        tableLayout={{ columnsDraggable: true }}
      >
        <DataGridContainer>
          <DataGridTableDnd handleDragEnd={handleDragEnd} />
        </DataGridContainer>
      </DataGrid>
    </DemoSection>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// 7. DnD ROWS
// ════════════════════════════════════════════════════════════════════════════════

function DemoDndRows() {
  const [data, setData] = useState(() => ORDERS.slice(0, 8));
  const dataIds = useMemo(() => data.map((d) => d.id), [data]);

  const columns = useMemo(
    () => [
      col.display({
        id: 'drag',
        header: '',
        cell: ({ row }) => <DataGridTableDndRowHandle rowId={row.id} />,
        meta: { cellClassName: 'w-10' },
      }),
      col.accessor('customer', { header: 'Customer', meta: { headerTitle: 'Customer' } }),
      col.accessor('product',  { header: 'Product',  meta: { headerTitle: 'Product' } }),
      col.accessor('amount', {
        header: 'Amount',
        cell: ({ getValue }) => <span className="tabular-nums">SAR {getValue().toFixed(2)}</span>,
        meta: { headerTitle: 'Amount' },
      }),
      col.accessor('status', {
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue()} />,
        meta: { headerTitle: 'Status' },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((prev) => {
        const oldIndex = prev.findIndex((d) => d.id === active.id);
        const newIndex = prev.findIndex((d) => d.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  return (
    <DemoSection
      name="DataGridTableDndRows"
      description="Drag the grip handle on the left of each row to reorder rows."
    >
      <DataGrid table={table} recordCount={data.length}>
        <DataGridContainer>
          <DataGridTableDndRows handleDragEnd={handleDragEnd} dataIds={dataIds} />
        </DataGridContainer>
      </DataGrid>
    </DemoSection>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// 8. DENSE
// ════════════════════════════════════════════════════════════════════════════════

function DemoDense() {
  const columns = useMemo(() => baseColumns(), []);
  const table = useReactTable({ data: ORDERS, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <DemoSection
      name="tableLayout: { dense: true }"
      description="Compact row height — more rows visible without scrolling."
    >
      <DataGrid table={table} recordCount={ORDERS.length} tableLayout={{ dense: true }}>
        <DataGridContainer>
          <DataGridTable />
        </DataGridContainer>
      </DataGrid>
    </DemoSection>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// 9. STRIPED
// ════════════════════════════════════════════════════════════════════════════════

function DemoStriped() {
  const columns = useMemo(() => baseColumns(), []);
  const table = useReactTable({ data: ORDERS, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <DemoSection
      name="tableLayout: { stripped: true }"
      description="Alternating row background for easier scanning. No row border dividers."
    >
      <DataGrid
        table={table}
        recordCount={ORDERS.length}
        tableLayout={{ stripped: true, rowBorder: false, headerBackground: false }}
      >
        <DataGridContainer>
          <DataGridTable />
        </DataGridContainer>
      </DataGrid>
    </DemoSection>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// 10. SKELETON LOADING
// ════════════════════════════════════════════════════════════════════════════════

function DemoSkeleton() {
  const [loading, setLoading] = useState(true);

  const columns = useMemo(
    () => [
      col.accessor('customer', {
        header: 'Customer',
        meta: { skeleton: <Skeleton className="h-4 w-28" /> },
      }),
      col.accessor('product', {
        header: 'Product',
        meta: { skeleton: <Skeleton className="h-4 w-36" /> },
      }),
      col.accessor('amount', {
        header: 'Amount',
        cell: ({ getValue }) => <span className="tabular-nums">SAR {getValue().toFixed(2)}</span>,
        meta: { skeleton: <Skeleton className="h-4 w-16" /> },
      }),
      col.accessor('status', {
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue()} />,
        meta: { skeleton: <Skeleton className="h-5 w-16 rounded-full" /> },
      }),
      col.accessor('channel', {
        header: 'Channel',
        cell: ({ getValue }) => <ChannelBadge channel={getValue()} />,
        meta: { skeleton: <Skeleton className="h-5 w-14 rounded-full" /> },
      }),
      col.accessor('date', {
        header: 'Date',
        meta: { skeleton: <Skeleton className="h-4 w-24" /> },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: loading ? [] : ORDERS.slice(0, 8),
    columns,
    getCoreRowModel: getCoreRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });

  return (
    <DemoSection
      name="isLoading + loadingMode: 'skeleton'"
      description="Skeleton rows shown while data is loading. Each column defines its own skeleton shape."
      toolbar={
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 2000);
          }}
        >
          Simulate load
        </Button>
      }
    >
      <DataGrid
        table={table}
        recordCount={8}
        isLoading={loading}
        loadingMode="skeleton"
        emptyMessage="No orders found."
      >
        <DataGridContainer>
          <DataGridTable />
        </DataGridContainer>
      </DataGrid>
    </DemoSection>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════════════

const TABS = [
  { value: 'basic',       label: 'Basic',            component: DemoBasic },
  { value: 'paginated',   label: 'Paginated',        component: DemoPaginated },
  { value: 'sortable',    label: 'Sortable',         component: DemoSortable },
  { value: 'filter',      label: 'Filter',           component: DemoFilter },
  { value: 'visibility',  label: 'Visibility',       component: DemoVisibility },
  { value: 'dnd-cols',    label: 'DnD Columns',      component: DemoDndColumns },
  { value: 'dnd-rows',    label: 'DnD Rows',         component: DemoDndRows },
  { value: 'dense',       label: 'Dense',            component: DemoDense },
  { value: 'striped',     label: 'Striped',          component: DemoStriped },
  { value: 'skeleton',    label: 'Skeleton',         component: DemoSkeleton },
] as const;

export default function UIKitPage() {
  usePageMeta('UI Kit — DataGrid');

  return (
    <div className="min-w-0 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">DataGrid Components</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All available DataGrid variants from <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">components/ui/</code> — filled with mock order data.
        </p>
      </div>

      <Tabs defaultValue="basic">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 rounded-lg">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map(({ value, component: Demo }) => (
          <TabsContent key={value} value={value} className="mt-6">
            <Demo />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
