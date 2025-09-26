'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Download, Calendar, Users, FileText, RefreshCw } from 'lucide-react'
import PolicySync from '../utils/PolicySync'

interface Policy {
  id: string
  title: string
  description: string
  department: string
  dateFrom: string
  dateTo: string
  uploadDate: string
  pdfFile?: File | null
  pdfUrl?: string
  status: 'active' | 'draft' | 'expired'
  acknowledgments: number
  totalUsers: number
}

interface AdminPolicyTabProps {
  onClose?: () => void
}

const AdminPolicyTab: React.FC<AdminPolicyTabProps> = ({ onClose }) => {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('')

  // Fetch policies from API
  const fetchPolicies = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        console.error('No auth token found')
        return
      }

      console.log('🔄 Admin: Fetching policies...')
      const response = await fetch('/api/policies', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // Add cache busting to ensure fresh data
        cache: 'no-cache'
      })

      if (response.ok) {
        const policiesData = await response.json()
        console.log('✅ Admin: Fetched', policiesData.length, 'policies')
        
        // Transform API data to match our Policy interface for admin view
        const transformedPolicies: Policy[] = policiesData.map((policy: any) => ({
          id: policy._id,
          title: policy.title,
          description: policy.description,
          department: policy.targetAudience?.departments?.join(', ') || 'All Departments',
          dateFrom: new Date(policy.effectiveDate).toISOString().split('T')[0],
          dateTo: new Date(policy.reviewDate).toISOString().split('T')[0],
          uploadDate: new Date(policy.createdAt).toISOString().split('T')[0],
          pdfUrl: policy.attachments?.[0]?.path || undefined,
          status: policy.status === 'published' ? 'active' : policy.status,
          acknowledgments: policy.acknowledgmentCount || 0,
          totalUsers: 60 // This should come from API eventually
        }))
        
        setPolicies(transformedPolicies)
        setLastUpdateTime(new Date().toLocaleTimeString())
        
        // Update sync timestamp
        PolicySync.getInstance().updateLastFetchTime()
      } else {
        console.error('Failed to fetch policies:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching policies:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Set up policy synchronization
  useEffect(() => {
    fetchPolicies()

    // Subscribe to policy sync updates
    const unsubscribe = PolicySync.getInstance().subscribe(() => {
      console.log('📡 Admin: Received sync update, refreshing policies...')
      fetchPolicies(true)
    })

    // Auto-refresh every 60 seconds (reduced frequency since we have real-time sync)
    const interval = setInterval(() => {
      fetchPolicies(true)
    }, 60000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])



  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    dateFrom: '',
    dateTo: '',
    pdfFile: null as File | null
  })

  const departments = [
    'All Departments',
    'IT',
    'HR',
    'Finance',
    'Operations',
    'Marketing',
    'Security'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData(prev => ({ ...prev, pdfFile: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        alert('Authentication required. Please log in again.')
        return
      }

      // Prepare policy data for API
      const departmentList = formData.department === 'All Departments' 
        ? [] 
        : formData.department.split(',').map(d => d.trim())

      const policyData = {
        title: formData.title,
        description: formData.description,
        content: `${formData.description}\n\nThis policy is effective from ${formData.dateFrom} to ${formData.dateTo}.`,
        category: 'information_security', // Default category
        priority: 'medium',
        targetAudience: {
          departments: departmentList,
          roles: [],
          specificUsers: [],
          allUsers: departmentList.length === 0
        },
        acknowledgmentRequired: true
      }

      const isEditing = !!editingPolicy
      const url = isEditing ? `/api/policies/${editingPolicy.id}` : '/api/policies'
      const method = isEditing ? 'PUT' : 'POST'
      
      console.log(`${isEditing ? 'Updating' : 'Creating'} policy:`, policyData)
      console.log(`Making ${method} request to: ${url}`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policyData),
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (response.ok) {
        const savedPolicy = await response.json()
        console.log(`Policy ${isEditing ? 'updated' : 'created'} successfully:`, savedPolicy)
        
        // Transform policy data
        const policyForState: Policy = {
          id: savedPolicy._id,
          title: savedPolicy.title,
          description: savedPolicy.description,
          department: formData.department,
          dateFrom: formData.dateFrom,
          dateTo: formData.dateTo,
          uploadDate: isEditing ? editingPolicy.uploadDate : new Date().toISOString().split('T')[0],
          pdfFile: formData.pdfFile,
          pdfUrl: formData.pdfFile ? URL.createObjectURL(formData.pdfFile) : undefined,
          status: 'active',
          acknowledgments: 0,
          totalUsers: 60
        }

        if (isEditing) {
          // Update existing policy in state
          setPolicies(prev => prev.map(p => p.id === editingPolicy.id ? policyForState : p))
          alert('✅ Policy updated successfully! Changes will appear in user dashboards.')
        } else {
          // Add new policy to state
          setPolicies(prev => [policyForState, ...prev])
          alert('✅ Policy created successfully! It will now appear in user dashboards.')
        }
        
        // Trigger sync to other tabs/sessions
        PolicySync.getInstance().notifyPolicyUpdate()
      } else {
        try {
          const errorData = await response.json()
          console.error(`Failed to ${isEditing ? 'update' : 'create'} policy:`, errorData)
          
          // Handle specific error cases
          if (response.status === 403) {
            alert(`❌ Permission Denied: ${errorData.error || 'Admin access required'}\n\nPlease ensure you are logged in as an admin user.`)
          } else if (response.status === 401) {
            alert(`❌ Authentication Error: ${errorData.error || 'Please log in again'}\n\nYour session may have expired.`)
          } else if (response.status === 404) {
            alert(`❌ Not Found: ${errorData.error || 'Policy not found'}\n\nThe policy may have been deleted.`)
          } else {
            alert(`❌ Failed to ${isEditing ? 'update' : 'create'} policy: ${errorData.error || 'Unknown error'}`)
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          alert(`❌ ${isEditing ? 'Update' : 'Create'} failed with status ${response.status}: ${response.statusText}\n\nPlease check your connection and try again.`)
        }
      }
    } catch (error) {
      const operation = editingPolicy ? 'updating' : 'creating'
      console.error(`Error ${operation} policy:`, error)
      if (error instanceof Error && error.name === 'AbortError') {
        alert(`${editingPolicy ? 'Update' : 'Create'} operation timed out. The server might be slow. Please try again.`)
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('Network connection error. Please check if the server is running.')
      } else if (error instanceof Error) {
        alert(`${editingPolicy ? 'Update' : 'Create'} error: ${error.message}`)
      } else {
        alert(`An unexpected error occurred during ${editingPolicy ? 'update' : 'creation'}.`)
      }
    }

    // Reset form
    setFormData({
      title: '',
      description: '',
      department: '',
      dateFrom: '',
      dateTo: '',
      pdfFile: null
    })
    setShowUploadModal(false)
    setEditingPolicy(null)
  }

  const handleEdit = (policy: Policy) => {
    setEditingPolicy(policy)
    setFormData({
      title: policy.title,
      description: policy.description,
      department: policy.department,
      dateFrom: policy.dateFrom,
      dateTo: policy.dateTo,
      pdfFile: policy.pdfFile || null
    })
    setShowUploadModal(true)
  }

  const handleDelete = async (policyId: string) => {
    if (confirm('Are you sure you want to delete this policy? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) {
          alert('Authentication required. Please log in again.')
          return
        }

        console.log(`🗑️ Deleting policy ${policyId}...`)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        const response = await fetch(`/api/policies/${policyId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        console.log(`Delete response status: ${response.status}`)

        if (response.ok) {
          const result = await response.json()
          console.log('Policy deleted:', result)
          
          // Remove from local state
          setPolicies(prev => prev.filter(p => p.id !== policyId))
          
          alert('✅ Policy deleted successfully! It will no longer appear in user dashboards.')
          
          // Trigger sync to other tabs/sessions
          PolicySync.getInstance().notifyPolicyUpdate()
        } else {
          try {
            const errorData = await response.json()
            console.error('Failed to delete policy:', errorData)
            alert(`Failed to delete policy: ${errorData.error || 'Unknown error'}`)
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError)
            alert(`Delete failed with status ${response.status}: ${response.statusText}`)
          }
        }
      } catch (error) {
        console.error('Error deleting policy:', error)
        if (error instanceof Error && error.name === 'AbortError') {
          alert('Delete operation timed out. The server might be slow. Please try again.')
        } else if (error instanceof TypeError && error.message.includes('fetch')) {
          alert('Network connection error. Please check if the server is running.')
        } else if (error instanceof Error) {
          alert(`Delete error: ${error.message}`)
        } else {
          alert('An unexpected error occurred during deletion.')
        }
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800 border-green-200',
      draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      expired: 'bg-red-100 text-red-800 border-red-200'
    }
    return badges[status as keyof typeof badges] || badges.active
  }

  const getCompliancePercentage = (acknowledgments: number, totalUsers: number) => {
    return Math.round((acknowledgments / totalUsers) * 100)
  }

  return (
    <div className="p-8 bg-gradient-to-br from-red-50 to-red-100 min-h-full">
      {/* Enhanced Header with Upload Button */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex-1">
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Policy Management</h2>
              <p className="text-gray-600 text-lg">Create, manage and monitor company policies</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mt-2">
            {refreshing && (
              <div className="flex items-center text-red-600 bg-red-100 px-3 py-1 rounded-full text-sm border border-red-200">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Syncing policies...
              </div>
            )}
            {lastUpdateTime && !refreshing && (
              <div className="bg-white bg-opacity-70 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-gray-600 border border-white">
                Last updated: {lastUpdateTime}
              </div>
            )}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
              {policies.length} Active Policies
            </div>
          </div>
        </div>
        
        <button
          onClick={() => {
            setEditingPolicy(null)
            setFormData({
              title: '',
              description: '',
              department: '',
              dateFrom: '',
              dateTo: '',
              pdfFile: null
            })
            setShowUploadModal(true)
          }}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Policy
        </button>
      </div>

      {/* Enhanced Policies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {policies.map((policy) => (
          <div key={policy.id} className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl border border-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-102 overflow-hidden">
            {/* Policy Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white mb-1 truncate">{policy.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex-shrink-0 ${getStatusBadge(policy.status)}`}>
                      {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                    </span>
                    <span className="text-red-100 text-sm">
                      {getCompliancePercentage(policy.acknowledgments, policy.totalUsers)}% Compliance
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-1 ml-3">
                  {policy.pdfUrl && (
                    <button
                      onClick={() => window.open(policy.pdfUrl, '_blank')}
                      className="p-2 text-red-100 hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(policy)}
                    className="p-2 text-red-100 hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
                    title="Edit Policy"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(policy.id)}
                    className="p-2 text-red-100 hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
                    title="Delete Policy"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Policy Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-4 text-sm leading-relaxed line-clamp-3">
                {policy.description && policy.description.length > 120 
                  ? `${policy.description.substring(0, 120)}...` 
                  : policy.description}
              </p>
              
              <div className="grid grid-cols-1 gap-3 text-sm mb-4">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center text-gray-700">
                    <Users className="w-4 h-4 mr-2 text-red-500" />
                    <span className="font-medium">Department:</span>
                  </div>
                  <span className="text-gray-600 font-semibold">{policy.department}</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-4 h-4 mr-2 text-red-500" />
                    <span className="font-medium">Duration:</span>
                  </div>
                  <span className="text-gray-600 text-xs font-semibold">{policy.dateFrom} to {policy.dateTo}</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center text-gray-700">
                    <FileText className="w-4 h-4 mr-2 text-red-500" />
                    <span className="font-medium">Created:</span>
                  </div>
                  <span className="text-gray-600 text-xs font-semibold">{policy.uploadDate}</span>
                </div>
              </div>

              {/* Enhanced Compliance Progress */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">Acknowledgment Progress</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900">
                      {getCompliancePercentage(policy.acknowledgments, policy.totalUsers)}%
                    </span>
                    <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full">
                      {policy.acknowledgments}/{policy.totalUsers}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${getCompliancePercentage(policy.acknowledgments, policy.totalUsers)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Upload/Edit Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold">
                  {editingPolicy ? 'Edit Policy' : 'Create New Policy'}
                </h3>
              </div>
              <p className="text-red-100 mt-2">
                {editingPolicy ? 'Update policy information and settings' : 'Add a new cybersecurity policy to the system'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Policy Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50 transition-all"
                    placeholder="Enter comprehensive policy title"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Policy Description *
                  </label>
                  <textarea
                    name="description"
                    required
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50 transition-all resize-none"
                    placeholder="Provide detailed description of the policy objectives and requirements"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Target Department *
                  </label>
                  <select
                    name="department"
                    required
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50 transition-all"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Policy PDF Document
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50 transition-all"
                    />
                    <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded-lg border border-blue-200">
                      <span className="font-semibold">📎 Optional:</span> Upload PDF (max 10MB) for detailed policy documentation
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Effective From *
                  </label>
                  <input
                    type="date"
                    name="dateFrom"
                    required
                    value={formData.dateFrom}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Effective Until *
                  </label>
                  <input
                    type="date"
                    name="dateTo"
                    required
                    value={formData.dateTo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50 transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false)
                    setEditingPolicy(null)
                  }}
                  className="px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all font-semibold"
                >
                  {editingPolicy ? '✅ Update Policy' : '🚀 Create Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPolicyTab