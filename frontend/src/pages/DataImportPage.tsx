import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Table, Select, Input, Button, Card, Space, Typography, Tag, Spin,
  Empty, Popconfirm, theme, message, Row, Col, Modal, Steps, Divider,
  Tooltip, Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DatabaseOutlined, InboxOutlined, DeleteOutlined,
  EyeOutlined, ImportOutlined, TableOutlined, CloseOutlined,
  LinkOutlined, FileExcelOutlined, FileTextOutlined,
  CloudUploadOutlined, CheckCircleOutlined, ProfileOutlined,
  LoadingOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import api from '../lib/api';
import type { Dataset, ColumnMapping, ParsedPreview } from '../lib/types';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const COLUMN_TYPES = ['TEXT', 'INTEGER', 'NUMERIC', 'DATE', 'BOOLEAN'] as const;

const STATUS_MAP: Record<string, { color: string; label: string; icon?: React.ReactNode }> = {
  uploaded: { color: 'orange', label: 'Uploaded', icon: <CloudUploadOutlined /> },
  processing: { color: 'blue', label: 'Processing', icon: <LoadingOutlined spin /> },
  imported: { color: 'green', label: 'Imported', icon: <CheckCircleOutlined /> },
  error: { color: 'red', label: 'Error', icon: <InfoCircleOutlined /> },
};

export default function DataImportPage() {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activePreview, setActivePreview] = useState<ParsedPreview | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [tableName, setTableName] = useState('');
  const [importing, setImporting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [mappingStep, setMappingStep] = useState(0);
  const [viewData, setViewData] = useState<{ rows: Record<string, unknown>[]; dataset: Dataset } | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importingUrl, setImportingUrl] = useState(false);
  const [recentlyImported, setRecentlyImported] = useState<number | null>(null);

  const fetchDatasets = useCallback(async () => {
    try {
      const res = await api.get('/datasets');
      setDatasets(res.data.data);
    } catch {
      message.error('Failed to fetch datasets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDatasets(); }, [fetchDatasets]);

  async function handleUpload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      await api.post('/datasets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchDatasets();
      message.success('File uploaded successfully.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Upload failed.';
      message.error(msg);
    } finally {
      setUploading(false);
    }
  }

  async function openMappingWorkspace(ds: Dataset) {
    setPreviewLoading(true);
    setMappingModalOpen(true);
    setMappingStep(0);
    try {
      const res = await api.get(`/datasets/${ds.id}/preview`);
      const data: ParsedPreview = res.data.data;
      setActivePreview(data);
      setMappings(
        data.headers.map((h) => ({
          originalHeader: h,
          columnName: h.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_{2,}/g, '_').replace(/^_+|_+$/g, ''),
          columnType: 'TEXT' as const,
        })),
      );
      setTableName(
        ds.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_{2,}/g, '_').replace(/^_+|_+$/g, ''),
      );
    } catch {
      message.error('Failed to preview file.');
      setMappingModalOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  }

  function closeMappingWorkspace() {
    setMappingModalOpen(false);
    setActivePreview(null);
    setMappings([]);
    setTableName('');
    setMappingStep(0);
  }

  async function handleImport() {
    if (!activePreview || !tableName) return;
    setImporting(true);
    try {
      await api.post(`/datasets/${activePreview.dataset.id}/import`, { tableName, columns: mappings });
      setRecentlyImported(activePreview.dataset.id);
      closeMappingWorkspace();
      await fetchDatasets();
      message.success('Data imported successfully.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Import failed.';
      message.error(msg);
    } finally {
      setImporting(false);
    }
  }

  async function viewTableData(ds: Dataset) {
    setViewLoading(true);
    setViewModalOpen(true);
    try {
      const res = await api.get(`/datasets/${ds.id}/data?limit=100`);
      setViewData({ rows: res.data.data, dataset: ds });
    } catch {
      message.error('Failed to load table data.');
      setViewModalOpen(false);
    } finally {
      setViewLoading(false);
    }
  }

  async function handleDelete(ds: Dataset) {
    try {
      await api.delete(`/datasets/${ds.id}`);
      await fetchDatasets();
      message.success('Dataset deleted.');
    } catch {
      message.error('Delete failed.');
    }
  }

  async function handleUrlImport() {
    if (!importUrl.trim()) {
      message.error('Please enter a URL.');
      return;
    }
    setImportingUrl(true);
    try {
      await api.post('/datasets/upload', { url: importUrl.trim() });
      await fetchDatasets();
      message.success('File imported from URL successfully.');
      setUrlModalOpen(false);
      setImportUrl('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'URL import failed.';
      message.error(msg);
    } finally {
      setImportingUrl(false);
    }
  }

  function updateMapping(idx: number, field: keyof ColumnMapping, value: string) {
    setMappings((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  }

  const datasetColumns: ColumnsType<Dataset> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, record: Dataset) => (
        <Space>
          {record.file_name?.match(/\.xlsx?$/i) ? (
            <FileExcelOutlined style={{ color: '#217346' }} />
          ) : (
            <FileTextOutlined style={{ color: token.colorTextSecondary }} />
          )}
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Table Name',
      dataIndex: 'table_name',
      key: 'table_name',
      ellipsis: true,
      responsive: ['md' as const],
      render: (v: string | null) => <Text code>{v ?? '—'}</Text>,
    },
    {
      title: 'Rows',
      dataIndex: 'row_count',
      key: 'row_count',
      width: 90,
      align: 'right' as const,
      responsive: ['sm' as const],
      render: (v: number) => v > 0 ? v.toLocaleString() : '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: Dataset['status']) => {
        const s = STATUS_MAP[status] ?? STATUS_MAP.uploaded;
        return <Tag color={s.color} icon={s.icon}>{s.label}</Tag>;
      },
    },
    {
      title: 'Uploaded By',
      dataIndex: 'uploaded_by_name',
      key: 'uploaded_by_name',
      responsive: ['lg' as const],
      ellipsis: true,
      render: (v: string) => v || '—',
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
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      width: 160,
      render: (_: unknown, record: Dataset) => (
        <Space size={4}>
          {record.status === 'uploaded' && (
            <Tooltip title="Preview & Map">
              <Button
                type="text"
                size="small"
                icon={<ImportOutlined />}
                onClick={() => openMappingWorkspace(record)}
                loading={previewLoading}
                style={{ color: token.colorPrimary }}
              />
            </Tooltip>
          )}
          {record.status === 'imported' && record.table_name && (
            <Tooltip title="View Data">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => viewTableData(record)}
                loading={viewLoading}
                style={{ color: token.colorSuccess }}
              />
            </Tooltip>
          )}
          {record.status === 'imported' && (
            <Tooltip title="Profile Data">
              <Button
                type="text"
                size="small"
                icon={<ProfileOutlined />}
                onClick={() => navigate(`/explore/${record.id}`)}
                style={{ color: token.colorInfo }}
              />
            </Tooltip>
          )}
          <Popconfirm
            title={`Delete "${record.name}" and its data?`}
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const mappingStepItems = [
    { title: 'Review Headers', icon: <FileTextOutlined /> },
    { title: 'Column Types', icon: <DatabaseOutlined /> },
    { title: 'Preview Data', icon: <EyeOutlined /> },
    { title: 'Import', icon: <ImportOutlined /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <div style={{ marginBottom: 8 }}>
            <Title level={3} style={{ margin: 0 }}>Data Import</Title>
            <Text type="secondary">Upload CSV or Excel files, map columns, and import into the database.</Text>
          </div>

          <Dragger
            accept=".csv,.xls,.xlsx"
            showUploadList={false}
            customRequest={({ file, onSuccess }) => {
              handleUpload(file as File).then(() => onSuccess?.('ok'));
            }}
            disabled={uploading}
            style={{
              borderRadius: token.borderRadiusLG,
              border: `2px dashed ${token.colorBorder}`,
              background: token.colorBgLayout,
              padding: '24px 16px',
              transition: 'all 0.3s',
            }}
          >
            {uploading ? (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
                <Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>Uploading your file…</Paragraph>
              </div>
            ) : (
              <div style={{ padding: '16px 0', textAlign: 'center' }}>
                <div
                  className="ant-upload-drag-icon"
                  style={{
                    fontSize: 56,
                    marginBottom: 16,
                    color: token.colorPrimary,
                    animation: 'float 3s ease-in-out infinite',
                  }}
                >
                  <InboxOutlined />
                </div>
                <Paragraph strong style={{ fontSize: 16, marginBottom: 4 }}>
                  Drag & drop your file here
                </Paragraph>
                <Paragraph type="secondary" style={{ marginBottom: 8 }}>
                  or click to browse your computer
                </Paragraph>
                <Space size={16} style={{ marginTop: 8 }}>
                  <Tag icon={<FileTextOutlined />} color="blue">CSV</Tag>
                  <Tag icon={<FileExcelOutlined />} color="green">XLS</Tag>
                  <Tag icon={<FileExcelOutlined />} color="green">XLSX</Tag>
                </Space>
                <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
                  Maximum file size: 50 MB
                </Paragraph>
              </div>
            )}
          </Dragger>

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Button
              type="link"
              icon={<LinkOutlined />}
              onClick={() => setUrlModalOpen(true)}
            >
              Import from URL instead
            </Button>
          </div>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            style={{ height: '100%', minHeight: 280 }}
            styles={{ body: { display: 'flex', flexDirection: 'column', justifyContent: 'center' } }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                background: `linear-gradient(135deg, ${token.colorPrimaryBg}, ${token.colorInfoBg})`,
              }}>
                <DatabaseOutlined style={{ fontSize: 28, color: token.colorPrimary }} />
              </div>
              <Title level={5} style={{ marginBottom: 4 }}>How it works</Title>
              <Paragraph type="secondary" style={{ marginBottom: 20 }}>
                Three simple steps to get your data into the database
              </Paragraph>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Space align="start">
                <Badge count={1} style={{ backgroundColor: token.colorPrimary }} />
                <div>
                  <Text strong>Upload your file</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Drag & drop or browse for CSV/Excel files</Text>
                </div>
              </Space>
              <Space align="start">
                <Badge count={2} style={{ backgroundColor: token.colorPrimary }} />
                <div>
                  <Text strong>Map columns</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Review auto-mapped headers and set column types</Text>
                </div>
              </Space>
              <Space align="start">
                <Badge count={3} style={{ backgroundColor: token.colorPrimary }} />
                <div>
                  <Text strong>Import to database</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Choose a table name and import your data</Text>
                </div>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {recentlyImported && (
        <Card
          size="small"
          style={{ borderColor: token.colorSuccess, background: token.colorSuccessBg }}
        >
          <Space>
            <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 18 }} />
            <Text>Dataset imported successfully!</Text>
            <Button
              type="primary"
              size="small"
              icon={<ProfileOutlined />}
              onClick={() => {
                navigate(`/explore/${recentlyImported}`);
                setRecentlyImported(null);
              }}
            >
              Profile Data
            </Button>
            <Button size="small" onClick={() => setRecentlyImported(null)}>Dismiss</Button>
          </Space>
        </Card>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : datasets.length === 0 ? (
        <Empty
          description="No datasets yet. Upload a file to get started."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" icon={<CloudUploadOutlined />} onClick={() => {}}>
            Upload a File
          </Button>
        </Empty>
      ) : (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <Text strong style={{ fontSize: 16 }}>
              Datasets
              <Tag style={{ marginLeft: 8 }}>{datasets.length}</Tag>
            </Text>
          </div>
          <Table
            dataSource={datasets}
            columns={datasetColumns}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} datasets` }}
            scroll={{ x: 700 }}
            size="middle"
          />
        </Card>
      )}

      <Modal
        title={null}
        open={mappingModalOpen}
        onCancel={closeMappingWorkspace}
        width={Math.min(900, window.innerWidth - 48)}
        footer={null}
        destroyOnClose
        style={{ top: 20 }}
      >
        {previewLoading ? (
          <div style={{ textAlign: 'center', padding: 64 }}>
            <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
            <Paragraph type="secondary" style={{ marginTop: 16 }}>Parsing your file…</Paragraph>
          </div>
        ) : activePreview ? (
          <MappingModalContent
            preview={activePreview}
            mappings={mappings}
            tableName={tableName}
            importing={importing}
            step={mappingStep}
            onStepChange={setMappingStep}
            onTableNameChange={setTableName}
            onUpdateMapping={updateMapping}
            onImport={handleImport}
            onClose={closeMappingWorkspace}
            stepItems={mappingStepItems}
          />
        ) : null}
      </Modal>

      <Modal
        title={null}
        open={viewModalOpen}
        onCancel={() => { setViewModalOpen(false); setViewData(null); }}
        width={Math.min(1100, window.innerWidth - 48)}
        footer={null}
        destroyOnClose
        style={{ top: 20 }}
      >
        {viewLoading ? (
          <div style={{ textAlign: 'center', padding: 64 }}>
            <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
            <Paragraph type="secondary" style={{ marginTop: 16 }}>Loading table data…</Paragraph>
          </div>
        ) : viewData ? (
          <DataViewerContent data={viewData} />
        ) : null}
      </Modal>

      <Modal
        title="Import from URL"
        open={urlModalOpen}
        onCancel={() => { setUrlModalOpen(false); setImportUrl(''); }}
        onOk={handleUrlImport}
        okText="Import"
        okButtonProps={{ loading: importingUrl, icon: <LinkOutlined /> }}
        confirmLoading={importingUrl}
      >
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Enter the URL of a CSV or Excel file to import directly.
        </Paragraph>
        <Input
          placeholder="https://example.com/data.csv"
          prefix={<LinkOutlined />}
          value={importUrl}
          onChange={(e) => setImportUrl(e.target.value)}
          onPressEnter={handleUrlImport}
        />
      </Modal>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

interface MappingModalContentProps {
  preview: ParsedPreview;
  mappings: ColumnMapping[];
  tableName: string;
  importing: boolean;
  step: number;
  onStepChange: (step: number) => void;
  onTableNameChange: (v: string) => void;
  onUpdateMapping: (idx: number, field: keyof ColumnMapping, value: string) => void;
  onImport: () => void;
  onClose: () => void;
  stepItems: { title: string; icon: React.ReactNode }[];
}

function MappingModalContent({
  preview, mappings, tableName, importing, step, onStepChange,
  onTableNameChange, onUpdateMapping, onImport, onClose, stepItems,
}: MappingModalContentProps) {
  const { token } = theme.useToken();

  const mappingColumns: ColumnsType<ColumnMapping & { key: number }> = [
    { title: '#', key: 'idx', width: 48, render: (_v: unknown, _r: unknown, idx: number) => idx + 1 },
    {
      title: 'Original Header',
      key: 'original',
      ellipsis: true,
      render: (_v: unknown, _r: unknown, idx: number) => (
        <Text code>{mappings[idx].originalHeader}</Text>
      ),
    },
    {
      title: 'Column Name (SQL)',
      key: 'columnName',
      ellipsis: true,
      render: (_v: unknown, _r: unknown, idx: number) => (
        <Input
          value={mappings[idx].columnName}
          onChange={(e) => onUpdateMapping(idx, 'columnName', e.target.value)}
          size="small"
          style={{ fontFamily: 'monospace' }}
        />
      ),
    },
    {
      title: 'Type',
      key: 'type',
      width: 130,
      render: (_v: unknown, _r: unknown, idx: number) => (
        <Select
          value={mappings[idx].columnType}
          onChange={(v) => onUpdateMapping(idx, 'columnType', v)}
          size="small"
          style={{ width: 120 }}
          options={COLUMN_TYPES.map((t) => ({ value: t, label: t }))}
        />
      ),
    },
    {
      title: 'Sample Values',
      key: 'sample',
      responsive: ['lg' as const],
      ellipsis: true,
      render: (_v: unknown, _r: unknown, idx: number) => (
        <Text type="secondary" ellipsis style={{ maxWidth: 200, fontSize: 12 }}>
          {preview.preview.slice(0, 3).map((row) => String(row[mappings[idx].originalHeader] ?? '')).join(' | ')}
        </Text>
      ),
    },
  ];

  const previewTableColumns = preview.headers.map((h) => ({
    title: h,
    dataIndex: h,
    key: h,
    ellipsis: true,
    render: (v: unknown) => <Text style={{ fontSize: 12 }}>{String(v ?? '')}</Text>,
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <DatabaseOutlined style={{ color: token.colorPrimary }} /> Mapping Workspace
          </Title>
          <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
            File: <Text strong>{preview.dataset.name}</Text>
            {' · '}{preview.totalRows.toLocaleString()} rows · {preview.headers.length} columns
          </Text>
        </div>
        <Button icon={<CloseOutlined />} onClick={onClose} type="text" />
      </div>

      <Steps
        current={step}
        onChange={onStepChange}
        items={stepItems.map((s) => ({ title: s.title, icon: s.icon }))}
        size="small"
        style={{ marginBottom: 24 }}
      />

      {step === 0 && (
        <div>
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            Review the headers detected in your file. Column names have been auto-generated from the original headers.
          </Paragraph>
          <Table
            dataSource={mappings.map((m, i) => ({ key: i, ...m }))}
            columns={[
              { title: '#', key: 'idx', width: 48, render: (_v: unknown, _r: unknown, idx: number) => idx + 1 },
              {
                title: 'Original Header',
                key: 'original',
                ellipsis: true,
                render: (_v: unknown, _r: unknown, idx: number) => <Text code>{mappings[idx].originalHeader}</Text>,
              },
              {
                title: 'Auto-mapped Column Name',
                key: 'columnName',
                ellipsis: true,
                render: (_v: unknown, _r: unknown, idx: number) => <Text keyboard>{mappings[idx].columnName}</Text>,
              },
            ]}
            pagination={false}
            size="small"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button type="primary" onClick={() => onStepChange(1)}>
              Next: Edit Types <ImportOutlined />
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            Edit column names and select the appropriate data type for each column.
          </Paragraph>
          <Table
            dataSource={mappings.map((m, i) => ({ key: i, ...m }))}
            columns={mappingColumns}
            pagination={false}
            size="small"
            scroll={{ x: 600 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <Button onClick={() => onStepChange(0)}>Back</Button>
            <Button type="primary" onClick={() => onStepChange(2)}>
              Next: Preview Data <EyeOutlined />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            Preview a sample of your data before importing. Showing {Math.min(20, preview.totalRows)} of {preview.totalRows.toLocaleString()} rows.
          </Paragraph>
          <Table
            dataSource={preview.preview.map((row, i) => ({ key: i, ...row }))}
            columns={previewTableColumns}
            pagination={{ pageSize: 10, size: 'small' }}
            size="small"
            scroll={{ x: true }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <Button onClick={() => onStepChange(1)}>Back</Button>
            <Button type="primary" onClick={() => onStepChange(3)}>
              Next: Set Table Name & Import <ImportOutlined />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Target table name <Text type="secondary">(automatically prefixed with dyn_)</Text>
            </Text>
            <Space>
              <Text code>dyn_</Text>
              <Input
                value={tableName}
                onChange={(e) => onTableNameChange(e.target.value)}
                placeholder="my_table"
                style={{ fontFamily: 'monospace', width: 300 }}
              />
            </Space>
          </Card>

          <Card>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>Import Summary</Text>
            <Row gutter={16}>
              <Col span={8}>
                <StatisticItem label="Table" value={tableName ? `dyn_${tableName}` : '—'} />
              </Col>
              <Col span={8}>
                <StatisticItem label="Columns" value={mappings.length} />
              </Col>
              <Col span={8}>
                <StatisticItem label="Rows" value={preview.totalRows.toLocaleString()} />
              </Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {mappings.map((m, i) => (
                <Tag key={i} style={{ margin: 0 }}>
                  <Text code style={{ fontSize: 11 }}>{m.columnName}</Text>
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>{m.columnType}</Text>
                </Tag>
              ))}
            </div>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <Button onClick={() => onStepChange(2)}>Back</Button>
            <Button
              type="primary"
              icon={<DatabaseOutlined />}
              onClick={onImport}
              loading={importing}
              disabled={!tableName}
            >
              Create Table & Import
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatisticItem({ label, value }: { label: string; value: React.ReactNode }) {
  const { token } = theme.useToken();
  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
      <div style={{ fontSize: 16, fontWeight: 600, color: token.colorText }}>{value}</div>
    </div>
  );
}

interface DataViewerContentProps {
  data: { rows: Record<string, unknown>[]; dataset: Dataset };
}

function DataViewerContent({ data }: DataViewerContentProps) {
  const { token } = theme.useToken();
  const columns = data.rows.length > 0
    ? Object.keys(data.rows[0]).filter((k) => k !== 'id' && k !== '_imported_at')
    : [];

  const tableColumns: ColumnsType<Record<string, unknown> & { key: number }> = [
    {
      title: '#',
      key: 'idx',
      width: 48,
      fixed: 'left' as const,
      render: (_v: unknown, _r: unknown, idx: number) => <Text type="secondary">{idx + 1}</Text>,
    },
    ...columns.map((c) => ({
      title: c,
      dataIndex: c,
      key: c,
      ellipsis: true,
      sorter: (a: Record<string, unknown>, b: Record<string, unknown>) => {
        const va = String(a[c] ?? ''), vb = String(b[c] ?? '');
        return va.localeCompare(vb);
      },
      render: (v: unknown) => <Text style={{ fontSize: 12 }}>{String(v ?? '')}</Text>,
    })),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <TableOutlined style={{ color: token.colorSuccess }} /> {data.dataset.name}
          </Title>
          <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
            Table: <Text code>{data.dataset.table_name}</Text>
            {' · '}{data.dataset.row_count.toLocaleString()} rows
            {' · '}{columns.length} columns
          </Text>
        </div>
      </div>
      <Table
        dataSource={data.rows.map((row, i) => ({ key: i, ...row }))}
        columns={tableColumns}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `${total} rows` }}
        size="small"
        scroll={{ x: true }}
      />
    </div>
  );
}
