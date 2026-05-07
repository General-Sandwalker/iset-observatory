import { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Button, Space, Typography, Table, Tag, Spin, Empty,
  Modal, Form, Input, Select, Popconfirm, message, theme, Grid, Tooltip,
  Steps, Alert, Upload, Switch, Avatar, Statistic,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  UserAddOutlined, DeleteOutlined, EditOutlined, ReloadOutlined,
  UploadOutlined, ImportOutlined, TeamOutlined, SearchOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined,
  DownloadOutlined, FileTextOutlined,
} from '@ant-design/icons';
import Papa from 'papaparse';
import api from '../lib/api';
import type { Client } from '../lib/types';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

type ClientType = 'student' | 'alumni' | 'teacher';

const CLIENT_TYPE_COLORS: Record<ClientType, string> = {
  student: 'blue',
  alumni: 'green',
  teacher: 'orange',
};

const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  student: 'Student',
  alumni: 'Alumni',
  teacher: 'Teacher',
};

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function ClientsPage() {
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [creating, setCreating] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editing, setEditing] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState(0);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [passwordColumn, setPasswordColumn] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number; skipped: number; total: number; errors: { row: number; message: string }[];
  } | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/clients');
      setClients(res.data.data || []);
    } catch {
      message.error('Failed to load clients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleCreate = useCallback(async () => {
    try {
      const values = await createForm.validateFields();
      setCreating(true);
      await api.post('/clients', {
        cin: values.cin,
        username: values.username,
        fullName: values.fullName,
        email: values.email || undefined,
        phone: values.phone || undefined,
        clientType: values.clientType || 'student',
        password: values.password || undefined,
      });
      message.success('Client created successfully.');
      setCreateOpen(false);
      createForm.resetFields();
      fetchClients();
    } catch (err: any) {
      if (err.response?.data?.message) {
        message.error(err.response.data.message);
      } else if (err.errorFields) {
        message.error('Please fill in all required fields.');
      } else {
        message.error('Failed to create client.');
      }
    } finally {
      setCreating(false);
    }
  }, [createForm, fetchClients]);

  const handleEdit = useCallback(async () => {
    if (!editingClient) return;
    try {
      const values = await editForm.validateFields();
      setEditing(true);
      await api.put(`/clients/${editingClient.id}`, {
        cin: values.cin,
        username: values.username,
        fullName: values.fullName,
        email: values.email || undefined,
        phone: values.phone || undefined,
        clientType: values.clientType,
        isActive: values.isActive,
        password: values.password || undefined,
      });
      message.success('Client updated successfully.');
      setEditOpen(false);
      editForm.resetFields();
      setEditingClient(null);
      fetchClients();
    } catch (err: any) {
      if (err.response?.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error('Failed to update client.');
      }
    } finally {
      setEditing(false);
    }
  }, [editingClient, editForm, fetchClients]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await api.delete(`/clients/${id}`);
      message.success('Client deleted.');
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch {
      message.error('Failed to delete client.');
    }
  }, []);

  const handleCsvFile = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        const headers = results.meta.fields || [];
        if (rows.length === 0) {
          message.error('CSV file is empty or could not be parsed.');
          return;
        }
        setCsvRows(rows);
        setCsvHeaders(headers);
        const autoMap: Record<string, string> = {};
        const lowerHeaders = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const cinIdx = lowerHeaders.findIndex((h) => h.includes('cin') || h.includes('ident'));
        const usernameIdx = lowerHeaders.findIndex((h) => h.includes('username') || h.includes('user'));
        const nameIdx = lowerHeaders.findIndex((h) => h.includes('name') || h.includes('nom'));
        const emailIdx = lowerHeaders.findIndex((h) => h.includes('email') || h.includes('mail'));
        const phoneIdx = lowerHeaders.findIndex((h) => h.includes('phone') || h.includes('tel'));
        const typeIdx = lowerHeaders.findIndex((h) => h.includes('type') || h.includes('role'));
        if (cinIdx >= 0) autoMap.cin = headers[cinIdx];
        if (usernameIdx >= 0) autoMap.username = headers[usernameIdx];
        if (nameIdx >= 0) autoMap.fullName = headers[nameIdx];
        if (emailIdx >= 0) autoMap.email = headers[emailIdx];
        if (phoneIdx >= 0) autoMap.phone = headers[phoneIdx];
        if (typeIdx >= 0) autoMap.clientType = headers[typeIdx];
        setColumnMapping(autoMap);
        setPasswordColumn('');
        setImportResult(null);
        setImportStep(1);
      },
      error: () => {
        message.error('Failed to parse CSV file.');
      },
    });
    return false;
  }, []);

  const handleImport = useCallback(async () => {
    if (!columnMapping.cin || !columnMapping.username || !columnMapping.fullName) {
      message.error('You must map CIN, Username, and Full Name columns.');
      return;
    }
    setImporting(true);
    try {
      const mapping: Record<string, string> = {};
      mapping.cin = columnMapping.cin;
      mapping.username = columnMapping.username;
      mapping.fullName = columnMapping.fullName;
      if (columnMapping.email) mapping.email = columnMapping.email;
      if (columnMapping.phone) mapping.phone = columnMapping.phone;
      if (columnMapping.clientType) mapping.clientType = columnMapping.clientType;

      const res = await api.post('/clients/bulk-import', {
        rows: csvRows,
        columnMapping: mapping,
        passwordColumn: passwordColumn || undefined,
      });
      setImportResult(res.data);
      setImportStep(2);
      message.success(`Imported ${res.data.created} clients successfully.`);
      fetchClients();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  }, [columnMapping, csvRows, passwordColumn, fetchClients]);

  const resetImport = useCallback(() => {
    setImportStep(0);
    setCsvRows([]);
    setCsvHeaders([]);
    setColumnMapping({});
    setPasswordColumn('');
    setImportResult(null);
  }, []);

  const filteredClients = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.cin.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      c.client_type.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: clients.length,
    students: clients.filter((c) => c.client_type === 'student').length,
    alumni: clients.filter((c) => c.client_type === 'alumni').length,
    teachers: clients.filter((c) => c.client_type === 'teacher').length,
  };

  const columns: ColumnsType<Client> = [
    {
      title: 'Client',
      key: 'client',
      ellipsis: true,
      render: (_: unknown, r: Client) => (
        <Space size={10}>
          <Avatar
            size={32}
            style={{
              background: `linear-gradient(135deg, ${
                r.client_type === 'student' ? token.colorPrimary
                : r.client_type === 'alumni' ? token.colorSuccess
                : token.colorWarning
              }, ${
                r.client_type === 'student' ? token.colorInfo
                : r.client_type === 'alumni' ? token.colorSuccessActive
                : token.colorWarningActive
              })`,
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 8,
              flexShrink: 0,
            }}
          >
            {initials(r.full_name)}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Text strong style={{ display: 'block', fontSize: 13 }}>{r.full_name}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{r.username}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'CIN',
      dataIndex: 'cin',
      key: 'cin',
      width: 120,
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'client_type',
      key: 'client_type',
      width: 100,
      render: (v: ClientType) => (
        <Tag color={CLIENT_TYPE_COLORS[v]} style={{ margin: 0 }}>
          {CLIENT_TYPE_LABELS[v]}
        </Tag>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      ellipsis: true,
      responsive: ['lg' as const],
      render: (v: string) => v ? <Text style={{ fontSize: 12 }}>{v}</Text> : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      responsive: ['md' as const],
      render: (v: boolean) => (
        <Tag color={v ? 'success' : 'default'} icon={v ? <CheckCircleOutlined /> : <CloseCircleOutlined />} style={{ margin: 0 }}>
          {v ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      responsive: ['lg' as const],
      render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{new Date(v).toLocaleDateString()}</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      align: 'right' as const,
      render: (_: unknown, r: Client) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingClient(r);
                editForm.setFieldsValue({
                  cin: r.cin,
                  username: r.username,
                  fullName: r.full_name,
                  email: r.email,
                  phone: r.phone,
                  clientType: r.client_type,
                  isActive: r.is_active,
                });
                setEditOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this client?"
            description={`Remove ${r.full_name} (${r.cin}) from the system.`}
            onConfirm={() => handleDelete(r.id)}
            okText="Delete"
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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <Spin size="large" />
      </div>
    );
  }

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
              <TeamOutlined style={{ color: '#fff', fontSize: 22 }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0 }}>Clients</Title>
              <Text type="secondary">Manage students, alumni, and teachers</Text>
            </div>
          </Space>
        </Col>
        <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
          <Space wrap>
            <Button icon={<ImportOutlined />} onClick={() => { resetImport(); setImportOpen(true); }}>
              Bulk Import
            </Button>
            <Button type="primary" icon={<UserAddOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true); }}>
              Add Client
            </Button>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined spin={loading} />} onClick={fetchClients} />
            </Tooltip>
          </Space>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderColor: token.colorPrimary, background: token.colorPrimaryBg }} styles={{ body: { padding: '12px 16px' } }}>
            <Statistic title="Total" value={stats.total} valueStyle={{ fontSize: 22, color: token.colorPrimary }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderColor: token.colorInfo, background: token.colorInfoBg }} styles={{ body: { padding: '12px 16px' } }}>
            <Statistic title="Students" value={stats.students} valueStyle={{ fontSize: 22, color: token.colorInfo }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderColor: token.colorSuccess, background: token.colorSuccessBg }} styles={{ body: { padding: '12px 16px' } }}>
            <Statistic title="Alumni" value={stats.alumni} valueStyle={{ fontSize: 22, color: token.colorSuccess }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderColor: token.colorWarning, background: token.colorWarningBg }} styles={{ body: { padding: '12px 16px' } }}>
            <Statistic title="Teachers" value={stats.teachers} valueStyle={{ fontSize: 22, color: token.colorWarning }} />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <TeamOutlined style={{ color: token.colorPrimary }} />
            <Text strong>All Clients</Text>
            <Tag>{clients.length}</Tag>
          </Space>
        }
        extra={
          <Input
            placeholder="Search clients..."
            prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: isMobile ? '100%' : 220 }}
            size="small"
          />
        }
      >
        {filteredClients.length === 0 ? (
          <Empty
            description={search ? 'No clients match your search.' : 'No clients yet. Add clients individually or use bulk import.'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            dataSource={filteredClients}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (total) => `${total} clients` }}
            scroll={{ x: 600 }}
            size="middle"
          />
        )}
      </Card>

      {/* Create Client Modal */}
      <Modal
        title={<Space><UserAddOutlined style={{ color: token.colorPrimary }} /> Add Client</Space>}
        open={createOpen}
        onCancel={() => { setCreateOpen(false); createForm.resetFields(); }}
        onOk={handleCreate}
        okText="Create"
        confirmLoading={creating}
        width={520}
      >
        <Form form={createForm} layout="vertical" requiredMark={false} initialValues={{ clientType: 'student' }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="CIN" name="cin" rules={[{ required: true, message: 'CIN is required' }]}>
                <Input placeholder="e.g. 12345678" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Username" name="username" rules={[{ required: true, message: 'Username is required' }]}>
                <Input placeholder="e.g. johndoe" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Full name is required' }]}>
            <Input placeholder="e.g. John Doe" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Email" name="email">
                <Input placeholder="john@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone" name="phone">
                <Input placeholder="+216..." />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Client Type" name="clientType">
                <Select
                  options={[
                    { value: 'student', label: 'Student' },
                    { value: 'alumni', label: 'Alumni' },
                    { value: 'teacher', label: 'Teacher' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Password" name="password" extra="Default: CIN if empty">
                <Input.Password placeholder="Leave empty for CIN" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        title={<Space><EditOutlined style={{ color: token.colorPrimary }} /> Edit Client</Space>}
        open={editOpen}
        onCancel={() => { setEditOpen(false); editForm.resetFields(); setEditingClient(null); }}
        onOk={handleEdit}
        okText="Save"
        confirmLoading={editing}
        width={520}
      >
        <Form form={editForm} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="CIN" name="cin" rules={[{ required: true, message: 'CIN is required' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Username" name="username" rules={[{ required: true, message: 'Username is required' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Full name is required' }]}>
            <Input />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Email" name="email">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone" name="phone">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Client Type" name="clientType">
                <Select
                  options={[
                    { value: 'student', label: 'Student' },
                    { value: 'alumni', label: 'Alumni' },
                    { value: 'teacher', label: 'Teacher' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Active" name="isActive" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="New Password" name="password" extra="Leave empty to keep current password">
            <Input.Password placeholder="New password (optional)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        title={<Space><ImportOutlined style={{ color: token.colorPrimary }} /> Bulk Import Clients</Space>}
        open={importOpen}
        onCancel={() => { setImportOpen(false); resetImport(); }}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Steps
          current={importStep}
          items={[
            { title: 'Upload CSV' },
            { title: 'Map Columns' },
            { title: 'Result' },
          ]}
          style={{ marginBottom: 24 }}
        />

        {importStep === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Upload
              accept=".csv"
              showUploadList={false}
              beforeUpload={(file) => { handleCsvFile(file); return false; }}
            >
              <Button type="primary" size="large" icon={<UploadOutlined />} style={{ marginBottom: 16 }}>
                Select CSV File
              </Button>
            </Upload>
            <div>
              <Text type="secondary">
                Upload a CSV file with client data. You'll map columns in the next step.
              </Text>
            </div>
            <div style={{ marginTop: 16 }}>
              <Button
                type="link"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => {
                  const csv = 'cin,username,fullName,email,phone,clientType\n12345678,johndoe,John Doe,john@example.com,+21612345678,student';
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'clients_template.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download template CSV
              </Button>
            </div>
          </div>
        )}

        {importStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Alert
              type="info"
              showIcon
              icon={<FileTextOutlined />}
              message={`${csvRows.length} rows found in CSV`}
              description="Map your CSV columns to the required client fields below."
            />

            <div>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>Column Mapping</Text>
              {[
                { key: 'cin', label: 'CIN *', required: true },
                { key: 'username', label: 'Username *', required: true },
                { key: 'fullName', label: 'Full Name *', required: true },
                { key: 'email', label: 'Email', required: false },
                { key: 'phone', label: 'Phone', required: false },
                { key: 'clientType', label: 'Client Type', required: false },
              ].map((field) => (
                <Row key={field.key} gutter={12} align="middle" style={{ marginBottom: 8 }}>
                  <Col span={8}>
                    <Text style={{ fontSize: 13 }}>
                      {field.label}
                      {field.required && <Text type="danger"> *</Text>}
                    </Text>
                  </Col>
                  <Col span={16}>
                    <Select
                      value={columnMapping[field.key] || undefined}
                      onChange={(v) => setColumnMapping((prev) => ({ ...prev, [field.key]: v }))}
                      style={{ width: '100%' }}
                      placeholder="Select CSV column..."
                      allowClear
                      options={csvHeaders.map((h) => ({ value: h, label: h }))}
                    />
                  </Col>
                </Row>
              ))}
            </div>

            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Password Column</Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
                Select a column to use as the password. If not set, each client's CIN will be used as their password.
              </Text>
              <Select
                value={passwordColumn || undefined}
                onChange={setPasswordColumn}
                style={{ width: '100%' }}
                placeholder="Use CIN as default password"
                allowClear
                options={csvHeaders.map((h) => ({ value: h, label: h }))}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setImportStep(0)}>Back</Button>
              <Button
                type="primary"
                onClick={handleImport}
                loading={importing}
                disabled={!columnMapping.cin || !columnMapping.username || !columnMapping.fullName}
                icon={<ImportOutlined />}
              >
                Import {csvRows.length} Clients
              </Button>
            </div>
          </div>
        )}

        {importStep === 2 && importResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', borderColor: token.colorPrimary }}>
                  <Statistic title="Total" value={importResult.total} valueStyle={{ color: token.colorPrimary }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', borderColor: token.colorSuccess }}>
                  <Statistic title="Created" value={importResult.created} valueStyle={{ color: token.colorSuccess }} prefix={<CheckCircleOutlined />} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', borderColor: importResult.skipped > 0 ? token.colorWarning : token.colorBorder }}>
                  <Statistic title="Skipped" value={importResult.skipped} valueStyle={{ color: importResult.skipped > 0 ? token.colorWarning : token.colorTextQuaternary }} prefix={importResult.skipped > 0 ? <ExclamationCircleOutlined /> : undefined} />
                </Card>
              </Col>
            </Row>

            {importResult.errors.length > 0 && (
              <Card
                size="small"
                title={<Space><ExclamationCircleOutlined style={{ color: token.colorWarning }} /> <Text strong>Errors ({importResult.errors.length})</Text></Space>}
                style={{ maxHeight: 200, overflow: 'auto' }}
              >
                {importResult.errors.map((err, i) => (
                  <div key={i} style={{ marginBottom: 4, fontSize: 12 }}>
                    <Text type="secondary">Row {err.row}:</Text> <Text type="warning">{err.message}</Text>
                  </div>
                ))}
              </Card>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => { setImportOpen(false); resetImport(); }}>Close</Button>
              <Button type="primary" onClick={resetImport}>Import More</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
