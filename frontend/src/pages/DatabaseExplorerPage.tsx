import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card, Row, Col, Input, Button, Space, Typography,
  Alert, Tag, theme, Select, Badge, Tooltip,
} from 'antd';
import {
  DatabaseOutlined, TableOutlined, UnorderedListOutlined,
  CalendarOutlined, UserOutlined, SearchOutlined, ReloadOutlined,
  FileTextOutlined, ProfileOutlined,
  InboxOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import api from '../lib/api';
import type { Dataset } from '../lib/types';

const { Title, Text, Paragraph } = Typography;

function fmt(n: number) { return n.toLocaleString(); }

function relDate(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

type SortKey = 'name' | 'date' | 'rows';
type StatusFilter = 'all' | 'imported' | 'uploaded' | 'error';

const SORT_KEYS: SortKey[] = ['name', 'date', 'rows'];

const STATUS_FILTER_KEYS: StatusFilter[] = ['all', 'imported', 'uploaded', 'error'];

export default function DatabaseExplorerPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [all, setAll] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('date');

  const fetchDatasets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ success: boolean; data: Dataset[] }>('/datasets');
      if (data.success) setAll(data.data);
    } catch {
      setError(t('explore.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDatasets(); }, [fetchDatasets]);

  const filtered = useMemo(() => {
    let result = all;

    if (statusFilter !== 'all') {
      result = result.filter((d) => d.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.table_name ?? '').toLowerCase().includes(q) ||
          (d.file_name ?? '').toLowerCase().includes(q),
      );
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'rows':
          return (b.row_count ?? 0) - (a.row_count ?? 0);
        default:
          return 0;
      }
    });

    return result;
  }, [all, search, statusFilter, sortBy]);

  const totalRecords = filtered.reduce((sum, d) => sum + (d.row_count ?? 0), 0);
  const tableCount = filtered.length;

  const STATUS_TAG_MAP: Record<string, { color: string; label: string }> = {
    imported: { color: 'green', label: t('common.imported') },
    uploaded: { color: 'orange', label: t('common.uploaded') },
    processing: { color: 'blue', label: t('common.processing') },
    error: { color: 'red', label: 'Error' },
  };

  const gradients = [
    `linear-gradient(135deg, ${token.colorPrimaryBg}, ${token.colorInfoBg})`,
    `linear-gradient(135deg, ${token.colorSuccessBg}, ${token.colorInfoBg})`,
    `linear-gradient(135deg, ${token.colorWarningBg}, ${token.colorBgContainer})`,
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={10}>
          <Space size="middle">
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorInfo})`,
            }}>
              <DatabaseOutlined style={{ color: '#fff', fontSize: 22 }} />
            </div>
            <div>
      <Title level={4} style={{ margin: 0 }}>{t('explore.title')}</Title>
      <Text type="secondary">
        {tableCount} {t('explore.tables')} · {fmt(totalRecords)} {t('explore.totalRecords')}
              </Text>
            </div>
          </Space>
        </Col>
        <Col xs={24} sm={12} md={14}>
          <Space
            size={8}
            wrap
            style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}
          >
            <Input
              placeholder={t('explore.searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ width: 200 }}
            />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_FILTER_KEYS.map((v) => ({ value: v, label: v === 'all' ? t('explore.allStatuses') : v === 'imported' ? t('common.imported') : v === 'uploaded' ? t('common.uploaded') : 'Error' }))}
          style={{ width: 140 }}
        />
        <Select
          value={sortBy}
          onChange={setSortBy}
          options={SORT_KEYS.map((v) => ({ value: v, label: v === 'name' ? 'Name' : v === 'date' ? 'Date' : t('common.rows') }))}
          style={{ width: 110 }}
              suffixIcon={<span style={{ fontSize: 11, color: token.colorTextSecondary }}>{t('explore.sort')}</span>}
            />
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined spin={loading} />}
                onClick={fetchDatasets}
              />
            </Tooltip>
          </Space>
        </Col>
      </Row>

      {loading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Col xs={24} sm={12} md={8} lg={6} key={i}>
              <Card loading style={{ height: 220 }} />
            </Col>
          ))}
        </Row>
      ) : error ? (
        <Alert
          type="error"
          message={error}
          showIcon
          action={
            <Button size="small" onClick={fetchDatasets}>Retry</Button>
          }
        />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            background: token.colorBgLayout,
            border: `2px dashed ${token.colorBorder}`,
          }}>
            <InboxOutlined style={{ fontSize: 36, color: token.colorTextQuaternary }} />
          </div>
        <Title level={5} type="secondary" style={{ marginBottom: 4 }}>
          {search || statusFilter !== 'all'
            ? t('explore.noMatching')
            : t('explore.noTables')}
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 20 }}>
          {search || statusFilter !== 'all'
            ? t('explore.noMatchingDesc')
            : t('explore.noTablesDesc')}
          </Paragraph>
          {(search || statusFilter !== 'all') && (
            <Button
              onClick={() => { setSearch(''); setStatusFilter('all'); }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {filtered.map((ds, idx) => {
            const colCount = ds.column_mapping?.length ?? 0;
            const statusInfo = STATUS_TAG_MAP[ds.status] ?? STATUS_TAG_MAP.uploaded;
            const gradient = gradients[idx % gradients.length];

            return (
              <Col xs={24} sm={12} md={8} lg={6} key={ds.id}>
                <Card
                  hoverable
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${ds.name}`}
                  onClick={() => navigate(`/explore/${ds.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/explore/${ds.id}`); } }}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    borderRadius: token.borderRadiusLG,
                  }}
                  styles={{ body: { padding: 20, display: 'flex', flexDirection: 'column', height: '100%' } }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: gradient,
                  }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: gradient,
                      flexShrink: 0,
                    }}>
                      <TableOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
                    </div>
                    <Badge
                      count={ds.row_count > 0 ? fmt(ds.row_count) : '0'}
                      overflowCount={999999999}
                      style={{
                        backgroundColor: ds.row_count > 0 ? token.colorPrimary : token.colorBgContainer,
                        color: ds.row_count > 0 ? '#fff' : token.colorTextSecondary,
                        fontWeight: 600,
                        fontSize: 11,
                        boxShadow: 'none',
                      }}
                    />
                  </div>

                  <Text strong style={{ display: 'block', fontSize: 14, marginBottom: 2, lineHeight: 1.3 }}>
                    {ds.name}
                  </Text>
                  <Text
                    code
                    style={{
                      fontSize: 11,
                      display: 'block',
                      marginBottom: 8,
                      color: token.colorTextTertiary,
                    }}
                  >
                    {ds.table_name ?? '—'}
                  </Text>

                  <Tag
                    color={statusInfo.color}
                    style={{ alignSelf: 'flex-start', fontSize: 11, lineHeight: '18px', padding: '0 6px', marginBottom: 12 }}
                  >
                    {statusInfo.label}
                  </Tag>

                  <div style={{ borderTop: `1px solid ${token.colorBorderSecondary}`, paddingTop: 10, marginTop: 'auto' }}>
                    <Row gutter={[4, 4]}>
                      <Col span={12}>
                        <Space size={4}>
                          <UnorderedListOutlined style={{ color: token.colorTextQuaternary, fontSize: 11 }} />
                          <Text type="secondary" style={{ fontSize: 11 }}>{colCount} {t('common.columns').toLowerCase()}</Text>
                        </Space>
                      </Col>
                      <Col span={12}>
                        <Space size={4}>
                          <CalendarOutlined style={{ color: token.colorTextQuaternary, fontSize: 11 }} />
                          <Text type="secondary" style={{ fontSize: 11 }}>{relDate(ds.created_at)}</Text>
                        </Space>
                      </Col>
                      {ds.file_name && (
                        <Col span={24}>
                          <Space size={4}>
                            <FileTextOutlined style={{ color: token.colorTextQuaternary, fontSize: 11 }} />
                            <Text type="secondary" ellipsis style={{ fontSize: 11, maxWidth: 140 }}>{ds.file_name}</Text>
                          </Space>
                        </Col>
                      )}
                      {ds.uploaded_by_name && (
                        <Col span={24}>
                          <Space size={4}>
                            <UserOutlined style={{ color: token.colorTextQuaternary, fontSize: 11 }} />
                            <Text type="secondary" ellipsis style={{ fontSize: 11, maxWidth: 140 }}>{ds.uploaded_by_name}</Text>
                          </Space>
                        </Col>
                      )}
                    </Row>
                  </div>

                  <div style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}>
              <Button
                type="primary"
                size="small"
                icon={<ArrowRightOutlined />}
                onClick={(e) => { e.stopPropagation(); navigate(`/explore/${ds.id}`); }}
                style={{ flex: 1 }}
              >
                Open
              </Button>
              {ds.status === 'imported' && (
                <Tooltip title={t('import.profileData')}>
                  <Button
                    size="small"
                    icon={<ProfileOutlined />}
                    onClick={(e) => { e.stopPropagation(); navigate(`/explore/${ds.id}`); }}
                    style={{ color: token.colorInfo, borderColor: token.colorInfo }}
                  >
                    Profile
                  </Button>
                </Tooltip>
              )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}
