import React, { useState } from 'react';

// Custom CSS for enhanced animations
const customStyles = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes bounce-in {
    0% { transform: translateY(-100px) scale(0.8); opacity: 0; }
    50% { transform: translateY(0px) scale(1.05); opacity: 1; }
    65% { transform: translateY(-10px) scale(1.02); }
    81% { transform: translateY(0px) scale(1); }
    100% { transform: translateY(0px) scale(1); opacity: 1; }
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

interface ReviewSettings {
  id: string;
  enable_reviews: boolean;
  enable_ratings: boolean;
  auto_approve_reviews: boolean;
  min_rating_to_display: number;
  max_reviews_per_service: number;
  require_booking_for_review: boolean;
  allow_anonymous_reviews: boolean;
  enable_review_moderation: boolean;
  profanity_filter_enabled: boolean;
  review_display_order: 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful';
  show_reviewer_info: boolean;
  enable_review_replies: boolean;
  review_edit_time_limit: number; // in hours
  featured_reviews_limit: number;
}

interface ReviewModerationRule {
  id: string;
  name: string;
  description: string;
  rule_type: 'keyword_block' | 'rating_threshold' | 'length_requirement' | 'custom';
  parameters: Record<string, unknown>;
  is_active: boolean;
}

const ReviewSettings: React.FC = () => {
  const [settings, setSettings] = useState<ReviewSettings>({
    id: '1',
    enable_reviews: true,
    enable_ratings: true,
    auto_approve_reviews: false,
    min_rating_to_display: 1,
    max_reviews_per_service: 100,
    require_booking_for_review: true,
    allow_anonymous_reviews: false,
    enable_review_moderation: true,
    profanity_filter_enabled: true,
    review_display_order: 'newest',
    show_reviewer_info: true,
    enable_review_replies: true,
    review_edit_time_limit: 24,
    featured_reviews_limit: 5
  });

  const [moderationRules, setModerationRules] = useState<ReviewModerationRule[]>([
    {
      id: '1',
      name: 'Profanity Filter',
      description: 'Automatically block reviews containing inappropriate language',
      rule_type: 'keyword_block',
      parameters: { keywords: ['spam', 'fake', 'scam'] },
      is_active: true
    },
    {
      id: '2',
      name: 'Minimum Length Requirement',
      description: 'Reviews must be at least 10 characters long',
      rule_type: 'length_requirement',
      parameters: { min_length: 10 },
      is_active: true
    }
  ]);

  const [showRuleForm, setShowRuleForm] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    rule_type: 'keyword_block' as any,
    keywords: '',
    min_length: 10,
    min_rating: 1,
    is_active: true
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'moderation' | 'display'>('general');

  // Save settings
  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual API call
      console.log('Saving review settings:', settings);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Review settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  // Add new moderation rule
  const handleAddRule = () => {
    const rule: ReviewModerationRule = {
      id: Date.now().toString(),
      name: newRule.name,
      description: newRule.description,
      rule_type: newRule.rule_type,
      parameters: {},
      is_active: newRule.is_active
    };

    switch (newRule.rule_type) {
      case 'keyword_block':
        rule.parameters = { keywords: newRule.keywords.split(',').map(k => k.trim()) };
        break;
      case 'length_requirement':
        rule.parameters = { min_length: newRule.min_length };
        break;
      case 'rating_threshold':
        rule.parameters = { min_rating: newRule.min_rating };
        break;
    }

    setModerationRules([...moderationRules, rule]);
    setNewRule({
      name: '',
      description: '',
      rule_type: 'keyword_block',
      keywords: '',
      min_length: 10,
      min_rating: 1,
      is_active: true
    });
    setShowRuleForm(false);
  };

  // Toggle rule status
  const toggleRule = (ruleId: string) => {
    setModerationRules(moderationRules.map(rule =>
      rule.id === ruleId ? { ...rule, is_active: !rule.is_active } : rule
    ));
  };

  // Delete rule
  const deleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this moderation rule?')) {
      setModerationRules(moderationRules.filter(rule => rule.id !== ruleId));
    }
  };

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Enhanced Header Section */}
          <div className="relative overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-yellow-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 -translate-y-16 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full transform -translate-x-12 translate-y-12 blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-white/20 rounded-2xl p-3">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">Review & Rating Settings</h1>
                        <p className="text-amber-100 text-lg">Configure customer feedback and review moderation</p>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{moderationRules.filter(r => r.is_active).length}</div>
                        <div className="text-sm text-amber-100">Active Rules</div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-amber-100 text-xl leading-relaxed mt-4">Manage customer reviews, ratings, and feedback moderation policies</p>
              </div>
            </div>
          </div>

          {/* Enhanced KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Reviews Status */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className={`bg-gradient-to-br ${settings.enable_reviews ? 'from-green-500 to-emerald-600' : 'from-gray-500 to-gray-600'} rounded-xl p-3`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={settings.enable_reviews ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M6 18L18 6M6 6l12 12"} />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{settings.enable_reviews ? '✓' : '✗'}</p>
                  <p className="text-sm font-medium text-gray-600">Reviews System</p>
                  <p className={`text-xs mt-1 font-medium ${settings.enable_reviews ? 'text-green-600' : 'text-gray-600'}`}>{settings.enable_reviews ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
            </div>

        {/* Auto Approval */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className={`bg-gradient-to-r ${settings.auto_approve_reviews ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} rounded-lg p-4 text-center`}>
            <p className="text-sm font-medium text-white mb-2">Auto Approval</p>
            <p className="text-4xl font-bold text-white">{settings.auto_approve_reviews ? '🚀' : '🔍'}</p>
            <p className="text-xs text-white mt-2">{settings.auto_approve_reviews ? 'Automatic' : 'Manual Review'}</p>
          </div>
        </div>

            {/* Moderation Rules */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{moderationRules.filter(r => r.is_active).length}</p>
                  <p className="text-sm font-medium text-gray-600">Moderation Rules</p>
                  <p className="text-xs text-purple-600 mt-1 font-medium">Active policies</p>
                </div>
              </div>
            </div>

            {/* Min Rating Display */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{settings.min_rating_to_display}⭐</p>
                  <p className="text-sm font-medium text-gray-600">Min Rating Display</p>
                  <p className="text-xs text-yellow-600 mt-1 font-medium">Display threshold</p>
                </div>
              </div>
            </div>

          </div>

          {/* Enhanced Header Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Review Configuration
                  <span className="text-sm font-normal text-gray-600 ml-2">• Manage feedback settings</span>
                </h2>
                <p className="text-gray-600 font-medium">Configure review policies, moderation rules, and customer feedback management</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="group relative px-6 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-bold flex items-center space-x-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white relative z-10"></div>
                      <span className="relative z-10">Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="relative z-10">Save Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {[
              { id: 'general', name: 'General Settings', icon: '⚙️' },
              { id: 'moderation', name: 'Moderation Rules', icon: '🛡️' },
              { id: 'display', name: 'Display Options', icon: '🎨' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'general' | 'moderation' | 'display')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Core Features */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Core Features</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Enable Reviews</label>
                        <p className="text-xs text-gray-500">Allow customers to write reviews</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.enable_reviews}
                        onChange={(e) => setSettings({ ...settings, enable_reviews: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Enable Ratings</label>
                        <p className="text-xs text-gray-500">Show star ratings system</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.enable_ratings}
                        onChange={(e) => setSettings({ ...settings, enable_ratings: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Auto-approve Reviews</label>
                        <p className="text-xs text-gray-500">Automatically publish reviews without moderation</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.auto_approve_reviews}
                        onChange={(e) => setSettings({ ...settings, auto_approve_reviews: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Require Booking for Review</label>
                        <p className="text-xs text-gray-500">Only allow reviews from verified bookings</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.require_booking_for_review}
                        onChange={(e) => setSettings({ ...settings, require_booking_for_review: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Allow Anonymous Reviews</label>
                        <p className="text-xs text-gray-500">Allow reviews without showing reviewer name</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.allow_anonymous_reviews}
                        onChange={(e) => setSettings({ ...settings, allow_anonymous_reviews: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Limits and Thresholds */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Limits & Thresholds</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Rating to Display (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={settings.min_rating_to_display}
                        onChange={(e) => setSettings({ ...settings, min_rating_to_display: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Hide reviews below this rating</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Reviews per Service
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={settings.max_reviews_per_service}
                        onChange={(e) => setSettings({ ...settings, max_reviews_per_service: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Maximum number of reviews to show per service</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Review Edit Time Limit (hours)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={settings.review_edit_time_limit}
                        onChange={(e) => setSettings({ ...settings, review_edit_time_limit: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">How long users can edit their reviews (0 = no editing)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Featured Reviews Limit
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={settings.featured_reviews_limit}
                        onChange={(e) => setSettings({ ...settings, featured_reviews_limit: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Number of featured reviews to highlight</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Moderation Rules Tab */}
          {activeTab === 'moderation' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Review Moderation</h3>
                  <p className="text-sm text-gray-600">Configure automated moderation rules</p>
                </div>
                <button
                  onClick={() => setShowRuleForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Add Rule
                </button>
              </div>

              {/* Global Moderation Settings */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Enable Review Moderation</label>
                    <p className="text-xs text-gray-500">Apply moderation rules to all reviews</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enable_review_moderation}
                    onChange={(e) => setSettings({ ...settings, enable_review_moderation: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Profanity Filter</label>
                    <p className="text-xs text-gray-500">Automatically detect and block inappropriate language</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.profanity_filter_enabled}
                    onChange={(e) => setSettings({ ...settings, profanity_filter_enabled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>

              {/* Moderation Rules List */}
              <div className="space-y-4">
                {moderationRules.map((rule) => (
                  <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{rule.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            rule.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Type: {rule.rule_type.replace('_', ' ')} | 
                          Parameters: {JSON.stringify(rule.parameters)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleRule(rule.id)}
                          className={`px-3 py-1 rounded text-sm ${
                            rule.is_active
                              ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {rule.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="px-3 py-1 rounded text-sm bg-red-100 text-red-800 hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Rule Form */}
              {showRuleForm && (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-4">Add New Moderation Rule</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                      <input
                        type="text"
                        value={newRule.name}
                        onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="My Custom Rule"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
                      <select
                        value={newRule.rule_type}
                        onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="keyword_block">Keyword Blocking</option>
                        <option value="length_requirement">Length Requirement</option>
                        <option value="rating_threshold">Rating Threshold</option>
                        <option value="custom">Custom Rule</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newRule.description}
                      onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe what this rule does"
                    />
                  </div>

                  {/* Rule-specific parameters */}
                  {newRule.rule_type === 'keyword_block' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Blocked Keywords (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={newRule.keywords}
                        onChange={(e) => setNewRule({ ...newRule, keywords: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="spam, fake, scam"
                      />
                    </div>
                  )}

                  {newRule.rule_type === 'length_requirement' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Length (characters)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newRule.min_length}
                        onChange={(e) => setNewRule({ ...newRule, min_length: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {newRule.rule_type === 'rating_threshold' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Rating (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={newRule.min_rating}
                        onChange={(e) => setNewRule({ ...newRule, min_rating: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="rule_active"
                        checked={newRule.is_active}
                        onChange={(e) => setNewRule({ ...newRule, is_active: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="rule_active" className="ml-2 text-sm text-gray-700">
                        Activate rule immediately
                      </label>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowRuleForm(false)}
                        className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddRule}
                        disabled={!newRule.name || !newRule.description}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        Add Rule
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Display Options Tab */}
          {activeTab === 'display' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Display & Presentation</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Review Display</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Sort Order
                    </label>
                    <select
                      value={settings.review_display_order}
                      onChange={(e) => setSettings({ ...settings, review_display_order: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="rating_high">Highest Rating First</option>
                      <option value="rating_low">Lowest Rating First</option>
                      <option value="helpful">Most Helpful First</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Show Reviewer Information</label>
                      <p className="text-xs text-gray-500">Display reviewer name and profile</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.show_reviewer_info}
                      onChange={(e) => setSettings({ ...settings, show_reviewer_info: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Enable Review Replies</label>
                      <p className="text-xs text-gray-500">Allow business owners to reply to reviews</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enable_review_replies}
                      onChange={(e) => setSettings({ ...settings, enable_review_replies: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Review Display Preview</h4>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-semibold">JD</span>
                      </div>
                      <div className="flex-1">
                        {settings.show_reviewer_info ? (
                          <div className="text-sm font-medium text-gray-900">John Doe</div>
                        ) : (
                          <div className="text-sm font-medium text-gray-900">Anonymous Customer</div>
                        )}
                        <div className="flex items-center mt-1">
                          <div className="flex text-yellow-400">
                            {'★'.repeat(5)}
                          </div>
                          <span className="text-xs text-gray-500 ml-2">2 days ago</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">
                          Excellent service! The plumber arrived on time and fixed the issue quickly.
                        </p>
                        {settings.enable_review_replies && (
                          <div className="mt-3 pl-4 border-l-2 border-gray-200">
                            <div className="text-xs text-blue-600 font-medium">Business Owner Reply</div>
                            <p className="text-xs text-gray-600 mt-1">
                              Thank you for your feedback! We're glad we could help.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Statistics */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Current Review Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">342</div>
                    <div className="text-sm text-blue-800">Total Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">4.6</div>
                    <div className="text-sm text-green-800">Average Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">12</div>
                    <div className="text-sm text-orange-800">Pending Approval</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">3</div>
                    <div className="text-sm text-red-800">Flagged Reviews</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions Summary */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-yellow-400 text-xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Important Notes
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Changes to review settings will apply to all future reviews</li>
                <li>Existing reviews will not be affected by moderation rule changes</li>
                <li>Disabling reviews will hide the review section from service pages</li>
                <li>Review moderation rules are processed in the order they appear</li>
              </ul>
            </div>
          </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default ReviewSettings;