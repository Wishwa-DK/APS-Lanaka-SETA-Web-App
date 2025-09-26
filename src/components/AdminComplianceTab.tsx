'use client'

import React, { useState } from 'react'
import { Download, TrendingDown, Users, Award, AlertCircle } from 'lucide-react'

interface UserCompliance {
  id: string
  name: string
  email: string
  department: string
  role: string
  overallCompliance: number
  policiesReviewed: number
  totalPolicies: number
  trainingCompleted: number
  totalTraining: number
  quizScores: number
  lastActivity: string
  status: 'excellent' | 'good' | 'needs-improvement' | 'critical'
}

interface AdminComplianceTabProps {
  onClose?: () => void
}

const AdminComplianceTab: React.FC<AdminComplianceTabProps> = ({ onClose }) => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [sortBy, setSortBy] = useState<'compliance' | 'name' | 'department'>('compliance')
  
  // Mock user compliance data - sorted by compliance level descending
  const [userCompliance] = useState<UserCompliance[]>([
    {
      id: '1',
      name: 'Wishwa Perera',
      email: 'wishwa@apslanka.lk',
      department: 'HR',
      role: 'manager',
      overallCompliance: 96,
      policiesReviewed: 24,
      totalPolicies: 24,
      trainingCompleted: 4,
      totalTraining: 4,
      quizScores: 92,
      lastActivity: '2025-09-22 09:30',
      status: 'excellent'
    },
    {
      id: '2',
      name: 'David Brown',
      email: 'david@apslanka.lk',
      department: 'Security',
      role: 'manager',
      overallCompliance: 94,
      policiesReviewed: 24,
      totalPolicies: 24,
      trainingCompleted: 4,
      totalTraining: 4,
      quizScores: 88,
      lastActivity: '2025-09-22 08:45',
      status: 'excellent'
    },
    {
      id: '3',
      name: 'Sarah Wilson',
      email: 'sarah@apslanka.lk',
      department: 'Operations',
      role: 'employee',
      overallCompliance: 87,
      policiesReviewed: 22,
      totalPolicies: 24,
      trainingCompleted: 4,
      totalTraining: 4,
      quizScores: 85,
      lastActivity: '2025-09-22 07:15',
      status: 'good'
    },
    {
      id: '4',
      name: 'Jane Smith',
      email: 'jane@apslanka.lk',
      department: 'HR',
      role: 'manager',
      overallCompliance: 83,
      policiesReviewed: 20,
      totalPolicies: 24,
      trainingCompleted: 3,
      totalTraining: 4,
      quizScores: 78,
      lastActivity: '2025-09-21 16:30',
      status: 'good'
    },
    {
      id: '5',
      name: 'Mike Johnson',
      email: 'mike@apslanka.lk',
      department: 'Finance',
      role: 'employee',
      overallCompliance: 78,
      policiesReviewed: 18,
      totalPolicies: 24,
      trainingCompleted: 3,
      totalTraining: 4,
      quizScores: 72,
      lastActivity: '2025-09-21 14:20',
      status: 'needs-improvement'
    },
    {
      id: '6',
      name: 'John Doe',
      email: 'john@apslanka.lk',
      department: 'IT',
      role: 'employee',
      overallCompliance: 75,
      policiesReviewed: 16,
      totalPolicies: 24,
      trainingCompleted: 2,
      totalTraining: 4,
      quizScores: 68,
      lastActivity: '2025-09-21 11:45',
      status: 'needs-improvement'
    },
    {
      id: '7',
      name: 'Lisa Garcia',
      email: 'lisa@apslanka.lk',
      department: 'Marketing',
      role: 'employee',
      overallCompliance: 60,
      policiesReviewed: 12,
      totalPolicies: 24,
      trainingCompleted: 2,
      totalTraining: 4,
      quizScores: 55,
      lastActivity: '2025-09-20 15:30',
      status: 'critical'
    },
    {
      id: '8',
      name: 'Alex Johnson',
      email: 'alex@apslanka.lk',
      department: 'IT',
      role: 'employee',
      overallCompliance: 45,
      policiesReviewed: 8,
      totalPolicies: 24,
      trainingCompleted: 1,
      totalTraining: 4,
      quizScores: 42,
      lastActivity: '2025-09-19 10:15',
      status: 'critical'
    }
  ])

  const getStatusColor = (status: string) => {
    const colors = {
      excellent: 'text-green-700 bg-green-100',
      good: 'text-blue-700 bg-blue-100',
      'needs-improvement': 'text-yellow-700 bg-yellow-100',
      critical: 'text-red-700 bg-red-100'
    }
    return colors[status as keyof typeof colors] || colors.good
  }

  const getComplianceBarColor = (compliance: number) => {
    if (compliance >= 90) return 'bg-green-500'
    if (compliance >= 80) return 'bg-blue-500'
    if (compliance >= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getSortedUsers = () => {
    const sorted = [...userCompliance]
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      case 'department':
        return sorted.sort((a, b) => a.department.localeCompare(b.department))
      case 'compliance':
      default:
        return sorted.sort((a, b) => b.overallCompliance - a.overallCompliance)
    }
  }

  const generateReport = async () => {
    setIsGeneratingReport(true)
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Create CSV content
    const csvHeaders = [
      'Name',
      'Email',
      'Department',
      'Role',
      'Overall Compliance %',
      'Policies Reviewed',
      'Training Completed',
      'Quiz Average',
      'Last Activity',
      'Status'
    ].join(',')
    
    const csvData = userCompliance.map(user => [
      user.name,
      user.email,
      user.department,
      user.role,
      user.overallCompliance,
      `${user.policiesReviewed}/${user.totalPolicies}`,
      `${user.trainingCompleted}/${user.totalTraining}`,
      user.quizScores,
      user.lastActivity,
      user.status
    ].join(',')).join('\n')
    
    const csvContent = csvHeaders + '\n' + csvData
    
    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `APS_Lanka_Compliance_Report_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    setIsGeneratingReport(false)
  }

  const averageCompliance = Math.round(
    userCompliance.reduce((sum, user) => sum + user.overallCompliance, 0) / userCompliance.length
  )

  return (
    <div className="p-8 bg-gradient-to-br from-red-50 to-red-100 min-h-full">
      {/* Enhanced Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex-1">
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h2>
              <p className="text-gray-600 text-lg">Monitor employee compliance levels and performance metrics</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mt-2">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
              {userCompliance.length} Active Users
            </div>
            <div className="bg-white bg-opacity-70 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-gray-600 border border-white">
              Average: {averageCompliance}% Compliance
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'compliance' | 'name' | 'department')}
            className="px-4 py-2 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold text-gray-700"
          >
            <option value="compliance">📊 Sort by Compliance</option>
            <option value="name">👤 Sort by Name</option>
            <option value="department">🏢 Sort by Department</option>
          </select>
          
          <button
            onClick={generateReport}
            disabled={isGeneratingReport}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isGeneratingReport ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-3" />
                Export Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 border border-white shadow-xl">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{userCompliance.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 border border-white shadow-xl">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">Average Compliance</p>
              <div className="flex items-baseline">
                <p className="text-3xl font-bold text-gray-900">{averageCompliance}</p>
                <span className="text-xl text-gray-600 ml-1">%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 border border-white shadow-xl">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">Needs Attention</p>
              <p className="text-3xl font-bold text-gray-900">
                {userCompliance.filter(u => u.status === 'needs-improvement' || u.status === 'critical').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 border border-white shadow-xl">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">Critical Status</p>
              <p className="text-3xl font-bold text-gray-900">
                {userCompliance.filter(u => u.status === 'critical').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced User Compliance Grid */}
      <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl border border-white shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
          <div className="flex items-center">
            <Users className="w-6 h-6 mr-3" />
            <h3 className="text-2xl font-bold">Employee Compliance Overview</h3>
          </div>
          <p className="text-red-100 mt-1">Real-time monitoring of compliance levels across all departments</p>
        </div>
        
        <div className="divide-y divide-gray-100">
          {getSortedUsers().map((user, index) => (
            <div key={user.id} className="p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-red-50 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-xl font-bold text-gray-900">{user.name}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(user.status)}`}>
                          {user.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 font-semibold mb-3">{user.department} Department • {user.email}</p>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                          <span className="text-blue-700 font-semibold">📋 Policies:</span>
                          <div className="text-blue-900 font-bold">{user.policiesReviewed}/{user.totalPolicies}</div>
                        </div>
                        <div className="bg-green-50 p-2 rounded-lg border border-green-200">
                          <span className="text-green-700 font-semibold">🎓 Training:</span>
                          <div className="text-green-900 font-bold">{user.trainingCompleted}/{user.totalTraining}</div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded-lg border border-purple-200">
                          <span className="text-purple-700 font-semibold">📊 Quiz Avg:</span>
                          <div className="text-purple-900 font-bold">{user.quizScores}%</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                          <span className="text-gray-700 font-semibold">⏰ Last Active:</span>
                          <div className="text-gray-900 font-bold text-xs">{new Date(user.lastActivity).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Compliance Progress Bar */}
                  <div className="mt-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-gray-700">Overall Compliance Level</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-900">{user.overallCompliance}%</span>
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                          {user.overallCompliance >= 90 ? '🏆' : user.overallCompliance >= 80 ? '✅' : user.overallCompliance >= 70 ? '⚠️' : '❗'}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
                      <div 
                        className={`h-4 rounded-full transition-all duration-700 ${getComplianceBarColor(user.overallCompliance)} shadow-sm`}
                        style={{ width: `${user.overallCompliance}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Report Generation Section */}
      <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">📊 Compliance Analytics</h4>
            <p className="text-sm text-gray-600">
              Export detailed compliance reports with user metrics, department analysis, and trend data for executive review.
            </p>
          </div>
          <button
            onClick={generateReport}
            disabled={isGeneratingReport}
            className="flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isGeneratingReport ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Generating Detailed Report...
              </div>
            ) : (
              <>
                <Download className="w-6 h-6 mr-3" />
                Generate Executive Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminComplianceTab