import { useState, useEffect, useCallback } from 'react';
import {
  Collapse, Modal, Form, Input, Checkbox, Button, Space, Typography,
  Alert, Spin, Tag, Popconfirm, Card, Row, Col, Table, Switch, Select,
} from 'antd';
import { Grid, theme } from 'antd';
import {
  SafetyOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  LockOutlined, CheckCircleOutlined, CloseCircleOutlined, SwapOutlined,
  UserOutlined, DatabaseOutlined, BarChartOutlined,
  RobotOutlined, FileTextOutlined, SettingOutlined,
} from '@ant-design/icons';
import api from '../lib/api';
import type { Role, Permission } from '../lib/types';
import { useTranslation } from 'react-i18next';

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

const CATEGORY_COLORS: Record<string, string> = {
  users: '#2563eb',
  roles: '#7c3aed',
  data: '#0891b2',
  analytics: '#059669',
  ai: '#ea580c',
  surveys: '#db2777',
  settings: '#64748b',
};

const CATEGORY_ICONS: Record<string, React.ComponentType> = {
  users: UserOutlined,
  roles: SafetyOutlined,
  data: DatabaseOutlined,
  analytics: BarChartOutlined,
  ai: RobotOutlined,
  surveys: FileTextOutlined,
  settings: SettingOutlined,
};

const ACTION_KEYWORDS: Record<string, string> = {
  view: 'View',
  read: 'View',
  create: 'Create',
  add: 'Create',
  edit: 'Edit',
  update: 'Edit',
  manage: 'Edit',
  delete: 'Delete',
  remove: 'Delete',
};

function classifyAction(permName: string): string {
  const lower = permName.toLowerCase();
  for (const [keyword, label] of Object.entries(ACTION_KEYWORDS)) {
    if (lower.includes(keyword)) return label;
  }
  return 'View';
}

function buildMatrix(permissions: Permission[]): { categories: string[]; actions: string[]; matrix: Record<string, Record<string, Permission | null>> } {
  const categoriesSet = new Set<string>();
  const actionsSet = new Set<string>();
  const matrix: Record<string, Record<string, Permission | null>> = {};

  for (const p of permissions) {
    categoriesSet.add(p.category);
    actionsSet.add(classifyAction(p.name));
  }

  const categories = Array.from(categoriesSet).sort();
  const actions = Array.from(actionsSet).sort((a, b) => {
    const order = ['View', 'Create', 'Edit', 'Delete'];
    return order.indexOf(a) - order.indexOf(b);
  });

  for (const cat of categories) {
    matrix[cat] = {};
    for (const act of actions) {
      matrix[cat][act] = null;
    }
  }

  for (const p of permissions) {
    const action = classifyAction(p.name);
    if (matrix[p.category]) {
      matrix[p.category][action] = p;
    }
  }

  return { categories, actions, matrix };
}

export default function RolesPage() {
  const { token } = theme.useToken();
  const { t } = useTranslation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareLeft, setCompareLeft] = useState<number | null>(null);
  const [compareRight, setCompareRight] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/roles/permissions'),
      ]);
      setRoles(rolesRes.data.roles);
      setAllPermissions(permsRes.data.permissions);
    } catch {
      setError(t('users.fetchFailed'));
  } finally {
    setLoading(false);
  }
}, [t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (error || success) {
    const timer = setTimeout(() => { setError(''); setSuccess(''); }, 3000);
    return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleDelete = async (role: Role) => {
    try {
      await api.delete(`/roles/${role.id}`);
      setSuccess(t('roles.deleteSuccess'));
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || t('roles.deleteFailed'));
    }
  };

  const permsByCategory = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  const { categories: matrixCats, actions: matrixActs, matrix: permMatrix } = buildMatrix(allPermissions);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <Spin size="large" />
      </div>
    );
  }

  const renderRoleCards = () => (
    <Row gutter={[16, 16]}>
      {roles.map((role) => {
        const permCount = role.permissions?.length || 0;
        const catColor = CATEGORY_COLORS['roles'] || token.colorPrimary;
        return (
          <Col xs={24} sm={12} key={role.id}>
            <Card
              style={{
                borderRadius: token.borderRadiusLG,
                borderColor: token.colorBorder,
                overflow: 'hidden',
              }}
              styles={{ body: { padding: 0 } }}
            >
              <div
                style={{
                  height: 4,
                  background: role.is_system
                    ? `linear-gradient(90deg, ${token.colorWarning}, ${token.colorWarning}88)`
                    : `linear-gradient(90deg, ${catColor}, ${catColor}88)`,
                }}
              />
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Space size={8} align="center">
                    <SafetyOutlined style={{ color: role.is_system ? token.colorWarning : token.colorPrimary, fontSize: 18 }} />
                    <Text strong style={{ fontSize: 15 }}>{role.name}</Text>
                  </Space>
                  {role.is_system && (
                    <Tag icon={<LockOutlined />} color="warning" style={{ margin: 0 }}>{t('roles.system')}</Tag>
                  )}
                </div>
                {role.description && (
                  <Text style={{ fontSize: 12, color: token.colorTextSecondary, display: 'block', marginBottom: 12 }}>
                    {role.description}
                  </Text>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Tag color="blue" style={{ margin: 0 }}>{t('roles.permissionCount', { count: permCount })}</Tag>
                  <Space size={4}>
                    <Button
                      size="small"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => { setEditingRole(role); setModalOpen(true); }}
                    />
                    {!role.is_system && (
                      <Popconfirm
          title={t('roles.deleteConfirm', { name: role.name })}
          onConfirm={() => handleDelete(role)}
          okText={t('common.delete')}
          cancelText={t('common.cancel')}
                        okButtonProps={{ danger: true }}
                      >
                        <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    )}
                  </Space>
                </div>
              </div>
            </Card>
          </Col>
        );
      })}
    </Row>
  );

  const renderRoleTable = () => (
    <Collapse
      items={roles.map((role) => {
        const permCount = role.permissions?.length || 0;
        const rolePerms = role.permissions || [];
        const rolePermIds = new Set(rolePerms.map((p) => p.id));
        const { categories: rcCats, actions: rcActs, matrix: rcMatrix } = buildMatrix(allPermissions.length > 0 ? allPermissions : rolePerms);

const matrixColumns = [
    {
      title: t('roles.category'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (cat: string) => {
        const CatIcon = CATEGORY_ICONS[cat] || SafetyOutlined;
        const color = CATEGORY_COLORS[cat] || token.colorPrimary;
        return (
          <Space size={6}>
            <CatIcon style={{ color, fontSize: 14 }} />
            <Text style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: 12 }}>{cat}</Text>
          </Space>
        );
      },
    },
    ...rcActs.map((action) => ({
            title: action,
            key: action,
            width: 70,
            align: 'center' as const,
            render: (_: any, row: { category: string }) => {
              const perm = rcMatrix[row.category]?.[action];
              if (!perm) return <span style={{ color: token.colorTextQuaternary }}>—</span>;
              const checked = rolePermIds.has(perm.id);
              return checked
                ? <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 16 }} />
                : <CloseCircleOutlined style={{ color: token.colorTextQuaternary, fontSize: 14 }} />;
            },
          })),
        ];

        const matrixData = rcCats.map((cat) => ({ category: cat, key: cat }));

        return {
          key: String(role.id),
          label: (
            <Space>
              <SafetyOutlined style={{ color: role.is_system ? token.colorWarning : token.colorPrimary }} />
              <Space size={4} align="center">
                <Text strong>{role.name}</Text>
{role.is_system && (
    <Tag icon={<LockOutlined />} color="warning">{t('roles.system')}</Tag>
    )}
              </Space>
              {role.description && <Text type="secondary" style={{ fontSize: 12 }}>{role.description}</Text>}
            </Space>
          ),
          extra: <Text type="secondary">{t('roles.permissionCount', { count: permCount })}</Text>,
          children: (
            <div>
              <div style={{ marginBottom: 12, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {rolePerms.map((p) => {
                  const color = CATEGORY_COLORS[p.category] || 'blue';
                  return (
                    <Tag key={p.id} color={color} style={{ marginBottom: 4 }}>{p.name}</Tag>
                  );
                })}
                {rolePerms.length === 0 && <Text type="secondary">{t('common.noData')}</Text>}
              </div>

              {allPermissions.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: 600, color: token.colorTextTertiary, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
                    {t('roles.permissionMatrix')}
                  </Text>
                  <Table
                    dataSource={matrixData}
                    columns={matrixColumns}
                    pagination={false}
                    size="small"
                    bordered
                    style={{ overflowX: 'auto' }}
                  />
                </div>
              )}

              <Space>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e) => { e.stopPropagation(); setEditingRole(role); setModalOpen(true); }}
        >
          {t('common.edit')}
        </Button>
        {!role.is_system && (
          <Popconfirm
            title={t('roles.deleteConfirm', { name: role.name })}
            onConfirm={() => handleDelete(role)}
            okText={t('common.delete')}
            cancelText={t('common.cancel')}
                    okButtonProps={{ danger: true }}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()}>
                      {t('common.delete')}
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </div>
          ),
        };
      })}
    />
  );

  const renderPermissionMatrix = () => {
const matrixColumns = [
    {
      title: t('roles.category'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (cat: string) => {
        const CatIcon = CATEGORY_ICONS[cat] || SafetyOutlined;
        const color = CATEGORY_COLORS[cat] || token.colorPrimary;
        return (
          <Space size={6}>
            <CatIcon style={{ color, fontSize: 14 }} />
            <Text style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: 12 }}>{cat}</Text>
          </Space>
        );
      },
    },
    ...matrixActs.map((action) => ({
        title: action,
        key: action,
        width: 70,
        align: 'center' as const,
        render: (_: any, row: { category: string }) => {
          const perm = permMatrix[row.category]?.[action];
          if (!perm) return <span style={{ color: token.colorTextQuaternary }}>—</span>;
          return (
            <Tag
              color={CATEGORY_COLORS[row.category] || 'blue'}
              style={{ margin: 0, fontSize: 11, cursor: 'default' }}
            >
              {perm.name}
            </Tag>
          );
        },
      })),
    ];

    const matrixData = matrixCats.map((cat) => ({ category: cat, key: cat }));

    return (
      <Card
      title={
        <Space>
          <SafetyOutlined />
          <span>{t('roles.permissionMatrix')}</span>
        </Space>
      }
        style={{ borderRadius: token.borderRadiusLG, marginBottom: 24 }}
      >
        <div style={{ overflowX: 'auto' }}>
          <Table
            dataSource={matrixData}
            columns={matrixColumns}
            pagination={false}
            size="small"
            bordered
          />
        </div>
      </Card>
    );
  };

  const renderCompareModal = () => {
    const leftRole = roles.find((r) => r.id === compareLeft);
    const rightRole = roles.find((r) => r.id === compareRight);
    if (!leftRole || !rightRole) return null;

    const leftPermIds = new Set((leftRole.permissions || []).map((p) => p.id));
    const rightPermIds = new Set((rightRole.permissions || []).map((p) => p.id));

    const allCats = Object.keys(permsByCategory);

    return (
      <Modal
    title={
      <Space>
        <SwapOutlined />
        <span>{t('roles.compareTitle')}</span>
      </Space>
    }
    open={compareOpen}
    onCancel={() => setCompareOpen(false)}
    footer={<Button onClick={() => setCompareOpen(false)}>{t('common.close')}</Button>}
        width={isMobile ? undefined : 900}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card size="small" style={{ textAlign: 'center', borderColor: token.colorPrimary }}>
              <SafetyOutlined style={{ color: token.colorPrimary, fontSize: 24, marginBottom: 4 }} />
              <div><Text strong>{leftRole.name}</Text></div>
              <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                {t('roles.permissionCount', { count: leftRole.permissions?.length || 0 })}
              </Text>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" style={{ textAlign: 'center', borderColor: '#7c3aed' }}>
              <SafetyOutlined style={{ color: '#7c3aed', fontSize: 24, marginBottom: 4 }} />
              <div><Text strong>{rightRole.name}</Text></div>
              <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                {t('roles.permissionCount', { count: rightRole.permissions?.length || 0 })}
              </Text>
            </Card>
          </Col>
        </Row>

        {allCats.map((cat) => {
          const CatIcon = CATEGORY_ICONS[cat] || SafetyOutlined;
          const color = CATEGORY_COLORS[cat] || token.colorPrimary;
          const catPerms = permsByCategory[cat] || [];
          return (
            <div key={cat} style={{ marginBottom: 16 }}>
              <Space size={6} style={{ marginBottom: 8 }}>
                <CatIcon style={{ color }} />
                <Text strong style={{ textTransform: 'capitalize' }}>{cat}</Text>
              </Space>
              <Row gutter={[8, 8]}>
                {catPerms.map((p) => {
                  const inLeft = leftPermIds.has(p.id);
                  const inRight = rightPermIds.has(p.id);
                  return (
                    <Col xs={24} sm={12} key={p.id}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px 8px',
                          borderRadius: token.borderRadius,
                          background: token.colorBgElevated,
                          border: `1px solid ${token.colorBorder}`,
                          fontSize: 12,
                        }}
                      >
                        <Text style={{ fontSize: 12 }}>{p.name}</Text>
                        <Space size={8}>
                          <span style={{ color: inLeft ? token.colorSuccess : token.colorTextQuaternary, fontSize: 14 }}>
                            {inLeft ? '✓' : '✗'}
                          </span>
                          <span style={{ color: inRight ? '#7c3aed' : token.colorTextQuaternary, fontSize: 14 }}>
                            {inRight ? '✓' : '✗'}
                          </span>
                        </Space>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </div>
          );
        })}
      </Modal>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <Space size="middle">
          <SafetyOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
          <Title level={3} style={{ margin: 0 }}>{t('roles.title')}</Title>
        </Space>
        <Space size={8}>
          {!isMobile && (
            <Button
              icon={<SwapOutlined />}
              onClick={() => setCompareOpen(true)}
              disabled={roles.length < 2}
            >
              {t('roles.compare')}
            </Button>
          )}
          {isMobile && (
            <Button
              icon={<SwapOutlined />}
              onClick={() => setCompareOpen(true)}
              disabled={roles.length < 2}
              size="small"
            />
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditingRole(null); setModalOpen(true); }}
          >
            {isMobile ? t('common.create') : t('roles.addRole')}
          </Button>
        </Space>
      </div>

      {error && <Alert type="error" message={error} showIcon closable style={{ marginBottom: 16 }} />}
      {success && <Alert type="success" message={success} showIcon closable style={{ marginBottom: 16 }} />}

      {!isMobile && renderPermissionMatrix()}

      {isMobile ? renderRoleCards() : renderRoleTable()}

      {modalOpen && (
        <RoleModal
          role={editingRole}
          permsByCategory={permsByCategory}
          onSave={async (data) => {
            try {
              if (editingRole) {
                await api.put(`/roles/${editingRole.id}`, data);
            setSuccess(t('roles.updateSuccess'));
            } else {
              await api.post('/roles', data);
              setSuccess(t('roles.createSuccess'));
              }
              setModalOpen(false);
              setEditingRole(null);
              fetchData();
            } catch (err: any) {
              throw err;
            }
          }}
          onClose={() => { setModalOpen(false); setEditingRole(null); }}
        />
      )}

    {compareOpen && compareLeft == null && (
      <CompareSelectorModal
        roles={roles}
        onCompare={(leftId, rightId) => {
          setCompareLeft(leftId);
          setCompareRight(rightId);
        }}
        onClose={() => setCompareOpen(false)}
      />
    )}

    {compareOpen && compareLeft != null && compareRight != null && renderCompareModal()}
    </div>
  );
}

interface RoleModalProps {
  role: Role | null;
  permsByCategory: Record<string, Permission[]>;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

function RoleModal({ role, permsByCategory, onSave, onClose }: RoleModalProps) {
  const { token } = theme.useToken();
  const { t } = useTranslation();
  const isEdit = !!role;
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selectedPerms, setSelectedPerms] = useState<number[]>(
    role?.permissions?.map((p) => p.id) || []
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const togglePerm = (id: number) => {
    setSelectedPerms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const toggleCategory = (perms: Permission[]) => {
    const ids = perms.map((p) => p.id);
    const allSelected = ids.every((id) => selectedPerms.includes(id));
    if (allSelected) {
      setSelectedPerms((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedPerms((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await onSave({ name, description, permissionIds: selectedPerms });
    } catch (err: any) {
      setError(err.response?.data?.message || t('users.bulkFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
    title={isEdit ? t('roles.editRole') : t('roles.addRole')}
    open
    onCancel={onClose}
    onOk={handleSubmit}
    confirmLoading={submitting}
    okText={isEdit ? t('common.save') : t('common.create')}
      width={640}
    >
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 4 }}>{t('common.name')}</Text>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isEdit && role?.is_system}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 4 }}>{t('common.description')}</Text>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>{t('roles.permissions')}</Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(permsByCategory).map(([category, perms]) => {
            const allChecked = perms.every((p) => selectedPerms.includes(p.id));
            const someChecked = perms.some((p) => selectedPerms.includes(p.id));
            const CatIcon = CATEGORY_ICONS[category] || SafetyOutlined;
            const catColor = CATEGORY_COLORS[category] || token.colorPrimary;
            return (
              <div
                key={category}
                style={{
                  border: `1px solid ${token.colorBorder}`,
                  borderRadius: 8,
                  padding: 12,
                  backgroundColor: token.colorBgElevated,
                  borderLeft: `3px solid ${catColor}`,
                }}
              >
                <Checkbox
                  checked={allChecked}
                  indeterminate={someChecked && !allChecked}
                  onChange={() => toggleCategory(perms)}
                  style={{ marginBottom: 8 }}
                >
                  <Space size={6}>
                    <CatIcon style={{ color: catColor, fontSize: 14 }} />
                    <Text strong style={{ textTransform: 'capitalize' }}>{category}</Text>
                  </Space>
                </Checkbox>
                <div style={{ marginLeft: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {perms.map((p) => (
                    <Checkbox
                      key={p.id}
                      checked={selectedPerms.includes(p.id)}
                      onChange={() => togglePerm(p.id)}
                    >
                      <Text style={{ fontSize: 12 }}>{p.name}</Text>
                      {p.description && (
                        <Text type="secondary" style={{ fontSize: 11 }}> — {p.description}</Text>
                      )}
                    </Checkbox>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

interface CompareSelectorModalProps {
  roles: Role[];
  onCompare: (leftId: number, rightId: number) => void;
  onClose: () => void;
}

function CompareSelectorModal({ roles, onCompare, onClose }: CompareSelectorModalProps) {
  const { token } = theme.useToken();
  const { t } = useTranslation();
  const [leftId, setLeftId] = useState<number | null>(null);
  const [rightId, setRightId] = useState<number | null>(null);

  const handleCompare = () => {
    if (leftId != null && rightId != null && leftId !== rightId) {
      onCompare(leftId, rightId);
      onClose();
    }
  };

  return (
    <Modal
    title={
      <Space>
        <SwapOutlined />
        <span>{t('roles.compareTitle')}</span>
      </Space>
    }
    open
    onCancel={onClose}
    onOk={handleCompare}
    okText={t('roles.compare')}
      okButtonProps={{ disabled: leftId == null || rightId == null || leftId === rightId }}
    >
      <Row gutter={16}>
        <Col span={12}>
        <Text strong style={{ display: 'block', marginBottom: 8, color: token.colorPrimary }}>{t('roles.selectLeft')}</Text>
        <Select
          style={{ width: '100%' }}
          placeholder={t('roles.selectLeft')}
            value={leftId ?? undefined}
            onChange={(val) => setLeftId(val)}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
          />
        </Col>
        <Col span={12}>
        <Text strong style={{ display: 'block', marginBottom: 8, color: '#7c3aed' }}>{t('roles.selectRight')}</Text>
        <Select
          style={{ width: '100%' }}
          placeholder={t('roles.selectRight')}
            value={rightId ?? undefined}
            onChange={(val) => setRightId(val)}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
          />
        </Col>
      </Row>
      {leftId != null && rightId != null && leftId === rightId && (
        <Alert type="warning" message={t('roles.compareDifferent')} showIcon style={{ marginTop: 16 }} />
      )}
    </Modal>
  );
}
