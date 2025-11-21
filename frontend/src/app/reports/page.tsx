'use client';

export default function ReportsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Audit Reports</h1>
      
      <div className="card">
        <p className="text-gray-600">View and manage audit reports</p>
        <div className="mt-6">
          <p className="text-sm text-gray-500">No reports available</p>
        </div>
      </div>
    </div>
  );
}
