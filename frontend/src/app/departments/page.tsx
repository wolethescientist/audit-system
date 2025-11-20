'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Department } from '@/lib/types';

export default function DepartmentsPage() {
  const { data: departments, isLoading } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments/');
      return response.data;
    },
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Departments</h1>
        <button className="btn btn-primary">Add Department</button>
      </div>
      
      {isLoading ? (
        <div className="card">Loading departments...</div>
      ) : (
        <div className="card">
          <div className="space-y-2">
            {departments?.map((dept: any) => (
              <div key={dept.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <h3 className="font-semibold">{dept.name}</h3>
                <p className="text-sm text-gray-500">ID: {dept.id}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
