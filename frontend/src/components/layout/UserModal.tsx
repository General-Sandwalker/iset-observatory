import { useState } from 'react';
import { Modal, Form, Input, Checkbox, Switch, Button, Alert } from 'antd';
import {
  CloseCircleOutlined,
  UserOutlined,
  MailOutlined,
  LockOutlined,
} from '@ant-design/icons';
import type { User, Role } from '../../lib/types';

interface Props {
  user: User | null;
  roles: Role[];
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

export default function UserModal({ user, roles, onSave, onClose }: Props) {
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
        setError('Password is required for new users.');
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
      setError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit User' : 'Add User'}
      open
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          onClick={handleSubmit}
        >
          {isEdit ? 'Update User' : 'Create User'}
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
          label="Full Name"
          name="fullName"
          rules={[{ required: true, message: 'Full name is required' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Full Name" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input prefix={<MailOutlined />} type="email" placeholder="Email" />
        </Form.Item>

        <Form.Item
          label={
            <span>
              Password{' '}
              {isEdit && (
                <span style={{ color: '#999', fontWeight: 'normal' }}>
                  (leave blank to keep current)
                </span>
              )}
            </span>
          }
          name="password"
          rules={
            isEdit
              ? []
              : [{ required: true, message: 'Password is required' }]
          }
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder={isEdit ? '••••••••' : 'Password'}
          />
        </Form.Item>

        <Form.Item label="Roles">
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
          <Form.Item label="Account active">
            <Switch checked={isActive} onChange={setIsActive} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
