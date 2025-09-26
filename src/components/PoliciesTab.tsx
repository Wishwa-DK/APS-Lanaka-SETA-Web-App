'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Plus, Edit3, Trash2, Eye, Download, Upload, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import PolicySync from '../utils/PolicySync'
import { downloadPolicyPDF } from '../utils/pdfGenerator'

interface Policy {
  id: string
  title: string
  description: string
  content: string
  version: string
  createdDate: string
  updatedDate: string
  status: 'draft' | 'active' | 'archived'
  category: string
  acknowledgedBy: string[]
  totalUsers: number
  userAcknowledged?: boolean
  isNew?: boolean
  // New acknowledgment tracking fields
  acknowledgmentPercentage?: number
  hasViewed?: boolean
  hasDownloaded?: boolean
  isFullyAcknowledged?: boolean
  acknowledgmentStatus?: 'not_started' | 'partial' | 'completed'
}

interface PoliciesTabProps {
  user: {
    id: string
    name: string
    email: string
    role: 'admin' | 'manager' | 'employee'
    department: string
  }
}

const PoliciesTab: React.FC<PoliciesTabProps> = ({ user }) => {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState('')
  const [downloadingPolicyId, setDownloadingPolicyId] = useState<string | null>(null)

  // Track policy view (50% acknowledgment)
  const trackPolicyView = async (policyId: string) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch(`/api/policies/${policyId}/track-view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`👀 Policy view tracked: ${result.acknowledgmentPercentage}% acknowledged`)
        
        // Update the policy in the local state
        setPolicies(prevPolicies => 
          prevPolicies.map(policy => 
            policy.id === policyId 
              ? {
                  ...policy,
                  acknowledgmentPercentage: result.acknowledgmentPercentage,
                  hasViewed: result.hasViewed,
                  hasDownloaded: result.hasDownloaded,
                  isFullyAcknowledged: result.isFullyAcknowledged,
                  userAcknowledged: result.acknowledgmentPercentage > 0
                }
              : policy
          )
        )
      }
    } catch (error) {
      console.error('Error tracking policy view:', error)
    }
  }

  // 🔧 RBAC Debug: Force clear cache and re-authenticate
  const handleForceReauth = () => {
    console.log('🧹 Forcing re-authentication to fix RBAC issues...')
    localStorage.removeItem('authToken')
    localStorage.removeItem('userInfo')
    sessionStorage.clear()
    alert('Authentication cleared. Please refresh the page and log in again.')
    window.location.reload()
  }

  // Fetch policies function  
  const fetchPolicies = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        console.error('No auth token found')
        return
      }

      // 🔍 DEBUG: Decode and log token info to identify RBAC issues
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]))
        console.log('🔍 Employee RBAC DEBUG - Current user from token:', {
          email: tokenPayload.email,
          role: tokenPayload.role,
          department: tokenPayload.department,
          tokenExp: new Date(tokenPayload.exp * 1000).toISOString()
        })
      } catch (e) {
        console.warn('Could not decode token for debugging')
      }

      console.log('🔄 Employee: Fetching policies...')
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
        console.log(`🔍 RBAC DEBUG - Received ${policiesData.length} policies from backend:`)
        policiesData.forEach((policy: any, index: number) => {
          const depts = policy.targetAudience?.departments || []
          const allUsers = policy.targetAudience?.allUsers
          console.log(`   ${index + 1}. "${policy.title}" (target: ${allUsers ? 'ALL USERS' : depts.join(',') || 'unknown'})`)
        })
        
        // Transform API data to match our Policy interface
        const transformedPolicies: Policy[] = policiesData.map((policy: any) => ({
          id: policy._id,
          title: policy.title,
          description: policy.description,
          content: policy.content,
          version: policy.version || '1.0',
          createdDate: new Date(policy.createdAt).toISOString().split('T')[0],
          updatedDate: new Date(policy.updatedAt).toISOString().split('T')[0],
          status: policy.status === 'published' ? 'active' : policy.status,
          category: policy.category,
          acknowledgedBy: policy.acknowledgments?.map((ack: any) => ack.user) || [],
          totalUsers: 150, // This should come from API eventually
          userAcknowledged: policy.userAcknowledged || false,
          // New acknowledgment tracking data
          acknowledgmentPercentage: policy.acknowledgmentPercentage || 0,
          hasViewed: policy.hasViewed || false,
          hasDownloaded: policy.hasDownloaded || false,
          isFullyAcknowledged: policy.isFullyAcknowledged || false,
          acknowledgmentStatus: policy.acknowledgmentStatus || 'not_started'
        }))
        
        setPolicies(transformedPolicies)
        setLastUpdateTime(new Date().toLocaleTimeString())
        console.log(`✅ Employee: Loaded ${transformedPolicies.length} policies`)
        
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

    // Subscribe to policy sync updates from admin changes
    const unsubscribe = PolicySync.getInstance().subscribe(() => {
      console.log('📡 Employee: Received sync update from admin, refreshing policies...')
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

  // Handle policy download as PDF
  const handleDownloadPolicy = async (policy: Policy) => {
    try {
      setDownloadingPolicyId(policy.id)
      
      // Prepare user info for the PDF
      const userInfo = {
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role
      }

      // Generate and download the PDF
      downloadPolicyPDF(policy, userInfo)
      
      // Track download in backend (now with acknowledgment tracking)
      try {
        const token = localStorage.getItem('authToken')
        if (token) {
          const response = await fetch(`/api/policies/${policy.id}/track-download`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const result = await response.json()
            console.log(`📄 Download tracked: ${result.acknowledgmentPercentage}% acknowledged`)
            
            // Update the policy in the local state with new acknowledgment data
            setPolicies(prevPolicies => 
              prevPolicies.map(p => 
                p.id === policy.id 
                  ? {
                      ...p,
                      acknowledgmentPercentage: result.acknowledgmentPercentage,
                      hasViewed: result.hasViewed,
                      hasDownloaded: result.hasDownloaded,
                      isFullyAcknowledged: result.isFullyAcknowledged,
                      userAcknowledged: result.acknowledgmentPercentage > 0
                    }
                  : p
              )
            )
          }
        }
      } catch (trackError) {
        // Don't block download if tracking fails
        console.log('Download tracking failed:', trackError)
      }

      // Show success message
      console.log(`✅ Policy "${policy.title}" downloaded successfully as PDF`)
      
    } catch (error) {
      console.error('Error downloading policy:', error)
      alert('Failed to download policy. Please try again.')
    } finally {
      setDownloadingPolicyId(null)
    }
  }

  const getAcknowledgmentRate = (policy: Policy) => {
    return Math.round((policy.acknowledgedBy.length / policy.totalUsers) * 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'draft':
        return 'text-yellow-600 bg-yellow-100'
      case 'archived':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />
      case 'draft':
        return <Clock className="h-4 w-4" />
      case 'archived':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const handleViewPolicy = (policy: Policy) => {
    setSelectedPolicy(policy)
    setShowPolicyModal(true)
    setIsEditing(false)
    
    // Track policy view (50% acknowledgment) - only for non-admin users
    if (user.role !== 'admin') {
      trackPolicyView(policy.id)
    }
  }

  const handleEditPolicy = (policy: Policy) => {
    setSelectedPolicy(policy)
    setShowPolicyModal(true)
    setIsEditing(true)
  }

  const handleDeletePolicy = async (policyId: string) => {
    if (window.confirm('Are you sure you want to delete this policy?')) {
      // In real app, this would be an API call
      setPolicies(policies.filter(p => p.id !== policyId))
    }
  }

  const handleSavePolicy = (policyData: Partial<Policy>) => {
    if (isEditing && selectedPolicy) {
      // Update existing policy
      const updatedPolicies = policies.map(p => 
        p.id === selectedPolicy.id 
          ? { ...p, ...policyData, updatedDate: new Date().toISOString().split('T')[0] }
          : p
      )
      setPolicies(updatedPolicies)
    } else {
      // Create new policy
      const newPolicy: Policy = {
        id: Date.now().toString(),
        title: policyData.title || '',
        description: policyData.description || '',
        content: policyData.content || '',
        version: '1.0',
        createdDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0],
        status: 'draft',
        category: policyData.category || 'General',
        acknowledgedBy: [],
        totalUsers: 150
      }
      setPolicies([...policies, newPolicy])
    }
    setShowPolicyModal(false)
    setSelectedPolicy(null)
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading policies...</span>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Policies</h1>
            <p className="text-gray-600 mt-1">
              Company policies and procedures for cybersecurity and compliance
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleForceReauth}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <AlertCircle className="h-4 w-4" />
              <span>Fix RBAC Issue</span>
            </button>
            <button
              onClick={() => fetchPolicies(true)}
              disabled={refreshing}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => {
                  setSelectedPolicy(null)
                  setIsEditing(false)
                  setShowPolicyModal(true)
                }}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Policy</span>
              </button>
            )}
          </div>
        </div>

        {/* Policy Introduction */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <FileText className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
            <div className="ml-3">
              <h2 className="font-semibold text-gray-900 mb-2">Company Policies</h2>
              <p className="text-gray-700 text-sm">
                Review and acknowledge company policies to maintain compliance. All employees must read and acknowledge policies within the specified timeframe.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Policies</h2>
        {policies.map((policy) => (
          <div key={policy.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(policy.status)} flex-shrink-0`}>
                    {getStatusIcon(policy.status)}
                    <span className="ml-1 capitalize">{policy.status}</span>
                  </span>
                  {policy.isNew && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200">
                      ✨ New
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-primary-600 transition-colors cursor-pointer">{policy.title}</h3>
                {user.role !== 'admin' && (
                  <div className="mb-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      policy.acknowledgmentPercentage === 100 ? 'bg-green-100 text-green-700 border border-green-200' :
                      policy.acknowledgmentPercentage === 50 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {policy.acknowledgmentPercentage === 100 ? '✅ Complete' :
                       policy.acknowledgmentPercentage === 50 ? '⏳ In Progress' : '📋 Not Started'}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500 font-medium">Version: {policy.version}</span>
                </div>
                <p className="text-gray-600 mb-3 text-sm leading-relaxed line-clamp-2">
                  {policy.description && policy.description.length > 120 
                    ? `${policy.description.substring(0, 120)}...` 
                    : policy.description}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Category:</span> {policy.category}
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span> {new Date(policy.updatedDate).toLocaleDateString()}
                  </div>
                  <div>
                    {user.role === 'admin' ? (
                      <>
                        <span className="font-medium">Overall Rate:</span> 
                        <span className={`ml-1 font-medium ${getAcknowledgmentRate(policy) >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                          {getAcknowledgmentRate(policy)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium">Your Progress:</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center space-x-1">
                            <div className={`w-3 h-3 rounded-full ${
                              policy.acknowledgmentPercentage === 100 ? 'bg-green-500' :
                              policy.acknowledgmentPercentage === 50 ? 'bg-yellow-500' : 'bg-gray-300'
                            }`}></div>
                            <span className={`text-xs font-medium ${
                              policy.acknowledgmentPercentage === 100 ? 'text-green-700' :
                              policy.acknowledgmentPercentage === 50 ? 'text-yellow-700' : 'text-gray-500'
                            }`}>
                              {policy.acknowledgmentPercentage || 0}%
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs">
                            {policy.hasViewed && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                👀 Viewed
                              </span>
                            )}
                            {policy.hasDownloaded && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                📄 Downloaded
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => handleViewPolicy(policy)}
                  className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Policy</span>
                </button>
                <button 
                  onClick={() => handleDownloadPolicy(policy)}
                  disabled={downloadingPolicyId === policy.id}
                  className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm"
                >
                  {downloadingPolicyId === policy.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>{downloadingPolicyId === policy.id ? 'Generating...' : 'Download PDF'}</span>
                </button>
                {user.role === 'admin' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditPolicy(policy)}
                      className="flex items-center justify-center space-x-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeletePolicy(policy.id)}
                      className="flex items-center justify-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Policy Modal */}
      {showPolicyModal && (
        <PolicyModal
          policy={selectedPolicy}
          isEditing={isEditing}
          onClose={() => {
            setShowPolicyModal(false)
            setSelectedPolicy(null)
            setIsEditing(false)
          }}
          onSave={handleSavePolicy}
        />
      )}
    </div>
  )
}

// Policy Modal Component
interface PolicyModalProps {
  policy: Policy | null
  isEditing: boolean
  onClose: () => void
  onSave: (policyData: Partial<Policy>) => void
}

const PolicyModal: React.FC<PolicyModalProps> = ({ policy, isEditing, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: policy?.title || '',
    description: policy?.description || '',
    content: policy?.content || '',
    category: policy?.category || 'General'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? (policy ? 'Edit Policy' : 'Create New Policy') : 'View Policy'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Policy Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Security">Security</option>
                <option value="Privacy">Privacy</option>
                <option value="Training">Training</option>
                <option value="Compliance">Compliance</option>
                <option value="General">General</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Policy Content (Markdown)</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                placeholder="Enter policy content in Markdown format..."
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                {policy ? 'Update Policy' : 'Create Policy'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {policy?.content}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PoliciesTab