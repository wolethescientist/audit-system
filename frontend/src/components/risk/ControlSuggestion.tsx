'use client';

import React, { useState, useEffect } from 'react';
import { ControlSuggestion, RiskControl, RiskControlCreate, User } from '@/lib/types';
import { api } from '@/lib/api';

interface ControlSuggestionProps {
  riskId: string;
  onControlAdded?: (control: RiskControl) => void;
  className?: string;
}

const ControlSuggestionComponent: React.FC<ControlSuggestionProps> = ({
  riskId,
  onControlAdded,
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<ControlSuggestion[]>([]);
  const [existingControls, setExistingControls] = useState<RiskControl[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingControl, setAddingControl] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<string | null>(null);
  const [riskInfo, setRiskInfo] = useState<any>(null);

  const [newControl, setNewControl] = useState<RiskControlCreate>({
    control_reference: '',
    control_title: '',
    control_description: '',
    control_type: 'preventive',
    implementation_status: 'planned',
    effectiveness_rating: undefined,
    implementation_date: '',
    responsible_person_id: '',
    evidence_url: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [riskId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSuggestions(),
        fetchExistingControls(),
        fetchUsers()
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load control suggestions');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    const response = await api.get(`/api/v1/risks/${riskId}/control-suggestions`);
    setSuggestions(response.data.suggested_controls);
    setRiskInfo({
      risk_title: response.data.risk_title,
      risk_rating: response.data.risk_rating,
      risk_category: response.data.risk_category
    });
  };

  const fetchExistingControls = async () => {
    const response = await api.get(`/api/v1/risks/${riskId}/controls`);
    setExistingControls(response.data);
  };

  const fetchUsers = async () => {
    const response = await api.get('/api/v1/users');
    setUsers(response.data);
  };

  const handleAddControl = async (suggestion: ControlSuggestion) => {
    try {
      setAddingControl(suggestion.reference);
      
      const controlData: RiskControlCreate = {
        control_reference: suggestion.reference,
        control_title: suggestion.title,
        control_description: `${suggestion.section_title}: ${suggestion.title}`,
        control_type: suggestion.type,
        implementation_status: 'planned'
      };

      const response = await api.post(`/api/v1/risks/${riskId}/controls`, controlData);
      const newControlData = response.data;
      
      setExistingControls(prev => [...prev, newControlData]);
      
      if (onControlAdded) {
        onControlAdded(newControlData);
      }
    } catch (error) {
      console.error('Failed to add control:', error);
      setError('Failed to add control');
    } finally {
      setAddingControl(null);
    }
  };

  const handleCustomControlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddingControl('custom');
      
      const response = await api.post(`/api/v1/risks/${riskId}/controls`, newControl);
      const newControlData = response.data;
      
      setExistingControls(prev => [...prev, newControlData]);
      setShowAddForm(null);
      setNewControl({
        control_reference: '',
        control_title: '',
        control_description: '',
        control_type: 'preventive',
        implementation_status: 'planned',
        effectiveness_rating: undefined,
        implementation_date: '',
        responsible_person_id: '',
        evidence_url: '',
        notes: ''
      });
      
      if (onControlAdded) {
        onControlAdded(newControlData);
      }
    } catch (error) {
      console.error('Failed to add custom control:', error);
      setError('Failed to add custom control');
    } finally {
      setAddingControl(null);
    }
  };

  const isControlAlreadyAdded = (reference: string): boolean => {
    return existingControls.some(control => control.control_reference === reference);
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getControlTypeIcon = (type: string): string => {
    switch (type) {
      case 'preventive': return '🛡️';
      case 'detective': return '🔍';
      case 'corrective': return '🔧';
      default: return '⚙️';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-32 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading control suggestions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 text-center p-4 ${className}`}>
        <p className="font-medium">Error loading control suggestions</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">ISO 27001 Control Suggestions</h3>
          {riskInfo && (
            <div className="text-sm text-gray-600">
              <p>Risk: {riskInfo.risk_title}</p>
              <p>Rating: {riskInfo.risk_rating} ({riskInfo.risk_category})</p>
            </div>
          )}
        </div>

        {/* Existing Controls */}
        {existingControls.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Current Controls</h4>
            <div className="space-y-2">
              {existingControls.map(control => (
                <div key={control.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="mr-2">{getControlTypeIcon(control.control_type)}</span>
                    <div>
                      <span className="font-medium text-green-800">{control.control_reference}</span>
                      <span className="ml-2 text-green-700">{control.control_title}</span>
                    </div>
                  </div>
                  <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                    {control.implementation_status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Controls */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold text-gray-900">Recommended Controls</h4>
            <button
              onClick={() => setShowAddForm(showAddForm ? null : 'custom')}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Custom Control
            </button>
          </div>
          
          <div className="space-y-3">
            {suggestions.map(suggestion => {
              const isAdded = isControlAlreadyAdded(suggestion.reference);
              const isAdding = addingControl === suggestion.reference;
              
              return (
                <div key={suggestion.reference} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="mr-2">{getControlTypeIcon(suggestion.type)}</span>
                        <span className="font-bold text-gray-900">{suggestion.reference}</span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded border ${getPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority}
                        </span>
                      </div>
                      
                      <h5 className="font-semibold text-gray-800 mb-1">{suggestion.title}</h5>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">{suggestion.section}:</span> {suggestion.section_title}
                      </p>
                      <p className="text-sm text-gray-500">
                        Control Type: <span className="capitalize">{suggestion.type}</span>
                      </p>
                    </div>
                    
                    <div className="ml-4">
                      {isAdded ? (
                        <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
                          ✓ Added
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddControl(suggestion)}
                          disabled={isAdding}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isAdding ? 'Adding...' : 'Add Control'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Control Form */}
        {showAddForm && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h5 className="font-semibold text-gray-900 mb-3">Add Custom Control</h5>
            <form onSubmit={handleCustomControlSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Control Reference *
                  </label>
                  <input
                    type="text"
                    value={newControl.control_reference}
                    onChange={(e) => setNewControl(prev => ({ ...prev, control_reference: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., CUSTOM-001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Control Type *
                  </label>
                  <select
                    value={newControl.control_type}
                    onChange={(e) => setNewControl(prev => ({ ...prev, control_type: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="preventive">Preventive</option>
                    <option value="detective">Detective</option>
                    <option value="corrective">Corrective</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Control Title *
                </label>
                <input
                  type="text"
                  value={newControl.control_title}
                  onChange={(e) => setNewControl(prev => ({ ...prev, control_title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter control title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Control Description
                </label>
                <textarea
                  value={newControl.control_description}
                  onChange={(e) => setNewControl(prev => ({ ...prev, control_description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the control implementation"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Implementation Status
                  </label>
                  <select
                    value={newControl.implementation_status}
                    onChange={(e) => setNewControl(prev => ({ ...prev, implementation_status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="planned">Planned</option>
                    <option value="implementing">Implementing</option>
                    <option value="implemented">Implemented</option>
                    <option value="not_applicable">Not Applicable</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Responsible Person
                  </label>
                  <select
                    value={newControl.responsible_person_id}
                    onChange={(e) => setNewControl(prev => ({ ...prev, responsible_person_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select person</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingControl === 'custom'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {addingControl === 'custom' ? 'Adding...' : 'Add Control'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlSuggestionComponent;