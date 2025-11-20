'use client';

import Sidebar from '@/components/Sidebar';

export default function FollowupsPage() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Follow-ups</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Action Items</h2>
          <p className="text-gray-600">Track corrective actions and follow-up items</p>
        </div>
      </div>
    </div>
  );
}
