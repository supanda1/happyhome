import React, { useState, useEffect } from 'react';

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
  parameters: any;
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
    rule_type: 'keyword_block' as const,
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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-amber-600 to-yellow-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">⭐ Review & Rating Settings</h1>
        <p className="text-amber-100">Configure review policies, moderation rules, and customer feedback management</p>
      </div>

      {/* Settings Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Reviews Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className={`bg-gradient-to-r ${settings.enable_reviews ? 'from-green-500 to-green-600' : 'from-gray-500 to-gray-600'} rounded-lg p-4 text-center`}>
            <p className="text-sm font-medium text-white mb-2">Reviews System</p>
            <p className="text-4xl font-bold text-white">{settings.enable_reviews ? '✓' : '✗'}</p>
            <p className="text-xs text-white mt-2">{settings.enable_reviews ? 'Enabled' : 'Disabled'}</p>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-purple-100 mb-2">Moderation Rules</p>
            <p className="text-4xl font-bold text-white">{moderationRules.filter(r => r.is_active).length}</p>
            <p className="text-xs text-purple-200 mt-2">Active Rules</p>
          </div>
        </div>

        {/* Min Rating Display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-yellow-100 mb-2">Min Rating Display</p>
            <p className="text-4xl font-bold text-white">{settings.min_rating_to_display}⭐</p>
            <p className="text-xs text-yellow-200 mt-2">Threshold</p>
          </div>
        </div>

      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Review Configuration</h2>
          <p className="text-gray-600 text-sm">Manage review policies, moderation settings, and display preferences</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-yellow-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>💾</span>
              <span>Save Settings</span>
            </>
          )}
        </button>
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
                onClick={() => setActiveTab(tab.id as any)}
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
  );
};

export default ReviewSettings;