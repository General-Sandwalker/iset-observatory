import { useState } from 'react';
import { Modal, Form, Input, Checkbox, Switch, Button, Alert } from 'antd';
import {
  CloseCircleOutlined,
  UserOutlined,
  MailOutlined,
  LockOutlined,
} from '@ant-design/icons';
import type { User, Role } from '../../lib/types';
import { useTranslation } from 'react-i18next';

interface Props {
  user: User | null;
  roles: Role[];
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

export default function UserModal({ user, roles, onSave, onClose }: Props) {
  const { t } = useTranslation();
  const isEdit = !!user;
  const [form] = Form.useForm();
  const [selectedRoles, setSelectedRoles] = useState<number[]>(
    user?.roles?.map((r) => r.id) || []
  );
  const [isActive, setIsActive] = useState(
    user?.is_active ?? user?.isActive ?? true
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setError('');
      setSubmitting(true);

      if (!isEdit && !values.password) {
        setError(t('users.passwordRequired'));
        setSubmitting(false);
        return;
      }

      const data: any = {
        email: values.email,
        fullName: values.fullName,
        roleIds: selectedRoles,
        isActive,
      };
      if (values.password) data.password = values.password;

      await onSave(data);
    } catch (err: any) {
      if (err.errorFields) return;
      setError(err.response?.data?.message || t('users.operationFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEdit ? t('users.editUser') : t('users.addUser')}
      open
      onCancel={onClose}
      footer={[
      <Button key="cancel" onClick={onClose}>
        {t('common.cancel')}
      </Button>,
      <Button
        key="submit"
        type="primary"
        loading={submitting}
        onClick={handleSubmit}
      >
        {isEdit ? t('users.updateUser') : t('users.createUser')}
        </Button>,
      ]}
      destroyOnClose
    >
      {error && (
        <Alert
          type="error"
          message={error}
          icon={<CloseCircleOutlined />}
          showIcon
          closable
          onClose={() => setError('')}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          fullName: user?.full_name || user?.fullName || '',
          email: user?.email || '',
          password: '',
        }}
      >
        <Form.Item
      label={t('users.fullName')}
      name="fullName"
      rules={[{ required: true, message: t('users.fullNameRequired') }]}
    >
      <Input prefix={<UserOutlined />} placeholder={t('users.fullName')} />
        </Form.Item>

        <Form.Item
      label={t('users.email')}
      name="email"
      rules={[
        { required: true, message: t('users.emailRequired') },
        { type: 'email', message: t('users.emailInvalid') },
      ]}
    >
      <Input prefix={<MailOutlined />} type="email" placeholder={t('users.email')} />
        </Form.Item>

        <Form.Item
      label={
        <span>
          {t('users.password')}{' '}
          {isEdit && (
            <span style={{ color: '#999', fontWeight: 'normal' }}>
              ({t('users.leaveBlankToKeep')})
            </span>
          )}
        </span>
      }
      name="password"
      rules={
        isEdit
          ? []
          : [{ required: true, message: t('users.passwordRequired') }]
      }
    >
      <Input.Password
        prefix={<LockOutlined />}
        placeholder={isEdit ? '••••••••' : t('users.password')}
          />
        </Form.Item>

        <Form.Item label={t('users.roles')}>
          <Checkbox.Group
            value={selectedRoles}
            onChange={(values) => setSelectedRoles(values as number[])}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {roles.map((role) => (
                <Checkbox key={role.id} value={role.id}>
                  <span>{role.name}</span>
                  {role.description && (
                    <span style={{ color: '#999', fontSize: 12, marginLeft: 6 }}>
                      — {role.description}
                    </span>
                  )}
                </Checkbox>
              ))}
            </div>
          </Checkbox.Group>
        </Form.Item>

        {isEdit && (
          <Form.Item label={t('users.accountActive')}>
            <Switch checked={isActive} onChange={setIsActive} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
