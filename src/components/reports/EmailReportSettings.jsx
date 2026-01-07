import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import { EmailReportPreferences } from '../../api/entities';
import { Mail, Send, Clock, CheckCircle, Settings, Loader2 } from 'lucide-react';

export default function EmailReportSettings() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sendingNow, setSendingNow] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Get current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await base44.auth.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch user's email report preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['emailReportPreferences', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;

      try {
        const result = await base44.asServiceRole.entities.EmailReportPreferences.filter({
          user_email: currentUser.email
        });

        if (result && result.length > 0) {
          return result[0];
        }

        // Return default preferences if none exist
        return {
          user_email: currentUser.email,
          enabled: false,
          frequency: 'weekly',
          report_types: [],
          include_charts: true,
          include_ai_insights: true
        };
      } catch (error) {
        console.error('Error fetching preferences:', error);
        return null;
      }
    },
    enabled: !!currentUser?.email
  });

  // Form state
  const [formData, setFormData] = useState({
    enabled: false,
    frequency: 'weekly',
    report_types: [],
    include_charts: true,
    include_ai_insights: true
  });

  // Update form when preferences load
  useEffect(() => {
    if (preferences) {
      setFormData({
        enabled: preferences.enabled || false,
        frequency: preferences.frequency || 'weekly',
        report_types: preferences.report_types || [],
        include_charts: preferences.include_charts !== false,
        include_ai_insights: preferences.include_ai_insights !== false
      });
    }
  }, [preferences]);

  // Available report types
  const reportTypes = [
    { id: 'compliance', label: 'Compliance Summary', icon: '📊', description: 'Vehicle compliance rates and wash tracking' },
    { id: 'maintenance', label: 'Maintenance Analysis', icon: '🔧', description: 'Upcoming services and maintenance alerts' },
    { id: 'costs', label: 'Cost Analysis', icon: '💰', description: 'Maintenance costs and financial trends' },
    { id: 'ai_insights', label: 'AI-Generated Insights', icon: '🤖', description: 'Intelligent analysis and recommendations' }
  ];

  // Handle report type toggle
  const handleReportTypeToggle = (reportId) => {
    setFormData(prev => ({
      ...prev,
      report_types: prev.report_types.includes(reportId)
        ? prev.report_types.filter(id => id !== reportId)
        : [...prev.report_types, reportId]
    }));
  };

  // Handle "All Reports" toggle
  const handleAllReportsToggle = () => {
    const allReportIds = reportTypes.map(r => r.id);
    const allSelected = allReportIds.every(id => formData.report_types.includes(id));

    setFormData(prev => ({
      ...prev,
      report_types: allSelected ? [] : allReportIds
    }));
  };

  // Save preferences mutation
  const savePreferences = async () => {
    if (!currentUser?.email) return;

    setSaving(true);
    try {
      const data = {
        user_email: currentUser.email,
        enabled: formData.enabled,
        frequency: formData.frequency,
        report_types: formData.report_types,
        include_charts: formData.include_charts,
        include_ai_insights: formData.include_ai_insights,
        last_sent: preferences?.last_sent || null,
        next_scheduled: calculateNextScheduled(formData.frequency)
      };

      if (preferences?.id) {
        // Update existing
        await base44.asServiceRole.entities.EmailReportPreferences.update(preferences.id, data);
      } else {
        // Create new
        await base44.asServiceRole.entities.EmailReportPreferences.create(data);
      }

      queryClient.invalidateQueries(['emailReportPreferences', currentUser.email]);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate next scheduled date based on frequency
  const calculateNextScheduled = (frequency) => {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
    }
    return now.toISOString();
  };

  // Send email now
  const handleSendNow = async () => {
    if (!currentUser?.email) {
      alert('User email not found. Please refresh the page and try again.');
      return;
    }

    if (formData.report_types.length === 0) {
      alert('Please select at least one report type to send');
      return;
    }

    setSendingNow(true);
    try {
      console.log('Sending email report with params:', {
        userEmail: currentUser.email,
        reportTypes: formData.report_types,
        includeCharts: formData.include_charts,
        includeAiInsights: formData.include_ai_insights
      });

      // Call cloud function to send email immediately
      const result = await base44.functions.invoke('sendEmailReport', {
        userEmail: currentUser.email,
        reportTypes: formData.report_types,
        includeCharts: formData.include_charts,
        includeAiInsights: formData.include_ai_insights
      });

      console.log('Email report sent successfully:', result);
      setSuccessMessage('Report sent successfully! Check your email inbox.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error sending email report:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });

      let errorMessage = 'Failed to send email. ';
      if (error.message) {
        errorMessage += `Error: ${error.message}`;
      } else {
        errorMessage += 'Please try again or contact support.';
      }

      alert(errorMessage);
    } finally {
      setSendingNow(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-elora-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-elora-primary to-elora-primary-light text-white rounded-xl p-8 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
            <Mail className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Email Report Settings</h1>
            <p className="text-white/90">Configure automated email reports and delivery preferences</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Enable/Disable Toggle */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Enable Email Reports</h2>
              <p className="text-sm text-slate-600">Receive automated reports via email</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-elora-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-elora-primary"></div>
          </label>
        </div>
      </div>

      {/* Report Frequency */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-800">Report Frequency</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {['daily', 'weekly', 'monthly'].map((freq) => (
            <button
              key={freq}
              onClick={() => setFormData(prev => ({ ...prev, frequency: freq }))}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.frequency === freq
                  ? 'border-elora-primary bg-elora-primary/5 text-elora-primary font-semibold'
                  : 'border-slate-200 text-slate-600 hover:border-elora-primary/50'
              }`}
            >
              <div className="text-center">
                <div className="text-lg capitalize">{freq}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Report Types Selection */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">Select Reports to Include</h2>
          </div>
          <button
            onClick={handleAllReportsToggle}
            className="px-4 py-2 text-sm font-medium text-elora-primary hover:bg-elora-primary/5 rounded-lg transition-colors"
          >
            {reportTypes.every(r => formData.report_types.includes(r.id)) ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="grid gap-4">
          {reportTypes.map((report) => (
            <label
              key={report.id}
              className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                formData.report_types.includes(report.id)
                  ? 'border-elora-primary bg-elora-primary/5'
                  : 'border-slate-200 hover:border-elora-primary/30'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.report_types.includes(report.id)}
                onChange={() => handleReportTypeToggle(report.id)}
                className="mt-1 w-5 h-5 text-elora-primary border-slate-300 rounded focus:ring-elora-primary"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{report.icon}</span>
                  <span className="font-semibold text-slate-800">{report.label}</span>
                </div>
                <p className="text-sm text-slate-600">{report.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Additional Options */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Additional Options</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.include_charts}
              onChange={(e) => setFormData(prev => ({ ...prev, include_charts: e.target.checked }))}
              className="w-5 h-5 text-elora-primary border-slate-300 rounded focus:ring-elora-primary"
            />
            <div>
              <div className="font-medium text-slate-800">Include Charts & Visualizations</div>
              <div className="text-sm text-slate-600">Add visual graphs and charts to your reports</div>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.include_ai_insights}
              onChange={(e) => setFormData(prev => ({ ...prev, include_ai_insights: e.target.checked }))}
              className="w-5 h-5 text-elora-primary border-slate-300 rounded focus:ring-elora-primary"
            />
            <div>
              <div className="font-medium text-slate-800">Include AI-Generated Insights</div>
              <div className="text-sm text-slate-600">Get intelligent analysis and recommendations</div>
            </div>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="flex-1 bg-elora-primary hover:bg-elora-primary-light text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Settings className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>

        <button
          onClick={handleSendNow}
          disabled={sendingNow || formData.report_types.length === 0}
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {sendingNow ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Email Me Now
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Email reports will be sent to <strong>{currentUser?.email}</strong> with your organization's branding.
          {formData.enabled && formData.frequency && (
            <span> Your next scheduled report will be sent {formData.frequency}.</span>
          )}
        </p>
      </div>
    </div>
  );
}
