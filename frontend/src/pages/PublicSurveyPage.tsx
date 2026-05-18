import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Typography, Spin, Alert, Button, Input, Space, message, theme, Rate, Checkbox, Radio, Select,
} from 'antd';
import {
  ThunderboltOutlined, ArrowLeftOutlined, SendOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import type { GeneratedSurvey, SurveyField } from '../lib/types';

const { Title, Text, Paragraph } = Typography;

export default function PublicSurveyPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [survey, setSurvey] = useState<GeneratedSurvey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function fetchSurvey() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/public/surveys/${id}`);
        if (cancelled) return;
        if (res.data.success && res.data.data) {
          setSurvey(res.data.data.schema || res.data.data);
        } else {
          setError(t('surveys.notFound'));
        }
      } catch {
        if (!cancelled) setError(t('surveys.fetchFailed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSurvey();
    return () => { cancelled = true; };
  }, [id]);

  function setAnswer(fieldId: string, value: any) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handleSubmit() {
    if (!survey || !id || submitting) return;
    const requiredFields = survey.fields.filter((f) => f.required);
    const missing = requiredFields.filter((f) => {
      const val = answers[f.id];
      if (val === undefined || val === null || val === '') return true;
      if (Array.isArray(val) && val.length === 0) return true;
      return false;
    });
    if (missing.length > 0) {
      message.error(t('surveys.requiredFieldsMissing'));
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/public/surveys/${id}/responses`, { answers });
      setSubmitted(true);
      message.success(t('surveys.submitSuccess'));
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      message.error(msg || t('surveys.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: token.colorBgLayout, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: token.colorBgLayout }}>
        {renderHeader()}
        <div style={{ maxWidth: 500, margin: '48px auto', padding: '0 16px' }}>
          <Alert type="error" message={error} showIcon />
          <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate('/public')} icon={<ArrowLeftOutlined />}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: token.colorBgLayout }}>
        {renderHeader()}
        <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 16px', textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: token.colorSuccess, marginBottom: 24 }} />
          <Title level={3}>{t('surveys.thankYou')}</Title>
          <Paragraph type="secondary">{t('surveys.thankYouDesc')}</Paragraph>
          <Button type="primary" onClick={() => navigate('/public')} icon={<ArrowLeftOutlined />}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  if (!survey) return null;

  return (
    <div style={{ minHeight: '100vh', background: token.colorBgLayout, display: 'flex', flexDirection: 'column' }}>
      {renderHeader()}
      <div style={{ maxWidth: 680, width: '100%', margin: '0 auto', padding: '32px 16px', flex: 1 }}>
        <Card>
          <Title level={3} style={{ marginTop: 0 }}>{survey.title}</Title>
          {survey.description && <Paragraph type="secondary">{survey.description}</Paragraph>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 24 }}>
            {survey.fields.map((field) => (
              <SurveyFieldInput key={field.id} field={field} value={answers[field.id]} onChange={(v) => setAnswer(field.id, v)} />
            ))}
          </div>
          <Button
            type="primary"
            icon={<SendOutlined />}
            size="large"
            block
            loading={submitting}
            onClick={handleSubmit}
            style={{ marginTop: 32 }}
          >
            {t('surveys.submit')}
          </Button>
        </Card>
      </div>
      <div style={{ padding: '20px 24px', textAlign: 'center', borderTop: `1px solid ${token.colorBorderSecondary}`, background: token.colorBgContainer }}>
        <Text type="secondary" style={{ fontSize: 12 }}>ISET Tozeur — Adaptive Digital Observatory</Text>
      </div>
    </div>
  );

  function renderHeader() {
    return (
      <div style={{
        background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
        padding: '32px 24px',
        color: '#fff',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)',
            marginBottom: 12,
          }}>
            <ThunderboltOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <Title level={3} style={{ color: '#fff', margin: 0 }}>{t('surveys.publicTitle')}</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 0 }}>
            {t('surveys.publicSubtitle')}
          </Paragraph>
        </div>
      </div>
    );
  }
}

function SurveyFieldInput({ field, value, onChange }: { field: SurveyField; value: any; onChange: (v: any) => void }) {
  const { token } = theme.useToken();

  return (
    <div>
      <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6, color: token.colorText }}>
        {field.label}
        {field.required && <Text type="danger"> *</Text>}
      </label>
      {(field.type === 'text' || field.type === 'email') && (
        <Input
          type={field.type}
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.type === 'date' && (
        <Input
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.type === 'number' && (
        <Input
          type="number"
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          min={field.min}
          max={field.max}
        />
      )}
      {field.type === 'textarea' && (
        <Input.TextArea
          placeholder={field.placeholder}
          rows={3}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.type === 'select' && (
        <Select
          style={{ width: '100%' }}
          placeholder={field.placeholder || 'Select…'}
          value={value ?? undefined}
          onChange={(v) => onChange(v)}
          options={field.options?.map((o) => ({ value: o, label: o }))}
        />
      )}
      {field.type === 'radio' && (
        <Radio.Group value={value ?? undefined} onChange={(e) => onChange(e.target.value)}>
          <Space direction="vertical">
            {field.options?.map((o) => (
              <Radio key={o} value={o}>{o}</Radio>
            ))}
          </Space>
        </Radio.Group>
      )}
      {field.type === 'checkbox' && (
        <Checkbox.Group value={value ?? []} onChange={(v) => onChange(v)}>
          <Space direction="vertical">
            {field.options?.map((o) => (
              <Checkbox key={o} value={o}>{o}</Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      )}
      {field.type === 'rating' && (
        <Rate count={field.max ?? 5} value={value ?? 0} onChange={(v) => onChange(v)} />
      )}
    </div>
  );
}
