/**
 * DataTable.tsx
 *
 * Generic, reusable sortable data table.
 *
 * Features:
 *  - Column config-driven (no hard-coded fields)
 *  - Click-to-sort on any sortable column
 *  - Custom cell renderers via `render` function
 *  - Optional row-click handler
 *  - Built-in empty and loading states
 *  - Dark theme, consistent with the rest of the platform
 *
 * Usage:
 *  <DataTable
 *    columns={[
 *      { key: 'name', label: 'Name', sortable: true },
 *      { key: 'status', label: 'Status', render: (row) => <StatusBadge ... /> },
 *    ]}
 *    data={ambulances}
 *    onRowClick={(row) => navigate(`/admin/ambulances/${row.id}`)}
 *    loading={isLoading}
 *    emptyMessage="No ambulances found."
 *  />
 */

import React, { useState, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  /** Optional custom cell renderer — receives the full row object */
  render?: (row: T) => React.ReactNode;
  /** Alignment for the header and cell */
  align?: 'left' | 'center' | 'right';
  /** Min width for this column */
  minWidth?: number | string;
}

export interface DataTableProps<T extends { id: string }> {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  /** Optional row-level highlight condition */
  rowHighlight?: (row: T) => 'danger' | 'warning' | 'info' | null;
  /** Optional footer content rendered below the table */
  footer?: React.ReactNode;
  'aria-label'?: string;
}

type SortDir = 'asc' | 'desc';

// ─── Component ────────────────────────────────────────────────────────────────

function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  loading = false,
  emptyMessage = 'No records found.',
  rowHighlight,
  footer,
  'aria-label': ariaLabel,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: string) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const va = (a as Record<string, unknown>)[sortKey];
      const vb = (b as Record<string, unknown>)[sortKey];
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [data, sortKey, sortDir]);

  const ROW_HIGHLIGHT_COLORS = {
    danger:  { background: 'rgba(239,68,68,0.07)',  borderLeft: '3px solid #ef4444' },
    warning: { background: 'rgba(245,158,11,0.07)', borderLeft: '3px solid #f59e0b' },
    info:    { background: 'rgba(59,130,246,0.07)', borderLeft: '3px solid #3b82f6' },
  };

  return (
    <div style={wrapper}>
      {/* Scroll area */}
      <div style={scrollArea}>
        <table
          style={table}
          role="grid"
          aria-label={ariaLabel ?? 'Data table'}
          aria-busy={loading}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{
                    ...th,
                    textAlign: col.align ?? 'left',
                    minWidth: col.minWidth,
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: col.sortable ? 'none' : undefined,
                  }}
                  onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                  role={col.sortable ? 'columnheader' : undefined}
                  aria-sort={
                    col.sortable && sortKey === String(col.key)
                      ? sortDir === 'asc' ? 'ascending' : 'descending'
                      : col.sortable ? 'none' : undefined
                  }
                >
                  <span style={thInner}>
                    {col.label}
                    {col.sortable && (
                      <span style={{ opacity: sortKey === String(col.key) ? 1 : 0.3, fontSize: 9, marginLeft: 3 }}>
                        {sortKey === String(col.key) ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              // Loading skeleton rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  {columns.map((col) => (
                    <td key={String(col.key)} style={td}>
                      <div style={skeleton} />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={emptyCell}>
                  <div style={emptyInner}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((row) => {
                const highlight = rowHighlight?.(row);
                return (
                  <tr
                    key={row.id}
                    style={{
                      ...tr,
                      ...(highlight ? ROW_HIGHLIGHT_COLORS[highlight] : {}),
                      cursor: onRowClick ? 'pointer' : 'default',
                    }}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? 'row' : undefined}
                  >
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        style={{ ...td, textAlign: col.align ?? 'left' }}
                      >
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[String(col.key)] ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {footer && <div style={footerStyle}>{footer}</div>}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const wrapper: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  background: '#1e293b',
  borderRadius: 10,
  border: '1px solid #334155',
};

const scrollArea: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: '#334155 transparent',
};

const table: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
};

const th: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
  background: '#0f172a',
  padding: '11px 16px',
  fontSize: 10,
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  borderBottom: '2px solid #334155',
  whiteSpace: 'nowrap',
};

const thInner: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
};

const tr: React.CSSProperties = {
  borderBottom: '1px solid #1e293b',
  borderLeft: '3px solid transparent',
  transition: 'background 0.1s',
};

const td: React.CSSProperties = {
  padding: '11px 16px',
  color: '#f1f5f9',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
};

const emptyCell: React.CSSProperties = {
  padding: '56px 24px',
  textAlign: 'center',
};

const emptyInner: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
  color: '#475569',
  fontSize: 13,
};

const skeleton: React.CSSProperties = {
  height: 12,
  borderRadius: 6,
  background: 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
};

const footerStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderTop: '1px solid #334155',
  flexShrink: 0,
};

export default DataTable;
