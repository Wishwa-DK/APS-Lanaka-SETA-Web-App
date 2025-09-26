'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Policy {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  effectiveDate: string;
  userAcknowledged: boolean;
  acknowledgmentRequired: boolean;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

export default function PoliciesDashboard() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/policies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      } else {
        console.error('Failed to fetch policies');
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgePolicy = async (policyId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/policies/${policyId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Refresh policies to update acknowledgment status
        fetchPolicies();
        alert('Policy acknowledged successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to acknowledge policy');
      }
    } catch (error) {
      console.error('Error acknowledging policy:', error);
      alert('Failed to acknowledge policy');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading policies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Policy Dashboard</h1>
              <p className="mt-1 text-gray-600">
                Welcome, {user?.firstName} {user?.lastName} ({user?.department})
              </p>
            </div>
            <div className="flex space-x-4">
              {user?.role === 'admin' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  router.push('/login');
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Policies</h3>
            <p className="text-3xl font-bold text-blue-600">{policies.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Acknowledged</h3>
            <p className="text-3xl font-bold text-green-600">
              {policies.filter(p => p.userAcknowledged).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
            <p className="text-3xl font-bold text-orange-600">
              {policies.filter(p => p.acknowledgmentRequired && !p.userAcknowledged).length}
            </p>
          </div>
        </div>

        {/* Policies List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Policies Available to You
            </h2>
            <p className="text-gray-600">
              These policies are targeted to your department ({user?.department}) and role ({user?.role})
            </p>
          </div>

          {policies.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No policies available for your department/role.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {policies.map((policy) => (
                <div key={policy._id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {policy.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(policy.priority)}`}>
                          {policy.priority.toUpperCase()}
                        </span>
                        {policy.userAcknowledged && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            ✓ ACKNOWLEDGED
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">{policy.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Category: {policy.category.replace('_', ' ').toUpperCase()}</span>
                        <span>•</span>
                        <span>Effective: {formatDate(policy.effectiveDate)}</span>
                        <span>•</span>
                        <span>Created by: {policy.createdBy.firstName} {policy.createdBy.lastName}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => router.push(`/policies/${policy._id}`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                      >
                        View Details
                      </button>
                      
                      {policy.acknowledgmentRequired && !policy.userAcknowledged && (
                        <button
                          onClick={() => acknowledgePolicy(policy._id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
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