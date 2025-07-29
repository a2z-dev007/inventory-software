import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Database, Palette } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { apiService } from '../services/api';
import { toast } from 'react-toastify';
import { fi } from 'date-fns/locale';
import Select from 'react-select';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  // Add state for currency and fontSize
  const [currency, setCurrency] = useState('INR');
  const [fontSize, setFontSize] = useState('medium');

  // Helper to get label for currency
  const currencyOptions = [
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
  ];
  const currencyLabel = currencyOptions.find(opt => opt.value === currency)?.label || currency;

  // Helper to get label for font size
  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];
  const fontSizeLabel = fontSizeOptions.find(opt => opt.value === fontSize)?.label || fontSize;

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    // { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    // { id: 'system', name: 'System', icon: Database },
    // { id: 'appearance', name: 'Appearance', icon: Palette },
  ];

  const changeUserPassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all the fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    setChanging(true);
    try {
     const res = await apiService.changePassword(currentPassword, newPassword);
     if (res.success) {
      toast.success('Password changed successfully');
     } else {
      toast.error(res.message);
     }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setChanging(false);
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader title="Profile Information" />
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      defaultValue={user?.name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <input
                    type="text"
                    value={user?.role}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                <Button className='gradient-btn' >Update Profile</Button>
              </div>
            </Card>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader title="Notification Preferences" />
              <div className="space-y-4">
                {[
                  { name: 'Low Stock Alerts', description: 'Get notified when products are running low' },
                  { name: 'New Orders', description: 'Receive notifications for new purchase orders' },
                  { name: 'Payment Reminders', description: 'Reminders for overdue invoices' },
                  { name: 'System Updates', description: 'Important system and security updates' },
                ].map((notification) => (
                  <div key={notification.name} className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{notification.name}</h4>
                      <p className="text-sm text-gray-500">{notification.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader title="Change Password" />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <Button
                  onClick={changeUserPassword}
                  disabled={changing}
                >
                  {changing ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </Card>

            {/* <Card>
              <CardHeader title="Two-Factor Authentication" />
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Add an extra layer of security to your account by enabling two-factor authentication.
                </p>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </Card> */}
          </div>
        );

      case 'system':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader title="System Configuration" />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <Select
                    options={currencyOptions}
                    value={currencyOptions.find(opt => opt.value === currency)}
                    onChange={option => setCurrency(option?.value || 'INR')}
                    classNamePrefix="react-select"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    defaultValue="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <Button>Save Settings</Button>
              </div>
            </Card>

            <Card>
              <CardHeader title="Data Management" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Export Data</h4>
                    <p className="text-sm text-gray-500">Download all your data as a backup</p>
                  </div>
                  <Button variant="outline">Export</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Clear Cache</h4>
                    <p className="text-sm text-gray-500">Clear application cache to improve performance</p>
                  </div>
                  <Button variant="outline">Clear</Button>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader title="Theme Settings" />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Color Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: 'Blue', color: 'bg-blue-600', active: true },
                      { name: 'Green', color: 'bg-green-600', active: false },
                      { name: 'Purple', color: 'bg-purple-600', active: false },
                    ].map((theme) => (
                      <div
                        key={theme.name}
                        className={`p-4 rounded-lg border-2 cursor-pointer ${
                          theme.active ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      >
                        <div className={`w-full h-8 ${theme.color} rounded mb-2`}></div>
                        <p className="text-sm text-center">{theme.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                  <Select
                    options={fontSizeOptions}
                    value={fontSizeOptions.find(opt => opt.value === fontSize)}
                    onChange={option => setFontSize(option?.value || 'medium')}
                    classNamePrefix="react-select"
                  />
                </div>
                <Button>Apply Changes</Button>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <div className="lg:w-64">
        <Card>
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Content */}
      <div className="flex-1">
        {renderTabContent()}
      </div>
    </div>
  );
};