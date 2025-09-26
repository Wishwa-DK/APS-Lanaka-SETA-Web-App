'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import AdminPolicyTab from './AdminPolicyTab'
import AdminComplianceTab from './AdminComplianceTab'
import FeedbackManagement from './FeedbackManagement'

interface User {
  id: string
  name: string
  email: string
  role: string
  department: string
  complianceLevel: number
  lastActive: string
}

interface AdminDashboardProps {
  user: {
    name: string
    email: string
    role: string
  }
  onLogout: () => void
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showFeedback, setShowFeedback] = useState(false)
  const [dashboardData, setDashboardData] = useState({
    liveUserCount: 0,
    totalPolicies: 0,
    overallComplianceRate: 0
  })

  // Simulate real-time data updates
  useEffect(() => {
    const updateDashboardData = () => {
      // Mock live user count (simulating real-time updates) - only on client
      const liveUsers = Math.floor(Math.random() * 20) + 45 // 45-65 users
      
      // Mock total policies
      const totalPolicies = 24
      
      // Mock overall compliance rate (average of all users)
      const averageCompliance = 88 // Simulated company average
      
      setDashboardData({
        liveUserCount: liveUsers,
        totalPolicies,
        overallComplianceRate: averageCompliance
      })
    }

    // Initial update
    updateDashboardData()
    
    // Update every 30 seconds
    const interval = setInterval(updateDashboardData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Admin Navigation Header */}
      <nav className="bg-gradient-to-r from-red-600 to-red-700 shadow-lg border-b border-red-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Enhanced Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-12 w-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white font-bold text-lg">APS</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white">APS Lanka</span>
                  <span className="text-red-200 text-sm font-medium">Administrative Portal</span>
                </div>
                <span className="ml-4 px-3 py-1 bg-white bg-opacity-20 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-white border-opacity-30">
                  ADMIN
                </span>
              </div>
            </div>

            {/* Enhanced Navigation Tabs */}
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('policies')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'policies'
                    ? 'bg-white bg-opacity-20 backdrop-blur-sm text-white shadow-lg border border-white border-opacity-30'
                    : 'text-red-100 hover:text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                📋 Policies
              </button>
              <button
                onClick={() => setActiveTab('compliance')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'compliance'
                    ? 'bg-white bg-opacity-20 backdrop-blur-sm text-white shadow-lg border border-white border-opacity-30'
                    : 'text-red-100 hover:text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                📊 Compliance
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'admin'
                    ? 'bg-white bg-opacity-20 backdrop-blur-sm text-white shadow-lg border border-white border-opacity-30'
                    : 'text-red-100 hover:text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                ⚙️ Settings
              </button>
            </div>

            {/* Enhanced User Menu */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-semibold text-white">Welcome back!</div>
                <div className="text-xs text-red-200">{user.name}</div>
              </div>
              <div className="w-10 h-10 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white border-opacity-30">
                <span className="text-white font-semibold text-sm">👤</span>
              </div>
              <button
                onClick={onLogout}
                className="bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border border-white border-opacity-30 shadow-lg"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Enhanced Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Live User Count */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border border-green-200 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <p className="text-sm font-semibold text-green-700">Live Users Online</p>
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-2">{dashboardData.liveUserCount}</p>
                <p className="text-sm text-green-600 font-medium">Currently Active Employees</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Policies */}
          <div className="bg-gradient-to-br from-blue-50 to-primary-50 rounded-2xl shadow-lg p-6 border border-blue-200 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-700 mb-2">Total Policies</p>
                <p className="text-4xl font-bold text-gray-900 mb-2">{dashboardData.totalPolicies}</p>
                <p className="text-sm text-blue-600 font-medium">Active Company Policies</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Overall Compliance Rate */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-purple-200 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-purple-700 mb-2">Company Compliance</p>
                <p className="text-4xl font-bold text-gray-900 mb-2">{dashboardData.overallComplianceRate}%</p>
                <p className="text-sm text-purple-600 font-medium">Average Across All Users</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Feedback Section */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200 shadow-sm">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">📝</span>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900">User Feedback Management</h3>
                <p className="text-sm text-gray-600">Review and respond to employee feedback</p>
              </div>
              <button
                onClick={() => setShowFeedback(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
              >
                <span>View Feedback</span>
                <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-bold">5 New</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Content Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {activeTab === 'policies' && <AdminPolicyTab />}
          
          {activeTab === 'compliance' && <AdminComplianceTab />}
          
          {activeTab === 'admin' && (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <span className="text-3xl">⚙️</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Administrative Controls</h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                  Access advanced administrative features, user management, and system configuration tools to maintain your cybersecurity platform.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* User Management */}
                <div className="bg-gradient-to-br from-blue-50 to-primary-50 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-primary-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">User Management</h3>
                  <p className="text-sm text-gray-600 mb-4">Manage employee accounts, roles, and permissions</p>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                    Coming Soon
                  </button>
                </div>

                {/* System Settings */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all duration-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">System Settings</h3>
                  <p className="text-sm text-gray-600 mb-4">Configure platform settings and preferences</p>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                    Coming Soon
                  </button>
                </div>

                {/* Security Monitoring */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Security Monitor</h3>
                  <p className="text-sm text-gray-600 mb-4">Monitor security events and system health</p>
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Feedback Modal */}
      {showFeedback && (
        <FeedbackManagement onClose={() => setShowFeedback(false)} />
      )}
    </div>
  )
}

export default AdminDashboard