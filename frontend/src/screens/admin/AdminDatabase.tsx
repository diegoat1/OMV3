import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { adminService } from '../../services/adminService'
import { ApiError } from '../../services/apiClient'
import type {
  AdminDatabaseName,
  AdminTableDataResponse,
  AdminTableEntry,
  AdminTablesResponse,
} from '../../types/api'

const DB_LABEL: Record<AdminDatabaseName, string> = {
  main: 'Principal',
  clinical: 'Clinical (v3)',
  telemedicina: 'Telemedicina',
}

const DB_COLOR: Record<AdminDatabaseName, string> = {
  main: 'var(--analytic)',
  clinical: 'var(--medic)',
  telemedicina: 'var(--nutri)',
}

interface SelectedTable {
  name: string
  database: AdminDatabaseName
}

interface EditingCell {
  rowIndex: number
  column: string
  rowId: string | number
  value: string
}

export function AdminDatabase() {
  const [tables, setTables] = useState<AdminTablesResponse | null>(null)
  const [loadingTables, setLoadingTables] = useState(true)
  const [errorTables, setErrorTables] = useState<string | null>(null)
  const [selected, setSelected] = useState<SelectedTable | null>(null)
  const [tableData, setTableData] = useState<AdminTableDataResponse | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [errorData, setErrorData] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  const [editing, setEditing] = useState<EditingCell | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  // Load tables once
  useEffect(() => {
    let cancelled = false
    adminService
      .listTables()
      .then((res) => { if (!cancelled) setTables(res) })
      .catch((e) => {
        if (cancelled) return
        setErrorTables(e instanceof ApiError ? e.message : 'Error cargando tablas')
      })
      .finally(() => { if (!cancelled) setLoadingTables(false) })
    return () => { cancelled = true }
  }, [])

  // Load table data when selection changes
  const loadTable = useCallback(async () => {
    if (!selected) return
    setLoadingData(true)
    setErrorData(null)
    try {
      const res = await adminService.getTable(selected.name, {
        database: selected.database,
        page,
        per_page: 25,
      })
      setTableData(res)
    } catch (e) {
      setErrorData(e instanceof ApiError ? e.message : 'Error cargando datos')
    } finally {
      setLoadingData(false)
    }
  }, [selected, page])

  useEffect(() => { loadTable() }, [loadTable])

  const handleSelect = (name: string, database: AdminDatabaseName) => {
    setSelected({ name, database })
    setPage(1)
    setTableData(null)
  }

  const beginEdit = (rowIndex: number, column: string) => {
    if (!tableData) return
    const row = tableData.data[rowIndex]
    // First column is treated as the primary key by the backend.
    const pkColumn = tableData.columns[0]?.name
    if (!pkColumn) return
    const rowId = row[pkColumn]
    if (rowId == null) return
    setEditing({
      rowIndex,
      column,
      rowId: rowId as string | number,
      value: row[column] == null ? '' : String(row[column]),
    })
  }

  const commitEdit = async () => {
    if (!editing || !selected) return
    setSavingEdit(true)
    setErrorData(null)
    try {
      await adminService.updateTableRow(
        selected.name,
        editing.rowId,
        { column: editing.column, value: editing.value },
        selected.database,
      )
      setEditing(null)
      await loadTable()
    } catch (e) {
      setErrorData(e instanceof ApiError ? e.message : 'No pudimos guardar la edición')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleExport = async () => {
    if (!selected) return
    setExporting(true)
    try {
      const res = await adminService.exportTable(selected.name, selected.database)
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selected.database}-${selected.name}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setErrorData(e instanceof ApiError ? e.message : 'No se pudo exportar la tabla')
    } finally {
      setExporting(false)
    }
  }

  const renderTableList = (
    label: string,
    database: AdminDatabaseName,
    items: AdminTableEntry[],
  ) => (
    <div key={database} className="ph-section">
      <div className="row-between" style={{ marginBottom: 10 }}>
        <div className="section-label">{label}</div>
        <div className="mono" style={{ color: 'var(--text-3)' }}>
          {items.length} tabla{items.length === 1 ? '' : 's'}
        </div>
      </div>
      {items.length === 0 ? (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Sin tablas disponibles.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {items.map((t, i) => {
            const isActive = selected?.name === t.name && selected?.database === database
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => handleSelect(t.name, database)}
                style={{
                  width: '100%',
                  background: isActive ? 'rgba(125,140,255,0.08)' : 'transparent',
                  border: 0,
                  borderTop: i === 0 ? 0 : '1px solid var(--line)',
                  padding: '10px 14px',
                  textAlign: 'left',
                  color: 'var(--text-1)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <span
                  style={{
                    width: 6, height: 22, borderRadius: 3,
                    background: DB_COLOR[database],
                  }}
                />
                <span style={{ flex: 1, fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                  {t.name}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  {(t.rows ?? 0).toLocaleString('es-AR')} filas
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div className="ap-screen" data-mod="admin">
      <div className="ah-title-block">
        <div className="module-pill">Admin</div>
        <div className="display ah-title">
          <em>Base</em> de datos
        </div>
        <div className="ah-subtitle">
          {selected
            ? `${DB_LABEL[selected.database]} · ${selected.name}`
            : loadingTables
              ? 'Cargando tablas…'
              : 'Elegí una tabla para inspeccionarla'}
        </div>
      </div>

      {errorTables && (
        <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
          <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{errorTables}</p>
        </div>
      )}

      {/* Sidebar: lists of tables grouped by database */}
      {!selected && tables && (
        <>
          {renderTableList('Principal · src/Basededatos', 'main', Array.isArray(tables.main_database) ? tables.main_database : [])}
          {renderTableList('Clinical · src/db/clinical.db', 'clinical', Array.isArray(tables.clinical_database) ? tables.clinical_database : [])}
          {renderTableList('Telemedicina · src/telemedicina.db', 'telemedicina', Array.isArray(tables.telemedicina_database) ? tables.telemedicina_database : [])}
        </>
      )}

      {/* Detail view: rows + pagination + export */}
      {selected && (
        <>
          <div className="row-between" style={{ marginBottom: 10 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { setSelected(null); setTableData(null) }}
            >
              <Icon name="chevL" size={14} /> Volver
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleExport}
              disabled={exporting}
            >
              <Icon name="upload" size={14} />
              {exporting ? ' Exportando…' : ' Exportar JSON'}
            </button>
          </div>

          {loadingData && (
            <div className="card">
              <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Cargando…</p>
            </div>
          )}
          {errorData && (
            <div className="card" style={{ borderColor: 'rgba(226,62,74,0.3)' }}>
              <p style={{ fontSize: 13, color: 'var(--omega)', margin: 0 }}>{errorData}</p>
            </div>
          )}

          {tableData && !loadingData && (
            <>
              <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-2)' }}>
                      {(tableData.columns ?? []).map((c) => (
                        <th
                          key={c.name}
                          style={{
                            textAlign: 'left',
                            padding: '8px 12px',
                            color: 'var(--text-2)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid var(--line)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {c.name}
                          <span style={{ color: 'var(--text-3)', marginLeft: 6 }}>{c.type}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(tableData.data ?? []).length === 0 && (
                      <tr>
                        <td
                          colSpan={(tableData.columns ?? []).length}
                          style={{ padding: 16, color: 'var(--text-3)', textAlign: 'center' }}
                        >
                          Tabla vacía.
                        </td>
                      </tr>
                    )}
                    {(tableData.data ?? []).map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                        {(tableData.columns ?? []).map((c, colIdx) => {
                          const isEditing = editing?.rowIndex === i && editing?.column === c.name
                          // First column is the PK — not editable.
                          const editable = colIdx > 0
                          return (
                            <td
                              key={c.name}
                              onDoubleClick={() => editable && beginEdit(i, c.name)}
                              style={{
                                padding: isEditing ? 2 : '6px 12px',
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--text-1)',
                                maxWidth: 240,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                cursor: editable && !isEditing ? 'pointer' : 'default',
                              }}
                              title={
                                isEditing ? '' :
                                  editable
                                    ? 'Doble-click para editar'
                                    : 'Primary key — no editable'
                              }
                            >
                              {isEditing ? (
                                <input
                                  autoFocus
                                  value={editing.value}
                                  onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                  onBlur={commitEdit}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') commitEdit()
                                    if (e.key === 'Escape') setEditing(null)
                                  }}
                                  disabled={savingEdit}
                                  className="adm-input"
                                  style={{ padding: '4px 8px', fontSize: 12, fontFamily: 'var(--font-mono)' }}
                                />
                              ) : (
                                row[c.name] == null
                                  ? <span style={{ color: 'var(--text-3)' }}>—</span>
                                  : String(row[c.name])
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="row-between" style={{ marginTop: 10 }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  Página {tableData.pagination?.page ?? 1} / {tableData.pagination?.total_pages || 1} ·{' '}
                  {(tableData.pagination?.total ?? 0).toLocaleString('es-AR')} filas totales
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <Icon name="chevL" size={14} /> Anterior
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= (tableData.pagination?.total_pages || 1)}
                  >
                    Siguiente <Icon name="chevR" size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
