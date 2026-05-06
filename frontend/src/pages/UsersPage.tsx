import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Table, Button, Input, Space, Typography, Alert, Spin, Tag,
  Popconfirm, Avatar, Card, Row, Col, Checkbox, Dropdown,
} from 'antd';
import { Grid, theme } from 'antd';
import {
  TeamOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  SafetyOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SearchOutlined, UserOutlined, EyeOutlined, EyeInvisibleOutlined,
  DownOutlined,
} from '@ant-design/icons';
import api from '../lib/api';
import type { User, Role } from '../lib/types';
import UserModal from '../components/layout/UserModal';
import { useAuth } from '../contexts/AuthContext';

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'red',
  admin: 'orange',
  analyst: 'blue',
  viewer: 'default',
};

const AVATAR_GRADIENTS: Record<string, [string, string]> = {
  super_admin: ['#dc2626', '#f87171'],
  admin: ['#ea580c', '#fb923c'],
  analyst: ['#2563eb', '#60a5fa'],
  viewer: ['#64748b', '#94a3b8'],
};

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

function getHighestRole(user: User): string {
  if (user.roles && user.roles.length > 0) {
    const priority = ['super_admin', 'admin', 'analyst', 'viewer'];
    for (const p of priority) {
      if (user.roles.some((r) => r.name === p)) return p;
    }
    return user.roles[0].name;
  }
  return user.legacy_role || user.role || 'viewer';
}

export default function UsersPage() {
  const { token } = theme.useToken();
  const { user: currentUser } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const currentUserId = currentUser?.id;

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles'),
      ]);
      setUsers(usersRes.data.users);
      setRoles(rolesRes.data.roles);
    } catch {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (error || success) {
      const t = setTimeout(() => { setError(''); setSuccess(''); }, 3000);
      return () => clearTimeout(t);
    }
  }, [error, success]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const handleDelete = async (user: User) => {
    try {
      await api.delete(`/users/${user.id}`);
      setSuccess('User deleted.');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, data);
        setSuccess('User updated.');
      } else {
        await api.post('/users', data);
        setSuccess('User created.');
      }
      setModalOpen(false);
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      throw err;
    }
  };

  const handleBulkActivate = async (activate: boolean) => {
    if (selectedRowKeys.length === 0) return;
    try {
      await Promise.all(
        selectedRowKeys.map((id) => api.put(`/users/${id}`, { isActive: activate }))
      );
      setSuccess(`${selectedRowKeys.length} user(s) ${activate ? 'activated' : 'deactivated'}.`);
      setSelectedRowKeys([]);
      fetchData();
    } catch {
      setError('Bulk operation failed.');
    }
  };

  const filtered = users.filter((u) => {
    const q = debouncedSearch.toLowerCase();
    const name = (u.full_name || u.fullName || '').toLowerCase();
    return name.includes(q) || u.email.toLowerCase().includes(q);
  });

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_: any, record: User) => {
        const highestRole = getHighestRole(record);
        const isActive = (record.is_active ?? record.isActive) ?? true;
        const gradients = AVATAR_GRADIENTS[highestRole] || ['#64748b', '#94a3b8'];
        const name = record.full_name || record.fullName || '';
        return (
          <Space size={10} align="center">
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                size={36}
                style={{
                  background: `linear-gradient(135deg, ${gradients[0]}, ${gradients[1]})`,
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#fff',
                }}
              >
                {getInitials(name)}
              </Avatar>
              <div
                style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  border: `2px solid ${token.colorBgContainer}`,
                  background: isActive ? token.colorSuccess : token.colorTextQuaternary,
                }}
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', fontSize: 13 }}>{name || '—'}</Text>
              <Text style={{ fontSize: 12, color: token.colorTextTertiary }}>{record.email}</Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Roles',
      key: 'roles',
      responsive: ['md' as const],
      render: (_: any, record: User) => (
        (record.roles && record.roles.length > 0)
          ? record.roles.map((r) => (
            <Tag
              key={r.id}
              icon={<SafetyOutlined />}
              color={ROLE_COLORS[r.name] || 'default'}
              style={{ margin: '0 4px 4px 0' }}
            >
              {r.name}
            </Tag>
          ))
          : <Tag color={ROLE_COLORS[record.legacy_role || record.role] || 'default'}>{record.legacy_role || record.role}</Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      align: 'center' as const,
      width: 80,
      responsive: ['lg' as const],
      render: (_: any, record: User) =>
        (record.is_active ?? record.isActive)
          ? <Tag color="success" style={{ margin: 0 }}>Active</Tag>
          : <Tag color="default" style={{ margin: 0 }}>Inactive</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      width: 100,
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => { setEditingUser(record); setModalOpen(true); }}
          />
          {record.id !== currentUserId && (record.role || record.legacy_role) !== 'super_admin' && (
            <Popconfirm
              title={`Delete user "${record.full_name || record.fullName}"?`}
              onConfirm={() => handleDelete(record)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const bulkMenuItems = [
    {
      key: 'activate',
      label: 'Activate selected',
      icon: <EyeOutlined />,
      onClick: () => handleBulkActivate(true),
    },
    {
      key: 'deactivate',
      label: 'Deactivate selected',
      icon: <EyeInvisibleOutlined />,
      danger: true,
      onClick: () => handleBulkActivate(false),
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
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <Space size="middle">
          <TeamOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
          <Title level={3} style={{ margin: 0 }}>User Management</Title>
        </Space>
        <Space size={8}>
          {selectedRowKeys.length > 0 && (
            <Dropdown menu={{ items: bulkMenuItems }}>
              <Button>
                <Space>
                  {selectedRowKeys.length} selected
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditingUser(null); setModalOpen(true); }}
          >
            {isMobile ? 'Add' : 'Add User'}
          </Button>
        </Space>
      </div>

      {error && <Alert type="error" message={error} showIcon closable style={{ marginBottom: 16 }} />}
      {success && <Alert type="success" message={success} showIcon closable style={{ marginBottom: 16 }} />}

      <Input
        placeholder="Search users…"
        prefix={<SearchOutlined />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        onClear={() => { setSearch(''); setDebouncedSearch(''); }}
        style={{ marginBottom: 16 }}
      />

      {isMobile ? (
        <Row gutter={[12, 12]}>
          {filtered.map((user) => {
            const name = user.full_name || user.fullName || '';
            const highestRole = getHighestRole(user);
            const isActive = (user.is_active ?? user.isActive) ?? true;
            const gradients = AVATAR_GRADIENTS[highestRole] || ['#64748b', '#94a3b8'];
            return (
              <Col xs={24} key={user.id}>
                <Card
                  size="small"
                  style={{
                    borderRadius: token.borderRadiusLG,
                    borderColor: token.colorBorder,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                    <Space size={10} align="center">
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <Avatar
                          size={40}
                          style={{
                            background: `linear-gradient(135deg, ${gradients[0]}, ${gradients[1]})`,
                            fontWeight: 700,
                            fontSize: 15,
                            color: '#fff',
                          }}
                        >
                          {getInitials(name)}
                        </Avatar>
                        <div
                          style={{
                            position: 'absolute',
                            bottom: -1,
                            right: -1,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            border: `2px solid ${token.colorBgContainer}`,
                            background: isActive ? token.colorSuccess : token.colorTextQuaternary,
                          }}
                        />
                      </div>
                      <div>
                        <Text strong style={{ display: 'block', fontSize: 14 }}>{name || '—'}</Text>
                        <Text style={{ fontSize: 12, color: token.colorTextTertiary }}>{user.email}</Text>
                      </div>
                    </Space>
                    <Space size={4}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => { setEditingUser(user); setModalOpen(true); }}
                      />
                      {user.id !== currentUserId && (user.role || user.legacy_role) !== 'super_admin' && (
                        <Popconfirm
                          title={`Delete user "${name}"?`}
                          onConfirm={() => handleDelete(user)}
                          okText="Delete"
                          cancelText="Cancel"
                          okButtonProps={{ danger: true }}
                        >
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      )}
                    </Space>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    {user.roles && user.roles.length > 0
                      ? user.roles.map((r) => (
                        <Tag key={r.id} icon={<SafetyOutlined />} color={ROLE_COLORS[r.name] || 'default'} style={{ margin: 0 }}>
                          {r.name}
                        </Tag>
                      ))
                      : <Tag color={ROLE_COLORS[user.legacy_role || user.role] || 'default'}>{user.legacy_role || user.role}</Tag>
                    }
                    <Tag color={isActive ? 'success' : 'default'} style={{ margin: 0, marginLeft: 4 }}>
                      {isActive ? 'Active' : 'Inactive'}
                    </Tag>
                  </div>
                </Card>
              </Col>
            );
          })}
          {filtered.length === 0 && (
            <Col xs={24}>
              <div style={{ textAlign: 'center', padding: 40, color: token.colorTextTertiary }}>
                <TeamOutlined style={{ fontSize: 36, marginBottom: 8, display: 'block' }} />
                No users found.
              </div>
            </Col>
          )}
        </Row>
      ) : (
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
        />
      )}

      {modalOpen && (
        <UserModal
          user={editingUser}
          roles={roles}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingUser(null); }}
        />
      )}
    </div>
  );
}
