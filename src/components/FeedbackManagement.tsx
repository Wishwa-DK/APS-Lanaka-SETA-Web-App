'use client'

import React, { useState } from 'react'
import { Download, MessageSquare, Clock, CheckCircle, AlertCircle, Filter } from 'lucide-react'

interface Feedback {
  id: string
  userId: string
  userName: string
  userEmail: string
  department: string
  message: string
  category: 'bug' | 'suggestion' | 'complaint' | 'compliment' | 'question'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  timestamp: string
  status: 'pending' | 'reviewed' | 'responded' | 'resolved'
  adminResponse?: string
  responseDate?: string
  responseBy?: string
}

interface FeedbackManagementProps {
  onClose: () => void
}

const FeedbackManagement: React.FC<FeedbackManagementProps> = ({ onClose }) => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed' | 'responded' | 'resolved'>('all')
  const [filterCategory, setFilterCategory] = useState<'all' | 'bug' | 'suggestion' | 'complaint' | 'compliment' | 'question'>('all')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [responseText, setResponseText] = useState('')

  // Mock feedback data - ordered by timestamp (newest first)
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([
    {
      id: '1',
      userId: '2',
      userName: 'Jane Smith',
      userEmail: 'jane@apslanka.lk',
      department: 'HR',
      message: 'The new password policy is quite complex. Could we have some guidance on creating compliant passwords? It would be helpful to have examples or a password generator tool.',
      category: 'suggestion',
      priority: 'medium',
      timestamp: '2025-09-22 14:30:00',
      status: 'pending'
    },
    {
      id: '2',
      userId: '3',
      userName: 'Mike Johnson',
      userEmail: 'mike@apslanka.lk',
      department: 'Finance',
      message: 'I completed Module 2 but the quiz results are not showing up in my dashboard. Please check this technical issue.',
      category: 'bug',
      priority: 'high',
      timestamp: '2025-09-22 13:15:00',
      status: 'reviewed',
      adminResponse: 'We have identified the issue and are working on a fix. Your quiz results have been manually updated.',
      responseDate: '2025-09-22 15:30:00',
      responseBy: 'Admin User'
    },
    {
      id: '3',
      userId: '1',
      userName: 'John Doe',
      userEmail: 'john@apslanka.lk',
      department: 'IT',
      message: 'Great training content! The phishing simulation was very realistic and educational. Really helped me understand the threats.',
      category: 'compliment',
      priority: 'low',
      timestamp: '2025-09-22 11:45:00',
      status: 'responded',
      adminResponse: 'Thank you for the positive feedback! We are glad you found the training valuable.',
      responseDate: '2025-09-22 12:00:00',
      responseBy: 'Admin User'
    },
    {
      id: '4',
      userId: '6',
      userName: 'Lisa Garcia',
      userEmail: 'lisa@apslanka.lk',
      department: 'Marketing',
      message: 'The cybersecurity training videos are loading slowly. Is there a technical issue? Sometimes they freeze completely.',
      category: 'bug',
      priority: 'urgent',
      timestamp: '2025-09-22 10:20:00',
      status: 'pending'
    },
    {
      id: '5',
      userId: '4',
      userName: 'Sarah Wilson',
      userEmail: 'sarah@apslanka.lk',
      department: 'Operations',
      message: 'Suggestion: Add more real-world examples in the social engineering module. Current examples are good but more variety would help.',
      category: 'suggestion',
      priority: 'medium',
      timestamp: '2025-09-21 16:30:00',
      status: 'reviewed'
    },
    {
      id: '6',
      userId: '7',
      userName: 'Alex Johnson',
      userEmail: 'alex@apslanka.lk',
      department: 'IT',
      message: 'Why do I need to complete the same training modules multiple times? This seems redundant and wastes time.',
      category: 'complaint',
      priority: 'medium',
      timestamp: '2025-09-21 14:45:00',
      status: 'pending'
    },
    {
      id: '7',
      userId: '8',
      userName: 'David Brown',
      userEmail: 'david@apslanka.lk',
      department: 'Security',
      message: 'Can we get mobile access to the training platform? It would be convenient to complete modules on mobile devices during commute.',
      category: 'question',
      priority: 'low',
      timestamp: '2025-09-21 09:15:00',
      status: 'resolved',
      adminResponse: 'We are planning to release a mobile app version in Q1 2026. For now, the platform is responsive on mobile browsers.',
      responseDate: '2025-09-21 10:30:00',
      responseBy: 'Admin User'
    },
    {
      id: '8',
      userId: '5',
      userName: 'Wishwa Perera',
      userEmail: 'wishwa@apslanka.lk',
      department: 'HR',
      message: 'The compliance dashboard is excellent! Very clear visualization of progress. Small suggestion: add export functionality for individual progress reports.',
      category: 'compliment',
      priority: 'low',
      timestamp: '2025-09-20 15:30:00',
      status: 'responded',
      adminResponse: 'Thank you! Export functionality is already available in the compliance section. We will add more visibility to this feature.',
      responseDate: '2025-09-20 16:45:00',
      responseBy: 'Admin User'
    }
  ])

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
      responded: 'bg-green-100 text-green-800 border-green-200',
      resolved: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return badges[status as keyof typeof badges] || badges.pending
  }

  const getCategoryBadge = (category: string) => {
    const badges = {
      bug: 'bg-red-100 text-red-800',
      suggestion: 'bg-purple-100 text-purple-800',
      complaint: 'bg-orange-100 text-orange-800',
      compliment: 'bg-green-100 text-green-800',
      question: 'bg-blue-100 text-blue-800'
    }
    return badges[category as keyof typeof badges] || badges.question
  }

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    }
    return badges[priority as keyof typeof badges] || badges.medium
  }

  const getFilteredFeedback = () => {
    return feedbackList.filter(feedback => {
      const statusMatch = filterStatus === 'all' || feedback.status === filterStatus
      const categoryMatch = filterCategory === 'all' || feedback.category === filterCategory
      return statusMatch && categoryMatch
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const handleRespond = (feedback: Feedback) => {
    setSelectedFeedback(feedback)
    setResponseText(feedback.adminResponse || '')
  }

  const submitResponse = () => {
    if (!selectedFeedback || !responseText.trim()) return

    const updatedFeedback = feedbackList.map(feedback => 
      feedback.id === selectedFeedback.id 
        ? {
            ...feedback,
            status: 'responded' as const,
            adminResponse: responseText,
            responseDate: new Date().toISOString(),
            responseBy: 'Admin User'
          }
        : feedback
    )

    setFeedbackList(updatedFeedback)
    setSelectedFeedback(null)
    setResponseText('')
  }

  const markAsReviewed = (feedbackId: string) => {
    const updatedFeedback = feedbackList.map(feedback => 
      feedback.id === feedbackId 
        ? { ...feedback, status: 'reviewed' as const }
        : feedback
    )
    setFeedbackList(updatedFeedback)
  }

  const generateReport = async () => {
    setIsGeneratingReport(true)
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Create CSV content
    const csvHeaders = [
      'Feedback ID',
      'User Name',
      'Email',
      'Department',
      'Category',
      'Priority',
      'Status',
      'Message',
      'Timestamp',
      'Admin Response',
      'Response Date',
      'Response By'
    ].join(',')
    
    const csvData = feedbackList.map(feedback => [
      feedback.id,
      feedback.userName,
      feedback.userEmail,
      feedback.department,
      feedback.category,
      feedback.priority,
      feedback.status,
      `"${feedback.message.replace(/"/g, '""')}"`, // Escape quotes in message
      feedback.timestamp,
      feedback.adminResponse ? `"${feedback.adminResponse.replace(/"/g, '""')}"` : '',
      feedback.responseDate || '',
      feedback.responseBy || ''
    ].join(',')).join('\n')
    
    const csvContent = csvHeaders + '\n' + csvData
    
    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `APS_Lanka_Feedback_Report_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    setIsGeneratingReport(false)
  }

  const filteredFeedback = getFilteredFeedback()
  const pendingCount = feedbackList.filter(f => f.status === 'pending').length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-900">User Feedback Management</h3>
              <p className="text-gray-600 mt-1">Monitor and respond to user feedback ({pendingCount} pending)</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Filters */}
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="responded">Responded</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="bug">Bug Reports</option>
              <option value="suggestion">Suggestions</option>
              <option value="complaint">Complaints</option>
              <option value="compliment">Compliments</option>
              <option value="question">Questions</option>
            </select>
            
            <div className="flex-1"></div>
            
            <button
              onClick={generateReport}
              disabled={isGeneratingReport}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGeneratingReport ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[70vh]">
          <div className="divide-y divide-gray-200">
            {filteredFeedback.map((feedback) => (
              <div key={feedback.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{feedback.userName}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadge(feedback.category)}`}>
                        {feedback.category.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(feedback.priority)}`}>
                        {feedback.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{feedback.department} Department • {feedback.userEmail}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(feedback.status)}`}>
                      {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">{formatTimestamp(feedback.timestamp)}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <p className="text-gray-700">{feedback.message}</p>
                </div>

                {feedback.adminResponse && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Admin Response</span>
                      <span className="text-xs text-blue-600">
                        {feedback.responseDate && formatTimestamp(feedback.responseDate)}
                      </span>
                    </div>
                    <p className="text-blue-700">{feedback.adminResponse}</p>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  {feedback.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleRespond(feedback)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Respond
                      </button>
                      <button
                        onClick={() => markAsReviewed(feedback.id)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                      >
                        Mark Reviewed
                      </button>
                    </>
                  )}
                  {feedback.status === 'reviewed' && (
                    <button
                      onClick={() => handleRespond(feedback)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Add Response
                    </button>
                  )}
                  {(feedback.status === 'responded' || feedback.status === 'resolved') && (
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {feedback.status === 'responded' ? 'Response Sent' : 'Resolved'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Response Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-bold text-gray-900">
                Respond to {selectedFeedback.userName}
              </h4>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-gray-700 font-medium">Original Message:</p>
                <p className="text-gray-600 mt-1">{selectedFeedback.message}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Response
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your response here..."
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitResponse}
                disabled={!responseText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Send Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeedbackManagement