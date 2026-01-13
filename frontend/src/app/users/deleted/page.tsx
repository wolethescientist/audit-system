'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Calendar, RotateCcw, AlertCircle } from 'lucide-react';

interface DeletedUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department_id?: string;
  deleted_at: string;
  deleted_by_id?: string;
  deletion_reason?: string;
  is_deleted: boolean;
}

export default function DeletedUsersPage() {
  const queryClient = useQueryClient();

  // Fetch deleted users
  const { data: deletedUsers = [], isLoading, error } = useQuery<DeletedUser[]>({
    queryKey: ['deleted-users'],
    queryFn: async () => {
      const response = await api.get('/users/deleted');
      return response.data;
    }
  });

  // Restore user mutation
  const restoreMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post(`/users/${userId}/restore`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deleted-users'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRestore = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to restore ${userName}?`)) {
      try {
        await restoreMutation.mutateAsync(userId);
        alert(`User ${userName} has been restored successfully.`);
      } catch (err: any) {
        alert(`Error restoring user: ${err.response?.data?.detail || err.message}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">Loading deleted users...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading deleted users. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Deleted Users</h1>
          <p className="text-gray-600 mt-2">View and restore soft-deleted user accounts</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {deletedUsers.length} deleted users
        </Badge>
      </div>

      {deletedUsers.length === 0 ? (
        <Alert>
          <AlertDescription>No deleted users found.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {deletedUsers.map(user => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-gray-100 p-3 rounded-full">
                      <User className="w-8 h-8 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{user.full_name}</h3>
                        <Badge variant="secondary">{user.role.replace('_', ' ')}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Deleted: {formatDate(user.deleted_at)}</span>
                        </div>
                      </div>
                      
                      {user.deletion_reason && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm font-medium text-gray-700 mb-1">Deletion Reason:</p>
                          <p className="text-sm text-gray-600">{user.deletion_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Button
                      onClick={() => handleRestore(user.id, user.full_name)}
                      disabled={restoreMutation.isPending}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore User
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
