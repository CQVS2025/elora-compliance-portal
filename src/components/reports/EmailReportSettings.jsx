import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../../api/base44Client';
import { EmailReportPreferences } from '../../api/entities';
import { Mail, Send, Clock, CheckCircle, Settings, Loader2 } from 'lucide-react';

export default function EmailReportSettings() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [sendingNow, setSendingNow] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Get current user with retry logic
  useEffect(() => {
    const fetchCurrentUser = async (attemptNumber = 0) => {
      setUserLoading(true);
      setUserError(null);
      try {
        console.log(`[EmailReportSettings] Fetching current user (attempt ${attemptNumber + 1})...`);
        const user = await base44.auth.me();
        console.log('[EmailReportSettings] Current user loaded:', {
          id: user?.id,
          email: user?.email,
          hasEmail: !!user?.email
        });
        setCurrentUser(user);
        setRetryCount(0);
        setUserLoading(false);
      } catch (error) {
        console.error('[EmailReportSettings] Error fetching current user:', error);

        // Auto-retry up to 3 times with exponential backoff
        const maxRetries = 3;
        if (attemptNumber < maxRetries) {
          const delay = Math.pow(2, attemptNumber) * 1000; // 1s, 2s, 4s
          console.log(`[EmailReportSettings] Retrying in ${delay}ms...`);
          setRetryCount(attemptNumber + 1);
          setTimeout(() => fetchCurrentUser(attemptNumber + 1), delay);
        } else {
          // Max retries reached, show error state
          setUserError(error.message || 'Failed to load user information');
          setUserLoading(false);
        }
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch user's email report preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['emailReportPreferences', 'jonny@elora.com.au'],
    queryFn: async () => {
      if (!currentUser?.email) return null;

      try {
        const result = await base44.asServiceRole.entities.EmailReportPreferences.filter({
          user_email: 'jonny@elora.com.au'
        });

        if (result && result.length > 0) {
          return result[0];
        }

        // Return default preferences if none exist
        return {
          user_email: 'jonny@elora.com.au',
          enabled: false,
          frequency: 'weekly',
          report_types: [],
          include_charts: true,
          include_ai_insights: true,
          scheduled_time: '09:00',
          scheduled_day_of_week: 1,
          scheduled_day_of_month: 1
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
    include_ai_insights: true,
    scheduled_time: '09:00',
    scheduled_day_of_week: 1, // Monday
    scheduled_day_of_month: 1
  });

  // Update form when preferences load
  useEffect(() => {
    if (preferences) {
      setFormData({
        enabled: preferences.enabled || false,
        frequency: preferences.frequency || 'weekly',
        report_types: preferences.report_types || [],
        include_charts: preferences.include_charts !== false,
        include_ai_insights: preferences.include_ai_insights !== false,
        scheduled_time: preferences.scheduled_time || '09:00',
        scheduled_day_of_week: preferences.scheduled_day_of_week ?? 1,
        scheduled_day_of_month: preferences.scheduled_day_of_month || 1
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
        user_email: 'jonny@elora.com.au',
        enabled: formData.enabled,
        frequency: formData.frequency,
        report_types: formData.report_types,
        include_charts: formData.include_charts,
        include_ai_insights: formData.include_ai_insights,
        scheduled_time: formData.scheduled_time,
        scheduled_day_of_week: formData.scheduled_day_of_week,
        scheduled_day_of_month: formData.scheduled_day_of_month,
        last_sent: preferences?.last_sent || null,
        next_scheduled: calculateNextScheduled(formData.frequency, formData.scheduled_time, formData.scheduled_day_of_week, formData.scheduled_day_of_month)
      };

      if (preferences?.id) {
        // Update existing
        await base44.asServiceRole.entities.EmailReportPreferences.update(preferences.id, data);
      } else {
        // Create new
        await base44.asServiceRole.entities.EmailReportPreferences.create(data);
      }

      queryClient.invalidateQueries(['emailReportPreferences', 'jonny@elora.com.au']);
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
  const calculateNextScheduled = (frequency, scheduledTime = '09:00', dayOfWeek = 1, dayOfMonth = 1) => {
    const now = new Date();
    const [hours, minutes] = scheduledTime.split(':').map(Number);

    let nextDate = new Date();

    switch (frequency) {
      case 'daily':
        nextDate.setHours(hours, minutes, 0, 0);
        // If the time has passed today, schedule for tomorrow
        if (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;

      case 'weekly':
        nextDate.setHours(hours, minutes, 0, 0);
        // Set to the specified day of week
        const currentDay = nextDate.getDay();
        const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
        nextDate.setDate(nextDate.getDate() + daysUntilTarget);

        // If that's today but the time has passed, schedule for next week
        if (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + 7);
        }
        break;

      case 'monthly':
        nextDate.setHours(hours, minutes, 0, 0);
        nextDate.setDate(dayOfMonth);

        // If the day is in the past this month, schedule for next month
        if (nextDate <= now) {
          nextDate.setMonth(nextDate.getMonth() + 1);
          nextDate.setDate(dayOfMonth);
        }
        break;
    }

    return nextDate.toISOString();
  };

  // Send email now
  const handleSendNow = async () => {
    console.log('[handleSendNow] Button clicked');
    console.log('[handleSendNow] Current user state:', {
      currentUser: currentUser,
      email: currentUser?.email,
      hasEmail: !!currentUser?.email,
      userLoading: userLoading
    });

    if (!currentUser) {
      console.error('[handleSendNow] Current user is null');
      alert('User not loaded. Please wait a moment and try again.');
      return;
    }

    if (!currentUser.email) {
      console.error('[handleSendNow] Current user has no email field:', currentUser);
      alert('User email not found. Please refresh the page and try again.');
      return;
    }

    if (formData.report_types.length === 0) {
      console.warn('[handleSendNow] No report types selected');
      alert('Please select at least one report type to send');
      return;
    }

    setSendingNow(true);
    try {
      console.log('[handleSendNow] Sending email report with params:', {
        userEmail: 'jonny@elora.com.au',
        reportTypes: formData.report_types,
        includeCharts: formData.include_charts,
        includeAiInsights: formData.include_ai_insights
      });

      // Call cloud function to send email immediately
      const result = await base44.functions.invoke('sendEmailReport', {
        userEmail: 'jonny@elora.com.au',
        reportTypes: formData.report_types,
        includeCharts: formData.include_charts,
        includeAiInsights: formData.include_ai_insights
      });

      console.log('[handleSendNow] Email report sent successfully:', result);
      setSuccessMessage('Report sent successfully to jonny@elora.com.au! Check your email inbox.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('[handleSendNow] Error sending email report:', error);
      console.error('[handleSendNow] Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
        name: error.name
      });

      let errorMessage = 'Failed to send email. ';
      if (error.message && error.message.includes('User not found')) {
        errorMessage = 'Your user account was not found in the system. Please contact support.';
      } else if (error.message) {
        errorMessage += `Error: ${error.message}`;
      } else {
        errorMessage += 'Please try again or contact support.';
      }

      alert(errorMessage);
    } finally {
      setSendingNow(false);
    }
  };

  // Manual retry for user loading
  const handleRetryUserLoad = async () => {
    setUserError(null);
    setUserLoading(true);
    setRetryCount(0);
    try {
      console.log('[EmailReportSettings] Manual retry - fetching current user...');
      const user = await base44.auth.me();
      console.log('[EmailReportSettings] Current user loaded:', {
        id: user?.id,
        email: user?.email,
        hasEmail: !!user?.email
      });
      setCurrentUser(user);
    } catch (error) {
      console.error('[EmailReportSettings] Error fetching current user:', error);
      setUserError(error.message || 'Failed to load user information');
    } finally {
      setUserLoading(false);
    }
  };

  // Show error state if user failed to load
  if (userError && !userLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load User Information</h3>
              <p className="text-red-700 mb-4">
                We couldn't load your user information. This might be due to a temporary connection issue.
              </p>
              <p className="text-sm text-red-600 mb-4">Error: {userError}</p>
              <button
                onClick={handleRetryUserLoad}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-elora-primary mx-auto mb-4" />
          <p className="text-slate-600">Loading email report settings...</p>
          {retryCount > 0 && (
            <p className="text-slate-500 text-sm mt-2">Retrying... (attempt {retryCount + 1})</p>
          )}
        </div>
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
        <div className="grid grid-cols-3 gap-4 mb-6">
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

        {/* Scheduling Options */}
        <div className="pt-6 border-t border-slate-200 space-y-4">
          <h3 className="text-md font-semibold text-slate-700 mb-3">Schedule Details</h3>

          {/* Time Picker (all frequencies) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-medium text-slate-600 min-w-[100px]">
              Time of Day:
            </label>
            <input
              type="time"
              value={formData.scheduled_time}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-elora-primary focus:border-transparent"
            />
            <span className="text-sm text-slate-500">
              Reports will be sent at this time
            </span>
          </div>

          {/* Day of Week Picker (weekly only) */}
          {formData.frequency === 'weekly' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-sm font-medium text-slate-600 min-w-[100px]">
                Day of Week:
              </label>
              <select
                value={formData.scheduled_day_of_week}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_day_of_week: Number(e.target.value) }))}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-elora-primary focus:border-transparent"
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
              <span className="text-sm text-slate-500">
                Weekly reports will be sent on this day
              </span>
            </div>
          )}

          {/* Day of Month Picker (monthly only) */}
          {formData.frequency === 'monthly' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-sm font-medium text-slate-600 min-w-[100px]">
                Day of Month:
              </label>
              <select
                value={formData.scheduled_day_of_month}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_day_of_month: Number(e.target.value) }))}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-elora-primary focus:border-transparent"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              <span className="text-sm text-slate-500">
                Monthly reports will be sent on this day
              </span>
            </div>
          )}

          {/* Preview of next scheduled time */}
          {formData.enabled && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Next scheduled report:</strong>{' '}
                {new Date(calculateNextScheduled(
                  formData.frequency,
                  formData.scheduled_time,
                  formData.scheduled_day_of_week,
                  formData.scheduled_day_of_month
                )).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
            </div>
          )}
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
          disabled={sendingNow || userLoading || !currentUser?.email || formData.report_types.length === 0}
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          title={
            userLoading ? 'Loading user information...' :
            !currentUser?.email ? 'User email not available' :
            formData.report_types.length === 0 ? 'Please select at least one report type' :
            'Send email report now'
          }
        >
          {sendingNow ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : userLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading...
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
          <strong>Note:</strong> Email reports will be sent to{' '}
          <strong className="text-blue-900">jonny@elora.com.au</strong>{' '}
          with your organization's branding.
          {formData.enabled && formData.frequency && (
            <span> Your next scheduled report will be sent {formData.frequency}.</span>
          )}
        </p>
      </div>

      {/* Debug Info (remove after testing) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 border border-gray-300 p-4 rounded-lg text-xs">
          <p className="font-bold mb-2">Debug Info:</p>
          <p>User Loading: {userLoading ? 'Yes' : 'No'}</p>
          <p>Current User: {currentUser ? 'Loaded' : 'Not Loaded'}</p>
          <p>User Email: {currentUser?.email || 'Not Available'}</p>
          <p>Report Types Selected: {formData.report_types.length}</p>
          <p>Button Should Be: {(sendingNow || userLoading || !currentUser?.email || formData.report_types.length === 0) ? 'Disabled' : 'Enabled'}</p>
        </div>
      )}
    </div>
  );
}
