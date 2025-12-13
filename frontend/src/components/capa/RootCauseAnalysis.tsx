'use client';

import React, { useState } from 'react';
import { RootCauseAnalysisUpdate } from '@/lib/types';

interface RootCauseAnalysisProps {
  capaId: string;
  initialData?: {
    root_cause_analysis?: string;
    root_cause_method?: string;
    corrective_action?: string;
    preventive_action?: string;
  };
  onSubmit: (data: RootCauseAnalysisUpdate) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

const ROOT_CAUSE_METHODS = [
  { value: 'five_whys', label: 'Five Whys', description: 'Ask "why" five times to drill down to root cause' },
  { value: 'fishbone', label: 'Fishbone Diagram (Ishikawa)', description: 'Categorize potential causes (People, Process, Equipment, Environment, Materials, Methods)' },
  { value: 'fault_tree', label: 'Fault Tree Analysis', description: 'Top-down deductive analysis of failure modes' },
  { value: 'pareto', label: 'Pareto Analysis', description: '80/20 rule to identify most significant causes' },
  { value: 'brainstorming', label: 'Brainstorming', description: 'Team-based cause identification' },
  { value: 'change_analysis', label: 'Change Analysis', description: 'Analyze what changed before the problem occurred' }
];

const FIVE_WHYS_TEMPLATE = [
  'Why did this problem occur?',
  'Why did that cause happen?',
  'Why did that underlying cause happen?',
  'Why did that deeper cause happen?',
  'Why did that root cause happen?'
];

export default function RootCauseAnalysis({
  capaId,
  initialData,
  onSubmit,
  onCancel,
  readOnly = false
}: RootCauseAnalysisProps) {
  const [formData, setFormData] = useState<RootCauseAnalysisUpdate>({
    root_cause_analysis: initialData?.root_cause_analysis || '',
    root_cause_method: initialData?.root_cause_method || 'five_whys',
    corrective_action: initialData?.corrective_action || '',
    preventive_action: initialData?.preventive_action || ''
  });

  const [fiveWhysAnswers, setFiveWhysAnswers] = useState<string[]>(() => {
    if (initialData?.root_cause_analysis && initialData?.root_cause_method === 'five_whys') {
      try {
        const parsed = JSON.parse(initialData.root_cause_analysis);
        return Array.isArray(parsed) ? parsed : ['', '', '', '', ''];
      } catch {
        return ['', '', '', '', ''];
      }
    }
    return ['', '', '', '', ''];
  });

  const [fishboneCategories, setFishboneCategories] = useState(() => {
    if (initialData?.root_cause_analysis && initialData?.root_cause_method === 'fishbone') {
      try {
        const parsed = JSON.parse(initialData.root_cause_analysis);
        return parsed || {
          people: '',
          process: '',
          equipment: '',
          environment: '',
          materials: '',
          methods: ''
        };
      } catch {
        return {
          people: '',
          process: '',
          equipment: '',
          environment: '',
          materials: '',
          methods: ''
        };
      }
    }
    return {
      people: '',
      process: '',
      equipment: '',
      environment: '',
      materials: '',
      methods: ''
    };
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleMethodChange = (method: string) => {
    setFormData(prev => ({ ...prev, root_cause_method: method }));
    
    // Update root_cause_analysis based on method
    if (method === 'five_whys') {
      setFormData(prev => ({ ...prev, root_cause_analysis: JSON.stringify(fiveWhysAnswers) }));
    } else if (method === 'fishbone') {
      setFormData(prev => ({ ...prev, root_cause_analysis: JSON.stringify(fishboneCategories) }));
    }
  };

  const handleFiveWhysChange = (index: number, value: string) => {
    const newAnswers = [...fiveWhysAnswers];
    newAnswers[index] = value;
    setFiveWhysAnswers(newAnswers);
    
    if (formData.root_cause_method === 'five_whys') {
      setFormData(prev => ({ ...prev, root_cause_analysis: JSON.stringify(newAnswers) }));
    }
  };

  const handleFishboneChange = (category: string, value: string) => {
    const newCategories = { ...fishboneCategories, [category]: value };
    setFishboneCategories(newCategories);
    
    if (formData.root_cause_method === 'fishbone') {
      setFormData(prev => ({ ...prev, root_cause_analysis: JSON.stringify(newCategories) }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.root_cause_analysis.trim()) {
      newErrors.root_cause_analysis = 'Root cause analysis is required';
    }

    if (!formData.root_cause_method) {
      newErrors.root_cause_method = 'Root cause method is required';
    }

    // Validate Five Whys completion
    if (formData.root_cause_method === 'five_whys') {
      const filledAnswers = fiveWhysAnswers.filter(answer => typeof answer === 'string' && answer.trim());
      if (filledAnswers.length < 3) {
        newErrors.five_whys = 'Please answer at least the first 3 "why" questions';
      }
    }

    // Validate Fishbone completion
    if (formData.root_cause_method === 'fishbone') {
      const filledCategories = Object.values(fishboneCategories).filter(value => typeof value === 'string' && value.trim());
      if (filledCategories.length < 2) {
        newErrors.fishbone = 'Please fill in at least 2 categories in the fishbone analysis';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to submit root cause analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFiveWhysTemplate = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Five Whys Methodology</h4>
        <p className="text-sm text-blue-700">
          Start with the problem statement and ask &quot;why&quot; for each answer until you reach the root cause.
          Typically, the root cause is found by the fifth &quot;why.&quot;
        </p>
      </div>
      
      {FIVE_WHYS_TEMPLATE.map((question, index) => (
        <div key={index}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {index + 1}. {question}
          </label>
          <textarea
            value={fiveWhysAnswers[index]}
            onChange={(e) => handleFiveWhysChange(index, e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Answer to why #${index + 1}`}
            readOnly={readOnly}
          />
        </div>
      ))}
      
      {errors.five_whys && (
        <p className="text-sm text-red-600">{errors.five_whys}</p>
      )}
    </div>
  );

  const renderFishboneTemplate = () => (
    <div className="space-y-4">
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">Fishbone Diagram (Ishikawa)</h4>
        <p className="text-sm text-green-700">
          Categorize potential causes into the 6M categories. Consider all possible causes in each category
          that could contribute to the problem.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries({
          people: 'People (Human factors, training, skills)',
          process: 'Process (Procedures, workflows, methods)',
          equipment: 'Equipment (Machines, tools, technology)',
          environment: 'Environment (Conditions, location, culture)',
          materials: 'Materials (Inputs, supplies, information)',
          methods: 'Methods (Techniques, approaches, standards)'
        }).map(([category, description]) => (
          <div key={category}>
            <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
              {category}
            </label>
            <p className="text-xs text-gray-500 mb-1">{description}</p>
            <textarea
              value={fishboneCategories[category as keyof typeof fishboneCategories]}
              onChange={(e) => handleFishboneChange(category, e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Potential causes related to ${category}`}
              readOnly={readOnly}
            />
          </div>
        ))}
      </div>
      
      {errors.fishbone && (
        <p className="text-sm text-red-600">{errors.fishbone}</p>
      )}
    </div>
  );

  const renderGenericTemplate = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Root Cause Analysis <span className="text-red-500">*</span>
      </label>
      <textarea
        value={formData.root_cause_analysis}
        onChange={(e) => setFormData(prev => ({ ...prev, root_cause_analysis: e.target.value }))}
        rows={6}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          errors.root_cause_analysis ? 'border-red-500' : 'border-gray-300'
        }`}
        placeholder="Describe your root cause analysis using the selected method"
        readOnly={readOnly}
      />
      {errors.root_cause_analysis && (
        <p className="mt-1 text-sm text-red-600">{errors.root_cause_analysis}</p>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Root Cause Analysis</h2>
        <div className="text-sm text-gray-500">
          ISO 9001 Clause 10.2.1(b) - Evaluate the need for action
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Root Cause Analysis Method <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.root_cause_method}
            onChange={(e) => handleMethodChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.root_cause_method ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={readOnly}
          >
            {ROOT_CAUSE_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
          {errors.root_cause_method && (
            <p className="mt-1 text-sm text-red-600">{errors.root_cause_method}</p>
          )}
          
          {/* Method Description */}
          <div className="mt-2 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              {ROOT_CAUSE_METHODS.find(m => m.value === formData.root_cause_method)?.description}
            </p>
          </div>
        </div>

        {/* Method-specific Templates */}
        <div>
          {formData.root_cause_method === 'five_whys' && renderFiveWhysTemplate()}
          {formData.root_cause_method === 'fishbone' && renderFishboneTemplate()}
          {!['five_whys', 'fishbone'].includes(formData.root_cause_method) && renderGenericTemplate()}
        </div>

        {/* Actions Based on Root Cause */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Actions Based on Root Cause Analysis</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Corrective Action (Address Root Cause)
            </label>
            <textarea
              value={formData.corrective_action || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, corrective_action: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Based on the root cause analysis, describe specific actions to eliminate the root cause"
              readOnly={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preventive Action (Prevent Recurrence)
            </label>
            <textarea
              value={formData.preventive_action || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, preventive_action: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe actions to prevent similar root causes from occurring in the future"
              readOnly={readOnly}
            />
          </div>
        </div>

        {/* Form Actions */}
        {!readOnly && (
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Root Cause Analysis'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}