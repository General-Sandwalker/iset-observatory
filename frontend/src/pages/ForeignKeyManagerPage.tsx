import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Row, Col, Button, Space, Typography, Table, Select,
  Tag, Spin, Empty, Popconfirm, message, theme, Tooltip, Badge,
  Modal, Steps, Alert, Progress,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ApartmentOutlined, PlusOutlined, DeleteOutlined,
  RobotOutlined, LinkOutlined, TableOutlined,
  ReloadOutlined, DatabaseOutlined, InfoCircleOutlined,
  CheckCircleOutlined, WarningOutlined, SwapOutlined,
  BulbOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import api from '../lib/api';
import type { ForeignLink, Dataset, ColumnMapping } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;

interface TableSchema {
  id: number;
  name: string;
  table_name: string;
  columns: ColumnMapping[];
}

interface SuggestedLink {
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

const ER_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#6366f1', '#a855f7', '#22c55e', '#eab308',
];

function colNameMatch(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return norm(a) === norm(b);
}

function colNameSimilarity(a: string, b: string): number {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return 1;
  if (na.endsWith('id') && nb.endsWith('id') && na.replace('id', '') === nb.replace('id', '')) return 0.9;
  if (na.includes(nb) || nb.includes(na)) return 0.7;
  const shared = [...na].filter(c => nb.includes(c)).length;
  return shared / Math.max(na.length, nb.length, 1) * 0.5;
}

export default function ForeignKeyManagerPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { user } = useAuth();

  const [links, setLinks] = useState<ForeignLink[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [schemas, setSchemas] = useState<TableSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [connectMode, setConnectMode] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [sourceColumn, setSourceColumn] = useState<string | undefined>();
  const [targetColumn, setTargetColumn] = useState<string | undefined>();

  const [suggestions, setSuggestions] = useState<SuggestedLink[]>([]);
  const [suggestionsModalOpen, setSuggestionsModalOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [applyingSuggestion, setApplyingSuggestion] = useState<number | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fkRes, dsRes] = await Promise.all([
        api.get('/foreign-keys'),
        api.get('/datasets'),
      ]);
      setLinks(fkRes.data.data || []);
      const imported: Dataset[] = (dsRes.data.data || []).filter(
        (d: Dataset) => d.status === 'imported' && d.table_name,
      );
      setDatasets(imported);

      const schemaPromises = imported.map((d) =>
        api.get(`/datasets/${d.id}/schema`).then((r) => ({
          id: d.id,
          name: d.name,
          table_name: d.table_name!,
          columns: (r.data.data || r.data.columns || []).map((c: any) => ({
            originalHeader: c.column_name,
            columnName: c.column_name,
            columnType: (c.data_type || c.udt_name || 'text').toUpperCase().startsWith('INT')
              ? 'INTEGER' as const
              : (c.data_type || c.udt_name || 'text').toUpperCase().startsWith('NUM') || (c.data_type || c.udt_name || 'text').toUpperCase().startsWith('DEC') || (c.data_type || c.udt_name || 'text').toUpperCase().startsWith('FLOAT') || (c.data_type || c.udt_name || 'text').startsWith('FLOAT')
              ? 'NUMERIC' as const
              : (c.data_type || c.udt_name || 'text').toUpperCase().startsWith('BOOL')
              ? 'BOOLEAN' as const
              : (c.data_type || c.udt_name || 'text').toUpperCase().startsWith('DATE') || (c.data_type || c.udt_name || 'text').toUpperCase().startsWith('TIMEST')
              ? 'DATE' as const
              : 'TEXT' as const,
          })),
        })).catch(() => null),
      );
      const schemaResults = await Promise.all(schemaPromises);
      setSchemas(schemaResults.filter((s): s is TableSchema => s !== null));
    } catch {
      message.error(t('relations.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sourceSchema = useMemo(
    () => schemas.find((s) => s.table_name === selectedSource),
    [schemas, selectedSource],
  );
  const targetSchema = useMemo(
    () => schemas.find((s) => s.table_name === selectedTarget),
    [schemas, selectedTarget],
  );

  const handleCreate = useCallback(async () => {
    if (!selectedSource || !sourceColumn || !selectedTarget || !targetColumn) {
      message.warning('Please fill in all fields.');
      return;
    }
    if (selectedSource === selectedTarget && sourceColumn === targetColumn) {
      message.warning('Source and target cannot be the same column.');
      return;
    }
    setCreating(true);
    try {
      await api.post('/foreign-keys', {
        sourceTable: selectedSource,
        sourceColumn,
        targetTable: selectedTarget,
        targetColumn,
      });
      message.success(t('relations.createSuccess'));
      setColumnModalOpen(false);
      setSourceColumn(undefined);
      setTargetColumn(undefined);
      setSelectedSource(null);
      setSelectedTarget(null);
      setConnectMode(false);
      await fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create link.';
      message.error(msg);
    } finally {
      setCreating(false);
    }
  }, [selectedSource, sourceColumn, selectedTarget, targetColumn, fetchData]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await api.delete(`/foreign-keys/${id}`);
      message.success(t('relations.deleteSuccess'));
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch {
      message.error(t('relations.deleteFailed'));
    }
  }, []);

  const autoDetectSuggestions = useCallback(() => {
    if (schemas.length < 2) {
      message.warning('Need at least 2 imported tables to detect relations.');
      return;
    }
    setSuggestionsLoading(true);
    const found: SuggestedLink[] = [];

    for (let i = 0; i < schemas.length; i++) {
      for (let j = i + 1; j < schemas.length; j++) {
        const src = schemas[i];
        const tgt = schemas[j];

        for (const srcCol of src.columns) {
          for (const tgtCol of tgt.columns) {
            const sim = colNameSimilarity(srcCol.columnName, tgtCol.columnName);
            if (sim < 0.5) continue;

            const alreadyLinked = links.some(
              (l) =>
                (l.source_table === src.table_name && l.source_column === srcCol.columnName &&
                 l.target_table === tgt.table_name && l.target_column === tgtCol.columnName) ||
                (l.source_table === tgt.table_name && l.source_column === tgtCol.columnName &&
                 l.target_table === src.table_name && l.target_column === srcCol.columnName),
            );
            if (alreadyLinked) continue;

            const confidence: 'high' | 'medium' | 'low' =
              sim >= 0.9 ? 'high' : sim >= 0.7 ? 'medium' : 'low';

            let reason = '';
            if (srcCol.columnName.toLowerCase() === tgtCol.columnName.toLowerCase()) {
              reason = 'Exact column name match';
            } else if (srcCol.columnName.toLowerCase().replace(/[^a-z0-9]/g, '') === tgtCol.columnName.toLowerCase().replace(/[^a-z0-9]/g, '')) {
              reason = 'Column names match after normalizing';
            } else if (srcCol.columnName.toLowerCase().endsWith('id') && tgtCol.columnName.toLowerCase().endsWith('id')) {
              reason = 'Both columns appear to be ID references';
            } else if (srcCol.columnType === tgtCol.columnType && sim > 0.5) {
              reason = `Similar names + same type (${srcCol.columnType})`;
            } else {
              reason = 'Partially similar column names';
            }

            found.push({
              sourceTable: src.table_name,
              sourceColumn: srcCol.columnName,
              targetTable: tgt.table_name,
              targetColumn: tgtCol.columnName,
              confidence,
              reason,
            });
          }
        }
      }
    }

    found.sort((a, b) => {
      const ord = { high: 0, medium: 1, low: 2 };
      return ord[a.confidence] - ord[b.confidence];
    });

    setSuggestions(found);
    setSuggestionsLoading(false);
    setSuggestionsModalOpen(true);
  }, [schemas, links]);

  const handleAiSuggest = useCallback(async () => {
    if (schemas.length === 0) {
      message.warning('No imported tables to analyze.');
      return;
    }
    setAiLoading(true);
    try {
      const tableInfo = schemas.map((s) => ({
        table: s.table_name,
        columns: s.columns.map((c) => `${c.columnName} (${c.columnType})`),
      }));

      const res = await api.post('/foreign-keys/ai-suggest', { tables: tableInfo });

      const raw = res.data.suggestions || res.data.data || [];
      if (Array.isArray(raw) && raw.length > 0) {
        const aiSuggestions: SuggestedLink[] = raw.map((s: any) => ({
          sourceTable: s.sourceTable || s.source_table,
          sourceColumn: s.sourceColumn || s.source_column,
          targetTable: s.targetTable || s.target_table,
          targetColumn: s.targetColumn || s.target_column,
          confidence: (s.confidence || 'medium') as 'high' | 'medium' | 'low',
          reason: s.reason || 'AI suggested',
        }));
        setSuggestions(aiSuggestions);
        setSuggestionsModalOpen(true);
        message.success(`AI found ${aiSuggestions.length} potential relationships.`);
      } else {
        message.info('AI did not find any relationships. Try the auto-detect feature instead.');
      }
    } catch {
      message.error(t('relations.aiSuggestFailed'));
    } finally {
      setAiLoading(false);
    }
  }, [schemas]);

  const applySuggestion = useCallback(async (s: SuggestedLink, index: number) => {
    setApplyingSuggestion(index);
    try {
      await api.post('/foreign-keys', {
        sourceTable: s.sourceTable,
        sourceColumn: s.sourceColumn,
        targetTable: s.targetTable,
        targetColumn: s.targetColumn,
      });
      message.success(`Linked ${s.sourceTable}.${s.sourceColumn} → ${s.targetTable}.${s.targetColumn}`);
      setSuggestions((prev) => prev.filter((_, i) => i !== index));
      await fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to create link.');
    } finally {
      setApplyingSuggestion(null);
    }
  }, [fetchData]);

  const applyAllSuggestions = useCallback(async () => {
    let created = 0;
    for (const s of suggestions) {
      try {
        await api.post('/foreign-keys', {
          sourceTable: s.sourceTable,
          sourceColumn: s.sourceColumn,
          targetTable: s.targetTable,
          targetColumn: s.targetColumn,
        });
        created++;
      } catch { /* skip duplicates */ }
    }
    message.success(`Created ${created} foreign key link${created !== 1 ? 's' : ''}.`);
    setSuggestionsModalOpen(false);
    setSuggestions([]);
    await fetchData();
  }, [suggestions, fetchData]);

  const handleTableClick = useCallback((tableName: string) => {
    if (!connectMode) return;
    if (!selectedSource) {
      setSelectedSource(tableName);
    } else if (!selectedTarget && tableName !== selectedSource) {
      setSelectedTarget(tableName);
      setColumnModalOpen(true);
    } else if (tableName === selectedSource) {
      setSelectedSource(null);
      setSelectedTarget(null);
    } else {
      setSelectedTarget(tableName);
      setColumnModalOpen(true);
    }
  }, [connectMode, selectedSource, selectedTarget]);

  const linkedTableNames = useMemo(() => {
    const names = new Set<string>();
    links.forEach((l) => {
      names.add(l.source_table);
      names.add(l.target_table);
    });
    return names;
  }, [links]);

  const stats = useMemo(() => {
    const totalLinks = links.length;
    const tablesLinked = linkedTableNames.size;
    const orphanTables = schemas.filter((s) => !linkedTableNames.has(s.table_name)).length;
    return { totalLinks, tablesLinked, orphanTables };
  }, [links, schemas, linkedTableNames]);

  const fkColumns: ColumnsType<ForeignLink> = [
    {
      title: 'Source',
      key: 'source',
      ellipsis: true,
      render: (_: unknown, r: ForeignLink) => (
        <Space size={4}>
          <Text code style={{ fontSize: 12 }}>{r.source_table}</Text>
          <ArrowRightOutlined style={{ fontSize: 10, color: token.colorTextQuaternary }} />
          <Text style={{ fontSize: 12 }}>{r.source_column}</Text>
        </Space>
      ),
    },
    {
      title: 'Target',
      key: 'target',
      ellipsis: true,
      render: (_: unknown, r: ForeignLink) => (
        <Space size={4}>
          <Text code style={{ fontSize: 12 }}>{r.target_table}</Text>
          <ArrowRightOutlined style={{ fontSize: 10, color: token.colorTextQuaternary }} />
          <Text style={{ fontSize: 12 }}>{r.target_column}</Text>
        </Space>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      responsive: ['md' as const],
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      align: 'right' as const,
      render: (_: unknown, record: ForeignLink) => (
        <Popconfirm
          title={t('relations.deleteConfirm')}
          onConfirm={() => handleDelete(record.id)}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="Delete">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

  const erTablePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number; color: string }> = {};
    const allTables = schemas.map((s) => s.table_name);
    const cols = Math.max(1, Math.min(3, allTables.length));
    const colWidth = 260;
    const rowHeight = 220;
    const padding = 40;
    allTables.forEach((name, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions[name] = {
        x: padding + col * colWidth,
        y: padding + row * rowHeight,
        color: ER_COLORS[i % ER_COLORS.length],
      };
    });
    return positions;
  }, [schemas]);

  const erWidth = useMemo(() => {
    const cols = Math.max(1, Math.min(3, schemas.length));
    return Math.max(600, cols * 260 + 80);
  }, [schemas]);

  const erHeight = useMemo(() => {
    const cols = Math.max(1, Math.min(3, schemas.length));
    const rows = Math.ceil(schemas.length / cols);
    return Math.max(300, rows * 220 + 80);
  }, [schemas]);

  const renderErDiagram = () => {
    if (schemas.length === 0) {
      return (
        <Empty
          description="No imported tables to visualize"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    const boxW = 220;
    const boxHeaderH = 36;
    const lineH = 20;
    const maxColsShown = 8;

    return (
      <div style={{ overflow: 'auto', padding: 8 }}>
        <svg
          ref={svgRef}
          width={erWidth}
          height={erHeight}
          style={{ minWidth: erWidth, display: 'block' }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={token.colorPrimary} />
            </marker>
            <filter id="tableShadow" x="-4%" y="-4%" width="108%" height="112%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
            </filter>
            <filter id="selectedGlow" x="-8%" y="-8%" width="116%" height="116%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={token.colorPrimary} floodOpacity="0.4" />
            </filter>
          </defs>

          {schemas.map((schema) => {
            const pos = erTablePositions[schema.table_name];
            if (!pos) return null;
            const colsShown = schema.columns.slice(0, maxColsShown);
            const boxH = boxHeaderH + colsShown.length * lineH + (schema.columns.length > maxColsShown ? lineH : 0);
            const isLinked = linkedTableNames.has(schema.table_name);
            const isSelected = selectedSource === schema.table_name || selectedTarget === schema.table_name;
            const isSourceSelected = selectedSource === schema.table_name;

            return (
              <g
                key={schema.table_name}
                style={{ cursor: connectMode ? 'pointer' : 'default' }}
                onClick={() => handleTableClick(schema.table_name)}
              >
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={boxW}
                  height={boxH}
                  rx={8}
                  fill={token.colorBgElevated}
                  stroke={isSelected ? token.colorPrimary : isLinked ? pos.color : token.colorBorder}
                  strokeWidth={isSelected ? 2.5 : isLinked ? 2 : 1}
                  filter={isSelected ? 'url(#selectedGlow)' : 'url(#tableShadow)'}
                />
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={boxW}
                  height={boxHeaderH}
                  rx={8}
                  fill={pos.color + '18'}
                />
                <rect
                  x={pos.x}
                  y={pos.y + boxHeaderH - 6}
                  width={boxW}
                  height={6}
                  fill={pos.color + '18'}
                />
                {isSourceSelected && (
                  <circle
                    cx={pos.x + boxW - 12}
                    cy={pos.y + 12}
                    r={5}
                    fill={token.colorPrimary}
                  />
                )}
                <text
                  x={pos.x + 12}
                  y={pos.y + 24}
                  style={{ fontSize: 13, fontWeight: 700, fill: pos.color }}
                >
                  {schema.table_name}
                </text>
                <text
                  x={pos.x + boxW - 12}
                  y={pos.y + 24}
                  textAnchor="end"
                  style={{ fontSize: 10, fill: token.colorTextQuaternary }}
                >
                  {schema.columns.length} cols
                </text>
                {colsShown.map((col, ci) => {
                  const isLinkedCol = links.some(
                    (l) =>
                      (l.source_table === schema.table_name && l.source_column === col.columnName) ||
                      (l.target_table === schema.table_name && l.target_column === col.columnName),
                  );
                  return (
                    <g key={col.columnName}>
                      <text
                        x={pos.x + 14}
                        y={pos.y + boxHeaderH + 14 + ci * lineH}
                        style={{ fontSize: 11, fill: isLinkedCol ? token.colorPrimary : token.colorTextSecondary }}
                      >
                        {col.columnName}
                      </text>
                      <text
                        x={pos.x + boxW - 14}
                        y={pos.y + boxHeaderH + 14 + ci * lineH}
                        textAnchor="end"
                        style={{ fontSize: 10, fill: token.colorTextQuaternary }}
                      >
                        {col.columnType}
                      </text>
                      {isLinkedCol && (
                        <circle
                          cx={pos.x + 7}
                          cy={pos.y + boxHeaderH + 10 + ci * lineH}
                          r={3}
                          fill={token.colorPrimary}
                        />
                      )}
                    </g>
                  );
                })}
                {schema.columns.length > maxColsShown && (
                  <text
                    x={pos.x + 14}
                    y={pos.y + boxHeaderH + 14 + colsShown.length * lineH}
                    style={{ fontSize: 11, fill: token.colorTextQuaternary, fontStyle: 'italic' }}
                  >
                    +{schema.columns.length - maxColsShown} more
                  </text>
                )}
                {!isLinked && !isSelected && (
                  <g>
                    <line
                      x1={pos.x + boxW - 8}
                      y1={pos.y + 8}
                      x2={pos.x + boxW - 8}
                      y2={pos.y + boxH - 8}
                      stroke={token.colorWarning}
                      strokeWidth={2}
                      strokeDasharray="4 3"
                    />
                  </g>
                )}
              </g>
            );
          })}

          {links.map((link) => {
            const srcPos = erTablePositions[link.source_table];
            const tgtPos = erTablePositions[link.target_table];
            if (!srcPos || !tgtPos) return null;

            const srcCols = schemas.find((s) => s.table_name === link.source_table)?.columns || [];
            const srcColIdx = srcCols.findIndex((c) => c.columnName === link.source_column);
            const srcY = srcPos.y + boxHeaderH + 14 + Math.max(0, Math.min(srcColIdx, maxColsShown - 1)) * lineH;

            const tgtCols = schemas.find((s) => s.table_name === link.target_table)?.columns || [];
            const tgtColIdx = tgtCols.findIndex((c) => c.columnName === link.target_column);
            const tgtY = tgtPos.y + boxHeaderH + 14 + Math.max(0, Math.min(tgtColIdx, maxColsShown - 1)) * lineH;

            let x1: number, y1: number, x2: number, y2: number;
            if (srcPos.x + boxW < tgtPos.x) {
              x1 = srcPos.x + boxW;
              y1 = srcY;
              x2 = tgtPos.x;
              y2 = tgtY;
            } else if (tgtPos.x + boxW < srcPos.x) {
              x1 = srcPos.x;
              y1 = srcY;
              x2 = tgtPos.x + boxW;
              y2 = tgtY;
            } else {
              x1 = srcPos.x + boxW / 2;
              y1 = srcPos.y + boxHeaderH + srcCols.length * lineH + 4;
              x2 = tgtPos.x + boxW / 2;
              y2 = tgtPos.y + boxHeaderH + tgtCols.length * lineH + 4;
            }

            const midX = (x1 + x2) / 2;

            return (
              <g key={link.id}>
                <path
                  d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={token.colorPrimary}
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  markerEnd="url(#arrowhead)"
                  opacity={0.7}
                />
                <title>
                  {link.source_table}.{link.source_column} → {link.target_table}.{link.target_column}
                </title>
              </g>
            );
          })}

          {connectMode && selectedSource && !selectedTarget && (() => {
            const srcPos = erTablePositions[selectedSource];
            if (!srcPos) return null;
            return (
              <text
                x={srcPos.x}
                y={srcPos.y - 12}
                style={{ fontSize: 11, fill: token.colorPrimary, fontWeight: 600 }}
              >
                ↑ Click another table to connect
              </text>
            );
          })()}
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <Spin size="large" />
      </div>
    );
  }

  const bestAutoColumns = sourceSchema && targetSchema ? (() => {
    const matches: { src: string; tgt: string; sim: number }[] = [];
    for (const sc of sourceSchema.columns) {
      for (const tc of targetSchema.columns) {
        const sim = colNameSimilarity(sc.columnName, tc.columnName);
        if (sim >= 0.5) {
          matches.push({ src: sc.columnName, tgt: tc.columnName, sim });
        }
      }
    }
    matches.sort((a, b) => b.sim - a.sim);
    return matches;
  })() : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12}>
          <Space size="middle">
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorInfo})`,
            }}>
              <ApartmentOutlined style={{ color: '#fff', fontSize: 22 }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0 }}>{t('relations.title')}</Title>
              <Text type="secondary">{t('relations.subtitle')}</Text>
            </div>
          </Space>
        </Col>
        <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
          <Space wrap>
            <Button
              type={connectMode ? 'primary' : 'default'}
              icon={<LinkOutlined />}
              onClick={() => {
                setConnectMode(!connectMode);
                setSelectedSource(null);
                setSelectedTarget(null);
              }}
            >
              {connectMode ? 'Cancel' : t('relations.connectMode')}
            </Button>
            <Button
              icon={<SwapOutlined />}
              onClick={autoDetectSuggestions}
              disabled={schemas.length < 2}
>
        {t('relations.autoDetect')}
      </Button>
            <Button
              icon={<RobotOutlined />}
              onClick={handleAiSuggest}
              loading={aiLoading}
              disabled={schemas.length < 2}
>
        {t('relations.aiSuggest')}
      </Button>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined spin={loading} />} onClick={fetchData} />
            </Tooltip>
          </Space>
        </Col>
      </Row>

      {connectMode && (
        <Alert
          type="info"
          showIcon
          icon={<LinkOutlined />}
          message={
            selectedSource
              ? <span>Source: <Text code strong>{selectedSource}</Text> — now click a target table on the diagram</span>
              : 'Click a table on the ER diagram to select it as the source, then click another table to connect them.'
          }
          style={{ borderRadius: token.borderRadius }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card style={{ height: '100%', borderColor: token.colorPrimary, background: token.colorPrimaryBg }}
            styles={{ body: { padding: '16px 20px' } }}>
            <Space align="center" size={12}>
              <LinkOutlined style={{ fontSize: 22, color: token.colorPrimary }} />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Total Links</Text>
                <div style={{ fontSize: 28, fontWeight: 700, color: token.colorPrimary, lineHeight: 1.1 }}>
                  {stats.totalLinks}
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ height: '100%', borderColor: token.colorSuccess, background: token.colorSuccessBg }}
            styles={{ body: { padding: '16px 20px' } }}>
            <Space align="center" size={12}>
              <CheckCircleOutlined style={{ fontSize: 22, color: token.colorSuccess }} />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Tables Linked</Text>
                <div style={{ fontSize: 28, fontWeight: 700, color: token.colorSuccess, lineHeight: 1.1 }}>
                  {stats.tablesLinked}
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ height: '100%', borderColor: stats.orphanTables > 0 ? token.colorWarning : token.colorBorder, background: stats.orphanTables > 0 ? token.colorWarningBg : token.colorBgContainer }}
            styles={{ body: { padding: '16px 20px' } }}>
            <Space align="center" size={12}>
              <WarningOutlined style={{ fontSize: 22, color: stats.orphanTables > 0 ? token.colorWarning : token.colorTextQuaternary }} />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Orphan Tables</Text>
                <div style={{ fontSize: 28, fontWeight: 700, color: stats.orphanTables > 0 ? token.colorWarning : token.colorTextQuaternary, lineHeight: 1.1 }}>
                  {stats.orphanTables}
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <ApartmentOutlined style={{ color: token.colorPrimary }} />
            <Text strong>ER Diagram</Text>
            <Tag>{schemas.length} tables</Tag>
            {connectMode && <Tag color="processing">{t('relations.connectMode')}</Tag>}
          </Space>
        }
        extra={
          schemas.length > 0 && links.length > 0 && (
            <Tag color="blue" icon={<LinkOutlined />}>{links.length} link{links.length !== 1 ? 's' : ''}</Tag>
          )
        }
      >
        {renderErDiagram()}
      </Card>

      <Card
        title={
          <Space>
            <DatabaseOutlined style={{ color: token.colorPrimary }} />
            <Text strong>FK Links</Text>
            <Tag>{links.length}</Tag>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setConnectMode(true);
              setSelectedSource(null);
              setSelectedTarget(null);
            }}
            size="small"
>
          {t('relations.newLink')}
        </Button>
        }
      >
        {links.length === 0 ? (
          <Empty
            description={t('relations.noRelationsDesc')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            dataSource={links}
            columns={fkColumns}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} links` }}
            scroll={{ x: 500 }}
            size="middle"
          />
        )}
      </Card>

      <Modal
        title={
          <Space>
<LinkOutlined style={{ color: token.colorPrimary }} />
        <span>{t('relations.linkModalTitle')}</span>
          </Space>
        }
        open={columnModalOpen}
        onCancel={() => {
          setColumnModalOpen(false);
          setSourceColumn(undefined);
          setTargetColumn(undefined);
          setSelectedTarget(null);
        }}
        onOk={handleCreate}
        confirmLoading={creating}
        okText="Create"
        okButtonProps={{ disabled: !sourceColumn || !targetColumn }}
        width={640}
      >
        <div style={{ marginBottom: 20 }}>
          <Space size={8} style={{ display: 'flex', alignItems: 'center' }}>
            <Tag color="blue" style={{ margin: 0 }}>{selectedSource}</Tag>
            <ArrowRightOutlined />
            <Tag color="purple" style={{ margin: 0 }}>{selectedTarget}</Tag>
          </Space>
        </div>

        {bestAutoColumns.length > 0 && (
          <Alert
            type="info"
            showIcon
            icon={<BulbOutlined />}
            message="Auto-matched columns detected"
            description={
              <div style={{ marginTop: 8 }}>
                {bestAutoColumns.slice(0, 5).map((m, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>
                    <Tag color="blue" style={{ margin: 0 }}>{m.src}</Tag>
                    <ArrowRightOutlined style={{ fontSize: 10, margin: '0 4px' }} />
                    <Tag color="purple" style={{ margin: 0 }}>{m.tgt}</Tag>
                    <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                      {Math.round(m.sim * 100)}% match
                    </Text>
                  </div>
                ))}
              </div>
            }
            style={{ marginBottom: 16, borderRadius: token.borderRadius }}
          />
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>
              {t('relations.sourceColumn')} <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>{selectedSource}</Tag>
            </Text>
            <Select
              value={sourceColumn}
              onChange={setSourceColumn}
              style={{ width: '100%' }}
              placeholder="Select source column..."
              showSearch
              optionFilterProp="label"
              options={(sourceSchema?.columns || []).map((c) => ({
                value: c.columnName,
                label: `${c.columnName} (${c.columnType})`,
              }))}
            />
          </Col>
          <Col span={12}>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>
              {t('relations.targetColumn')} <Tag color="purple" style={{ margin: 0, fontSize: 10 }}>{selectedTarget}</Tag>
            </Text>
            <Select
              value={targetColumn}
              onChange={setTargetColumn}
              style={{ width: '100%' }}
              placeholder="Select target column..."
              showSearch
              optionFilterProp="label"
              options={(targetSchema?.columns || []).map((c) => ({
                value: c.columnName,
                label: `${c.columnName} (${c.columnType})`,
              }))}
            />
          </Col>
        </Row>

        {sourceColumn && targetColumn && (() => {
          const srcCol = sourceSchema?.columns.find((c) => c.columnName === sourceColumn);
          const tgtCol = targetSchema?.columns.find((c) => c.columnName === targetColumn);
          if (!srcCol || !tgtCol) return null;
          const srcIsText = srcCol.columnType === 'TEXT';
          const tgtIsText = tgtCol.columnType === 'TEXT';
          const srcIsNum = ['INTEGER', 'NUMERIC'].includes(srcCol.columnType);
          const tgtIsNum = ['INTEGER', 'NUMERIC'].includes(tgtCol.columnType);
          if (srcIsNum && tgtIsText) {
            return (
              <Alert
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                message={t('relations.typeMismatch')}
                description={`Source column "${sourceColumn}" is ${srcCol.columnType} but target "${targetColumn}" is ${tgtCol.columnType}. This link may be rejected by the server.`}
                style={{ marginTop: 16, borderRadius: token.borderRadius }}
              />
            );
          }
          if (srcIsText && tgtIsNum) {
            return (
              <Alert
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                message={t('relations.typeMismatch')}
                description={`Source column "${sourceColumn}" is ${srcCol.columnType} but target "${targetColumn}" is ${tgtCol.columnType}. This link may be rejected by the server.`}
                style={{ marginTop: 16, borderRadius: token.borderRadius }}
              />
            );
          }
          if (srcCol.columnType !== tgtCol.columnType && !(srcIsNum && tgtIsNum)) {
            return (
              <Alert
                type="info"
                showIcon
                message={t('relations.differentTypes')}
                description={`Source is ${srcCol.columnType}, target is ${tgtCol.columnType}. The link will still be created but may not work as expected.`}
                style={{ marginTop: 16, borderRadius: token.borderRadius }}
              />
            );
          }
          return null;
        })()}

        {bestAutoColumns.length > 0 && !sourceColumn && !targetColumn && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              Quick link — click to auto-fill:
            </Text>
            <Space wrap>
              {bestAutoColumns.slice(0, 3).map((m, i) => (
                <Button
                  key={i}
                  size="small"
                  type="dashed"
                  onClick={() => {
                    setSourceColumn(m.src);
                    setTargetColumn(m.tgt);
                  }}
                >
                  {m.src} ↔ {m.tgt}
                </Button>
              ))}
            </Space>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <Space>
<BulbOutlined style={{ color: token.colorWarning }} />
        <span>{t('relations.suggestionsTitle')}</span>
            <Tag>{suggestions.length}</Tag>
          </Space>
        }
        open={suggestionsModalOpen}
        onCancel={() => { setSuggestionsModalOpen(false); setSuggestions([]); }}
      footer={[
        <Button key="close" onClick={() => { setSuggestionsModalOpen(false); setSuggestions([]); }}>
          Dismiss
        </Button>,
        suggestions.length > 0 && (
          <Popconfirm
            key="all"
title={t('relations.applyAllConfirm')}
          description={t('relations.applyAllDesc')}
            onConfirm={applyAllSuggestions}
            okText={t('relations.applyAll')}
            cancelText="Cancel"
          >
<Button type="primary" icon={<CheckCircleOutlined />}>
          {t('relations.applyAll')} ({suggestions.length})
            </Button>
          </Popconfirm>
        ),
      ]}
        width={720}
      >
        {suggestionsLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}><Text type="secondary">{t('relations.aiLoading')}</Text></div>
          </div>
        ) : suggestions.length === 0 ? (
          <Empty description={t('relations.aiNoSuggestions')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {suggestions.map((s, i) => {
              const confColor = s.confidence === 'high' ? token.colorSuccess : s.confidence === 'medium' ? token.colorWarning : token.colorTextQuaternary;
              const existingLink = links.some(
                (l) =>
                  (l.source_table === s.sourceTable && l.source_column === s.sourceColumn &&
                   l.target_table === s.targetTable && l.target_column === s.targetColumn) ||
                  (l.source_table === s.targetTable && l.source_column === s.targetColumn &&
                   l.target_table === s.sourceTable && l.target_column === s.sourceColumn),
              );
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: token.borderRadius,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    background: existingLink ? token.colorBgLayout : token.colorBgContainer,
                    opacity: existingLink ? 0.5 : 1,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{s.sourceTable}</Tag>
                      <Text code style={{ fontSize: 12 }}>{s.sourceColumn}</Text>
                      <ArrowRightOutlined style={{ fontSize: 10 }} />
                      <Tag color="purple" style={{ margin: 0, fontSize: 11 }}>{s.targetTable}</Tag>
                      <Text code style={{ fontSize: 12 }}>{s.targetColumn}</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag
                        color={s.confidence === 'high' ? 'green' : s.confidence === 'medium' ? 'orange' : 'default'}
                        style={{ margin: 0, fontSize: 10, borderRadius: 10 }}
                      >
                        {s.confidence === 'high' ? t('relations.high') : s.confidence === 'medium' ? t('relations.medium') : t('relations.low')}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>{s.reason}</Text>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    icon={<LinkOutlined />}
                    loading={applyingSuggestion === i}
                    disabled={existingLink}
                    onClick={() => applySuggestion(s, i)}
                  >
                    {existingLink ? 'Linked' : 'Link'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
