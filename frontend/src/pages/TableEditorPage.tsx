import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Table, Input, Button, Space, Typography, Spin,
  Alert, Modal, Form, Select, Tag, Breadcrumb, Row, Col,
  Tabs, Popconfirm, message, theme, Grid, Tooltip, Empty,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  SearchOutlined, ReloadOutlined, PlusOutlined,
  DeleteOutlined, SaveOutlined, CloseOutlined, SettingOutlined,
  AlertOutlined, DatabaseOutlined, DownloadOutlined,
  LinkOutlined, ProfileOutlined, HomeOutlined,
  FileTextOutlined, UnorderedListOutlined,
} from '@ant-design/icons';
import api from '../lib/api';
import type { Dataset, TableColumn, TablePagination, DataProfile, ForeignLink } from '../lib/types';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

function CellInput({ initial, onSave, onCancel }: { initial: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState(initial);
  const ref = useRef<Input>(null);
  useEffect(() => {
    const inputEl = ref.current?.input;
    inputEl?.focus();
    inputEl?.select();
  }, []);
  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSave(val); if (e.key === 'Escape') onCancel(); }}
        size="small"
        style={{ minWidth: 60 }}
      />
      <Button size="small" type="primary" icon={<SaveOutlined />} onClick={() => onSave(val)} />
      <Button size="small" danger icon={<CloseOutlined />} onClick={onCancel} />
    </Space.Compact>
  );
}

function SchemaEditor({
  columns, datasetId, onClose, onChanged,
}: { columns: TableColumn[]; datasetId: string; onClose: () => void; onChanged: () => void }) {
  const { token } = theme.useToken();
  const [editing, setEditing] = useState<Record<string, { name: string; type: string }>>(
    () => Object.fromEntries(columns.map((c) => [c.column_name, { name: c.column_name, type: c.data_type.toUpperCase() }]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const TYPES = ['TEXT', 'INTEGER', 'NUMERIC', 'DATE', 'BOOLEAN'];

  async function applyColumn(col: TableColumn) {
    const target = editing[col.column_name];
    setSaving(col.column_name);
    setErrors((e) => ({ ...e, [col.column_name]: '' }));
    try {
      const nameChanged = target.name !== col.column_name;
      const typeChanged = target.type !== col.data_type.toUpperCase() && target.type !== col.udt_name.toUpperCase();
      if (nameChanged) await api.patch(`/datasets/${datasetId}/columns/${col.column_name}/rename`, { newName: target.name });
      const resolvedName = nameChanged ? target.name : col.column_name;
      if (typeChanged) await api.patch(`/datasets/${datasetId}/columns/${resolvedName}/type`, { newType: target.type });
      if (!nameChanged && !typeChanged) { setSaving(null); return; }
      message.success(`Column "${col.column_name}" updated.`);
      onChanged();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error';
      setErrors((e) => ({ ...e, [col.column_name]: msg }));
      message.error(msg);
    } finally { setSaving(null); }
  }

  const schemaColumns = [
    {
      title: 'Original',
      key: 'original',
      render: (_: unknown, col: TableColumn) => (
        <Space>
          <Text code style={{ fontSize: 12 }}>{col.column_name}</Text>
          <Tag color="blue" style={{ fontSize: 11 }}>{col.data_type}</Tag>
        </Space>
      ),
    },
    {
      title: 'New Name',
      key: 'name',
      render: (_: unknown, col: TableColumn) => (
        <Input
          size="small"
          style={{ fontFamily: 'monospace' }}
          value={editing[col.column_name].name}
          onChange={(e) => setEditing((p) => ({ ...p, [col.column_name]: { ...p[col.column_name], name: e.target.value } }))}
        />
      ),
    },
    {
      title: 'New Type',
      key: 'type',
      render: (_: unknown, col: TableColumn) => (
        <Select
          size="small"
          style={{ width: 120 }}
          value={editing[col.column_name].type}
          onChange={(v) => setEditing((p) => ({ ...p, [col.column_name]: { ...p[col.column_name], type: v } }))}
          options={TYPES.map((t) => ({ value: t, label: t }))}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 100,
      render: (_: unknown, col: TableColumn) => (
        <Space direction="vertical" size={4}>
          <Button size="small" type="primary" icon={<SaveOutlined />} loading={saving === col.column_name} onClick={() => applyColumn(col)}>Apply</Button>
          {errors[col.column_name] && <Text type="danger" style={{ fontSize: 11 }}>{errors[col.column_name]}</Text>}
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={<Space><SettingOutlined style={{ color: token.colorPrimary }} /> Schema Editor</Space>}
      open={true}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
      width={640}
    >
      <Table
        dataSource={columns.filter((c) => c.column_name !== 'id')}
        columns={schemaColumns}
        rowKey="column_name"
        pagination={false}
        size="small"
      />
    </Modal>
  );
}

function AddRowModal({
  columns, datasetId, onClose, onAdded,
}: { columns: TableColumn[]; datasetId: string; onClose: () => void; onAdded: () => void }) {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editableCols = columns.filter((c) => c.column_name !== 'id');

  async function submit() {
    const values = form.getFieldsValue();
    setSaving(true);
    setError(null);
    try {
      await api.post(`/datasets/${datasetId}/rows`, values);
      message.success('Row added successfully.');
      onAdded();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to add row.';
      setError(msg);
      message.error(msg);
    } finally { setSaving(false); }
  }

  return (
    <Modal
      title={<Space><PlusOutlined style={{ color: token.colorPrimary }} /> Add New Row</Space>}
      open={true}
      onCancel={onClose}
      onOk={submit}
      okText="Add Row"
      okButtonProps={{ loading: saving }}
    >
      <Form form={form} layout="vertical" size="small">
        {editableCols.map((col) => (
          <Form.Item key={col.column_name} label={<span>{col.column_name} <Text type="secondary">({col.data_type})</Text></span>} name={col.column_name}>
            <Input placeholder={`Enter ${col.column_name}…`} />
          </Form.Item>
        ))}
      </Form>
      {error && <Alert type="error" message={error} showIcon style={{ marginTop: 8 }} />}
    </Modal>
  );
}

function ProfileTab({ datasetId }: { datasetId: string }) {
  const [profile, setProfile] = useState<DataProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get<{ success: boolean; data: DataProfile[] }>(`/datasets/${datasetId}/profile`);
        if (!cancelled && res.data.success) setProfile(res.data.data);
      } catch {
        if (!cancelled) setError('Failed to load profile data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [datasetId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spin size="large" /></div>;
  if (error) return <Alert type="error" message={error} showIcon />;
  if (profile.length === 0) return <Empty description="No profile data available." />;

  const columns: ColumnsType<DataProfile> = [
    { title: 'Column', dataIndex: 'column_name', key: 'column_name', sorter: (a, b) => a.column_name.localeCompare(b.column_name) },
    { title: 'Type', dataIndex: 'data_type', key: 'data_type', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Nulls', dataIndex: 'null_count', key: 'null_count', sorter: (a, b) => a.null_count - b.null_count, render: (v: number) => v > 0 ? <Tag color="warning">{v}</Tag> : <Tag color="success">0</Tag> },
    { title: 'Unique', dataIndex: 'unique_count', key: 'unique_count', sorter: (a, b) => a.unique_count - b.unique_count },
    { title: 'Min', dataIndex: 'min_value', key: 'min_value', render: (v: string | number | undefined) => v !== undefined ? String(v) : '—' },
    { title: 'Max', dataIndex: 'max_value', key: 'max_value', render: (v: string | number | undefined) => v !== undefined ? String(v) : '—' },
    { title: 'Avg', dataIndex: 'avg_value', key: 'avg_value', render: (v: number | undefined) => v !== undefined ? v.toFixed(2) : '—' },
    { title: 'Sample Values', dataIndex: 'sample_values', key: 'sample_values', render: (v: string[]) => v?.length ? <Space size={4} wrap>{v.slice(0, 3).map((s) => <Tag key={s}>{s}</Tag>)}</Space> : '—' },
  ];

  return <Table dataSource={profile} columns={columns} rowKey="column_name" pagination={false} size="small" scroll={{ x: 800 }} />;
}

function RelationsTab({ tableName }: { tableName: string; datasetId: string }) {
  const { token } = theme.useToken();
  const [foreignKeys, setForeignKeys] = useState<ForeignLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const loadFKs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: ForeignLink[] }>('/foreign-keys');
      if (res.data.success) {
        const filtered = res.data.data.filter(
          (fk) => fk.source_table === tableName || fk.target_table === tableName
        );
        setForeignKeys(filtered);
      }
    } catch {
      message.error('Failed to load foreign keys.');
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  useEffect(() => { loadFKs(); }, [loadFKs]);

  async function createFK() {
    try {
      const values = await form.validateFields();
      setCreating(true);
      await api.post('/foreign-keys', {
        sourceTable: values.sourceTable,
        sourceColumn: values.sourceColumn,
        targetTable: values.targetTable,
        targetColumn: values.targetColumn,
      });
      message.success('Foreign key created.');
      setShowCreate(false);
      form.resetFields();
      loadFKs();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg) message.error(msg);
    } finally { setCreating(false); }
  }

  const fkColumns: ColumnsType<ForeignLink> = [
    { title: 'Direction', key: 'direction', render: (_: unknown, fk: ForeignLink) => fk.source_table === tableName ? <Tag color="blue">Outgoing</Tag> : <Tag color="green">Incoming</Tag> },
    { title: 'Source', key: 'source', render: (_: unknown, fk: ForeignLink) => <Text code>{fk.source_table}.{fk.source_column}</Text> },
    { title: 'Target', key: 'target', render: (_: unknown, fk: ForeignLink) => <Text code>{fk.target_table}.{fk.target_column}</Text> },
    { title: 'Created', dataIndex: 'created_at', key: 'created_at', render: (v: string) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text type="secondary">Foreign key relationships for <Text code>{tableName}</Text></Text>
        <Button type="primary" size="small" icon={<LinkOutlined />} onClick={() => setShowCreate(true)}>New Relation</Button>
      </div>

      {loading ? <Spin /> : foreignKeys.length === 0 ? (
        <Empty description="No foreign key relations defined." image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button type="primary" onClick={() => setShowCreate(true)}>Create Relation</Button>
        </Empty>
      ) : (
        <Table dataSource={foreignKeys} columns={fkColumns} rowKey="id" pagination={false} size="small" />
      )}

      <Modal
        title={<Space><LinkOutlined style={{ color: token.colorPrimary }} /> Create Foreign Key</Space>}
        open={showCreate}
        onCancel={() => { setShowCreate(false); form.resetFields(); }}
        onOk={createFK}
        okText="Create"
        okButtonProps={{ loading: creating }}
      >
        <Form form={form} layout="vertical" size="small" initialValues={{ sourceTable: tableName }}>
          <Form.Item label="Source Table" name="sourceTable" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Source Column" name="sourceColumn" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Target Table" name="targetTable" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Target Column" name="targetColumn" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default function TableEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const screens = useBreakpoint();

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [pagination, setPagination] = useState<TablePagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortCol, setSortCol] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [editingCell, setEditingCell] = useState<{ rowId: number; col: string } | null>(null);
  const [savingCell, setSavingCell] = useState<{ rowId: number; col: string } | null>(null);

  const [showSchema, setShowSchema] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const [showDeleteRows, setShowDeleteRows] = useState(false);
  const [deletingRows, setDeletingRows] = useState(false);
  const [droppingTable, setDroppingTable] = useState(false);

  const isMobile = !screens.md;

  const fetchMeta = useCallback(async () => {
    if (!id) return;
    try {
      const [dsRes, schRes] = await Promise.all([
        api.get<{ success: boolean; data: Dataset }>(`/datasets/${id}`),
        api.get<{ success: boolean; data: TableColumn[] }>(`/datasets/${id}/schema`),
      ]);
      if (dsRes.data.success) setDataset(dsRes.data.data);
      if (schRes.data.success) setColumns(schRes.data.data);
    } catch {
      setError('Failed to load dataset info.');
      message.error('Failed to load dataset info.');
    }
  }, [id]);

  const fetchRows = useCallback(async (page = 1, pageSize?: number) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize ?? pagination.limit),
        sort: sortCol,
        order: sortOrder,
        ...(search ? { search } : {}),
      });
      const res = await api.get<{
        success: boolean;
        data: Record<string, unknown>[];
        pagination: TablePagination;
      }>(`/datasets/${id}/data?${params}`);
      if (res.data.success) {
        setRows(res.data.data);
        setPagination(res.data.pagination);
        setSelectedRowKeys([]);
      }
    } catch {
      setError('Failed to load table data.');
      message.error('Failed to load table data.');
    } finally { setLoading(false); }
  }, [id, search, sortCol, sortOrder, pagination.limit]);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);
  useEffect(() => { fetchRows(1); }, [search, sortCol, sortOrder]); // eslint-disable-line

  async function saveCell(rowId: number, col: string, value: string) {
    setSavingCell({ rowId, col });
    setEditingCell(null);
    try {
      const res = await api.patch<{ success: boolean; data: Record<string, unknown> }>(
        `/datasets/${id}/rows/${rowId}`,
        { column: col, value },
      );
      if (res.data.success) {
        setRows((prev) => prev.map((r) => (r.id === rowId ? res.data.data : r)));
        message.success('Cell updated.');
      }
    } catch {
      message.error('Failed to update cell.');
    } finally { setSavingCell(null); }
  }

  async function confirmDeleteRows() {
    setDeletingRows(true);
    try {
      await api.delete(`/datasets/${id}/rows`, { data: { ids: selectedRowKeys.map(Number) } });
      message.success(`${selectedRowKeys.length} row(s) deleted.`);
      setShowDeleteRows(false);
      setSelectedRowKeys([]);
      fetchRows(pagination.page);
      fetchMeta();
    } catch {
      message.error('Failed to delete rows.');
    } finally { setDeletingRows(false); }
  }

  async function confirmDropTable() {
    setDroppingTable(true);
    try {
      await api.delete(`/datasets/${id}`);
      message.success('Table dropped successfully.');
      navigate('/explore');
    } catch {
      message.error('Failed to drop table.');
      setDroppingTable(false);
    }
  }

  function handleExport(format: 'csv' | 'json') {
    const dataToExport = rows;
    if (format === 'csv') {
      if (columns.length === 0 || dataToExport.length === 0) return;
      const headers = columns.map((c) => c.column_name);
      const csvRows = dataToExport.map((row) =>
        headers.map((h) => {
          const val = String(row[h] ?? '');
          return val.includes(',') || val.includes('"') || val.includes('\n')
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        }).join(',')
      );
      const csv = [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${dataset?.name ?? 'data'}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } else {
      const json = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${dataset?.name ?? 'data'}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
    message.success(`Exported as ${format.toUpperCase()}.`);
  }

  const tableColumns: ColumnsType<Record<string, unknown>> = [
    ...columns.map((col) => ({
      title: col.column_name,
      key: col.column_name,
      dataIndex: col.column_name,
      width: 160,
      ellipsis: true,
      sorter: true,
      render: (val: unknown, record: Record<string, unknown>) => {
        const rid = record.id as number;
        const isId = col.column_name === 'id';
        const isEditing = !isId && editingCell?.rowId === rid && editingCell?.col === col.column_name;
        const isSaving = savingCell?.rowId === rid && savingCell?.col === col.column_name;
        const cellVal = String(val ?? '');

        if (isEditing) {
          return <CellInput initial={cellVal} onSave={(v) => saveCell(rid, col.column_name, v)} onCancel={() => setEditingCell(null)} />;
        }
        if (isSaving) {
          return <Spin size="small" />;
        }
        return (
          <Tooltip title={isId ? undefined : 'Double-click to edit'}>
            <span
              style={{ cursor: isId ? 'default' : 'pointer', display: 'block' }}
              onDoubleClick={() => { if (!isId) setEditingCell({ rowId: rid, col: col.column_name }); }}
            >
              {cellVal === '' ? <Text type="secondary">—</Text> : <Text type={isId ? 'secondary' : undefined}>{cellVal}</Text>}
            </span>
          </Tooltip>
        );
      },
    })),
  ];

  const handleTableChange: TableProps<Record<string, unknown>>['onChange'] = (_pagination, _filters, sorter) => {
    if (!Array.isArray(sorter) && sorter.field) {
      const newSortCol = String(sorter.field);
      const newSortOrder = sorter.order === 'descend' ? 'desc' : 'asc';
      setSortCol(newSortCol);
      setSortOrder(newSortOrder);
    } else if (!sorter.field) {
      setSortCol('id');
      setSortOrder('asc');
    }
  };

  const tabItems = [
    {
      key: 'data',
      label: <span><UnorderedListOutlined /> Data</span>,
      children: (
        <div>
          <Row gutter={[8, 8]} style={{ marginBottom: 12 }} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Search all columns…"
                prefix={<SearchOutlined />}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchInput); }}
                allowClear
                onClear={() => { setSearch(''); setSearchInput(''); }}
              />
            </Col>
            <Col xs={24} sm={12} md={16}>
              <Space wrap style={{ width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
                {search && <Button size="small" type="link" onClick={() => { setSearch(''); setSearchInput(''); }}>Clear search</Button>}
                <Tooltip title="Refresh data">
                  <Button icon={<ReloadOutlined spin={loading} />} size="small" onClick={() => fetchRows(pagination.page)} />
                </Tooltip>
                <Button icon={<DownloadOutlined />} size="small" onClick={() => handleExport('csv')}>CSV</Button>
                <Button icon={<FileTextOutlined />} size="small" onClick={() => handleExport('json')}>JSON</Button>
              </Space>
            </Col>
          </Row>

          {error ? (
            <Alert type="error" message={error} showIcon style={{ margin: 16 }} />
          ) : (
            <Table
              dataSource={rows.map((r, i) => ({ key: (r.id as number) ?? i, ...r }))}
              columns={tableColumns}
              size="small"
              scroll={{ x: columns.length * 160 }}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
              pagination={{
                current: pagination.page,
                pageSize: pagination.limit,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}–${range[1]} of ${total.toLocaleString()}`,
                pageSizeOptions: ['10', '25', '50', '100'],
              }}
              onChange={(pag, filters, sorter, extra) => {
                if (extra.action === 'paginate') {
                  fetchRows(pag.current, pag.pageSize);
                }
                handleTableChange(pag, filters, sorter);
              }}
              loading={loading}
            />
          )}
        </div>
      ),
    },
    {
      key: 'profile',
      label: <span><ProfileOutlined /> Profile</span>,
      children: id ? <ProfileTab datasetId={id} /> : null,
    },
    {
      key: 'relations',
      label: <span><LinkOutlined /> Relations</span>,
      children: dataset?.table_name && id ? <RelationsTab tableName={dataset.table_name} datasetId={id} /> : null,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        flexShrink: 0,
        borderBottom: `1px solid ${token.colorBorder}`,
        backgroundColor: token.colorBgContainer,
      }}>
        <Breadcrumb
          items={[
            { title: <><HomeOutlined /> <a onClick={() => navigate('/explore')}>DB Explorer</a></> },
            { title: <><DatabaseOutlined /> {dataset?.name ?? '…'}</> },
          ]}
        />
      </div>

      <div style={{
        padding: '8px 24px',
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: 12,
        flexWrap: 'wrap',
        flexShrink: 0,
        borderBottom: `1px solid ${token.colorBorder}`,
        flexDirection: isMobile ? 'column' : 'row',
      }}>
        <Space size="small" style={{ flex: 1, minWidth: 0 }}>
          <DatabaseOutlined style={{ color: token.colorPrimary }} />
          <div style={{ minWidth: 0 }}>
            <Title level={5} style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {dataset?.name ?? '…'}
            </Title>
            <Text type="secondary" code style={{ fontSize: 12 }}>
              {dataset?.table_name ?? ''}{pagination.total > 0 ? ` · ${pagination.total.toLocaleString()} rows` : ''}
            </Text>
          </div>
        </Space>

        <Space wrap>
          {selectedRowKeys.length > 0 && (
            <Button danger icon={<DeleteOutlined />} onClick={() => setShowDeleteRows(true)}>
              Delete {selectedRowKeys.length}
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => setShowAddRow(true)}>Add Row</Button>
          <Button icon={<SettingOutlined />} size="small" onClick={() => setShowSchema(true)}>Schema</Button>
          <Popconfirm title="Drop this table permanently?" onConfirm={confirmDropTable} okText="Drop" okButtonProps={{ danger: true }}>
            <Button danger icon={<DeleteOutlined />} size="small" loading={droppingTable}>Drop Table</Button>
          </Popconfirm>
        </Space>
      </div>

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: '0 24px' }}>
        <Tabs items={tabItems} defaultActiveKey="data" />
      </div>

      {showSchema && (
        <SchemaEditor
          columns={columns}
          datasetId={id!}
          onClose={() => setShowSchema(false)}
          onChanged={() => { fetchMeta(); fetchRows(1); }}
        />
      )}
      {showAddRow && (
        <AddRowModal
          columns={columns}
          datasetId={id!}
          onClose={() => setShowAddRow(false)}
          onAdded={() => { fetchRows(pagination.page); fetchMeta(); }}
        />
      )}
      <Modal
        title={<Space><AlertOutlined style={{ color: token.colorError }} /> Delete {selectedRowKeys.length} row{selectedRowKeys.length !== 1 ? 's' : ''}?</Space>}
        open={showDeleteRows}
        onCancel={() => setShowDeleteRows(false)}
        footer={
          <Space>
            <Button onClick={() => setShowDeleteRows(false)} disabled={deletingRows}>Cancel</Button>
            <Button type="primary" danger onClick={confirmDeleteRows} loading={deletingRows}>Delete</Button>
          </Space>
        }
      >
        <Text>This action cannot be undone.</Text>
      </Modal>
    </div>
  );
}
