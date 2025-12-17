'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Audit } from '@/lib/types';
import { useParams } from 'next/navigation';
import { useState, useRef } from 'react';
import AuditNavigation from '@/components/audit/AuditNavigation';

interface EvidenceFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  uploadedAt: Date;
  uploading?: boolean;
  uploaded?: boolean;
  error?: string;
}

interface Evidence {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  description?: string;
  evidence_type: string;
  created_at: string;
  uploaded_by_id: string;
}

export default function EvidencePage() {
  const params = useParams();
  const auditId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<EvidenceFile[]>([]);
  const [description, setDescription] = useState('');
  const [evidenceType, setEvidenceType] = useState('document');
  const queryClient = useQueryClient();

  const { data: audit } = useQuery<Audit>({
    queryKey: ['audit', auditId],
    queryFn: async () => {
      const response = await api.get(`/audits/${auditId}`);
      return response.data;
    },
  });

  const { data: evidenceList = [], isLoading: loadingEvidence } = useQuery<Evidence[]>({
    queryKey: ['evidence', auditId],
    queryFn: async () => {
      const response = await api.get(`/audits/${auditId}/evidence`);
      return response.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: EvidenceFile) => {
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('description', description);
      formData.append('evidence_type', evidenceType);

      const response = await api.post(
        `/audits/${auditId}/evidence/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence', auditId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (evidenceId: string) => {
      await api.delete(`/audits/${auditId}/evidence/${evidenceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence', auditId] });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: EvidenceFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      uploadedAt: new Date(),
      uploading: false,
      uploaded: false,
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleUploadAll = async () => {
    for (const file of selectedFiles) {
      if (file.uploaded) continue;

      setSelectedFiles(prev =>
        prev.map(f => (f.id === file.id ? { ...f, uploading: true } : f))
      );

      try {
        await uploadMutation.mutateAsync(file);
        setSelectedFiles(prev =>
          prev.map(f =>
            f.id === file.id ? { ...f, uploading: false, uploaded: true } : f
          )
        );
      } catch (error: any) {
        setSelectedFiles(prev =>
          prev.map(f =>
            f.id === file.id
              ? { ...f, uploading: false, error: error.message }
              : f
          )
        );
      }
    }

    // Clear uploaded files after a delay
    setTimeout(() => {
      setSelectedFiles(prev => prev.filter(f => !f.uploaded));
    }, 2000);
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (confirm('Are you sure you want to delete this evidence?')) {
      await deleteMutation.mutateAsync(evidenceId);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-8">
      <AuditNavigation auditId={auditId} audit={audit} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Upload Evidence</h2>
          <p className="text-gray-600 mb-4">Upload audit evidence documents to Supabase Storage</p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Brief description of the evidence"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evidence Type
            </label>
            <select
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="document">Document</option>
              <option value="interview">Interview</option>
              <option value="observation">Observation</option>
              <option value="record">Record</option>
              <option value="photo">Photo</option>
            </select>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.csv"
          />
          
          {selectedFiles.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">Select files to upload</p>
              <button onClick={handleUploadClick} className="btn-primary mt-4">
                Select Files
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </p>
                <button onClick={handleUploadClick} className="btn-secondary text-sm">
                  Add More
                </button>
              </div>
              
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {selectedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        {file.uploading ? (
                          <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : file.uploaded ? (
                          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        {file.error && <p className="text-xs text-red-500">{file.error}</p>}
                      </div>
                    </div>
                    {!file.uploading && !file.uploaded && (
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleUploadAll}
                disabled={selectedFiles.every(f => f.uploaded) || selectedFiles.some(f => f.uploading)}
                className="btn-primary w-full"
              >
                {selectedFiles.some(f => f.uploading) ? 'Uploading...' : 'Upload to Supabase'}
              </button>
            </div>
          )}
        </div>

        {/* Evidence List Section */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Uploaded Evidence</h2>
          <p className="text-gray-600 mb-4">
            {evidenceList.length} file{evidenceList.length !== 1 ? 's' : ''} uploaded
          </p>

          {loadingEvidence ? (
            <div className="text-center py-8">
              <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : evidenceList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p>No evidence uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {evidenceList.map((evidence) => (
                <div key={evidence.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {evidence.mime_type?.startsWith('image/') ? (
                        <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : evidence.mime_type?.includes('pdf') ? (
                        <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{evidence.file_name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(evidence.file_size)} • {evidence.evidence_type}
                      </p>
                      {evidence.description && (
                        <p className="text-xs text-gray-600 truncate">{evidence.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={evidence.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 p-1"
                      title="View file"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </a>
                    <button
                      onClick={() => handleDeleteEvidence(evidence.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete file"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
