'use client'

import React, { useState, useEffect } from 'react'
import { User, Building, TrendingUp, Award, CheckCircle, Clock, AlertTriangle, Download, Calendar } from 'lucide-react'

interface ComplianceData {
  policiesReviewed: {
    completed: number
    total: number
    percentage: number
  }
  trainingCompleted: {
    completed: number
    total: number
    percentage: number
  }
  quizScores: {
    averageScore: number
    totalQuizzes: number
    completedQuizzes: number
    percentage: number
  }
  overallCompliance: number
}

interface ComplianceLevelTabProps {
  user: {
    id: string
    name: string
    email: string
    role: 'admin' | 'manager' | 'employee'
    department: string
  }
}

const ComplianceLevelTab: React.FC<ComplianceLevelTabProps> = ({ user }) => {
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call to fetch compliance data
    setTimeout(() => {
      const mockData: ComplianceData = {
        policiesReviewed: {
          completed: 3,
          total: 6,
          percentage: 50
        },
        trainingCompleted: {
          completed: 1,
          total: 5,
          percentage: 20
        },
        quizScores: {
          averageScore: 80,
          totalQuizzes: 5,
          completedQuizzes: 4,
          percentage: 80
        },
        overallCompliance: 50 // Average of the three main metrics
      }
      setComplianceData(mockData)
      setLoading(false)
    }, 1000)
  }, [])

  const getComplianceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100', icon: '🌟' }
    if (percentage >= 80) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '👍' }
    if (percentage >= 60) return { level: 'Satisfactory', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: '⚠️' }
    return { level: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-100', icon: '🚨' }
  }

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const CircularProgress = ({ percentage, size = 120 }: { percentage: number; size?: number }) => {
    const radius = (size - 20) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (percentage / 100) * circumference
    
    const complianceLevel = getComplianceLevel(percentage)

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
          <span className={`text-xs font-medium ${complianceLevel.color}`}>
            {complianceLevel.level}
          </span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading compliance data...</span>
      </div>
    )
  }

  if (!complianceData) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Compliance Data</h3>
        <p className="text-gray-600">Please try again later or contact IT support.</p>
      </div>
    )
  }

  const overallLevel = getComplianceLevel(complianceData.overallCompliance)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* User Info Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
            <div className="flex items-center space-x-2 text-gray-600 text-sm">
              <Building className="h-4 w-4" />
              <span>{user.department} Department</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Compliance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Policies Reviewed */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Policies</h3>
              <p className="text-sm text-green-700 font-medium">Reviewed</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-4xl font-bold text-gray-900">
                {complianceData.policiesReviewed.percentage}%
              </span>
              <span className="text-sm text-gray-600 font-medium bg-white px-2 py-1 rounded-md">
                {complianceData.policiesReviewed.completed}/{complianceData.policiesReviewed.total}
              </span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-3 shadow-inner">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000 shadow-sm"
                style={{ width: `${complianceData.policiesReviewed.percentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-green-800 font-medium">
              {complianceData.policiesReviewed.total - complianceData.policiesReviewed.completed} remaining to complete
            </p>
          </div>
        </div>

        {/* Training Modules Completed */}
        <div className="bg-gradient-to-br from-blue-50 to-primary-50 rounded-xl border border-blue-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Training</h3>
              <p className="text-sm text-blue-700 font-medium">Modules</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-4xl font-bold text-gray-900">
                {complianceData.trainingCompleted.percentage}%
              </span>
              <span className="text-sm text-gray-600 font-medium bg-white px-2 py-1 rounded-md">
                {complianceData.trainingCompleted.completed}/{complianceData.trainingCompleted.total}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3 shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 to-primary-600 h-3 rounded-full transition-all duration-1000 shadow-sm"
                style={{ width: `${complianceData.trainingCompleted.percentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-blue-800 font-medium">
              {complianceData.trainingCompleted.total - complianceData.trainingCompleted.completed} modules to complete
            </p>
          </div>
        </div>

        {/* Quiz Scores */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Quiz</h3>
              <p className="text-sm text-yellow-700 font-medium">Performance</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-md">
              <Award className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-4xl font-bold text-gray-900">
                {complianceData.quizScores.averageScore}%
              </span>
              <span className="text-sm text-gray-600 font-medium bg-white px-2 py-1 rounded-md">
                Avg Score
              </span>
            </div>
            <div className="w-full bg-yellow-200 rounded-full h-3 shadow-inner">
              <div
                className="bg-gradient-to-r from-yellow-500 to-orange-600 h-3 rounded-full transition-all duration-1000 shadow-sm"
                style={{ width: `${complianceData.quizScores.averageScore}%` }}
              ></div>
            </div>
            <p className="text-sm text-yellow-800 font-medium">
              {complianceData.quizScores.completedQuizzes}/{complianceData.quizScores.totalQuizzes} quizzes completed
            </p>
          </div>
        </div>

        {/* Overall Compliance */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col items-center">
            <div className="text-center mb-4">
              <h3 className="font-bold text-gray-900 text-lg">Overall</h3>
              <p className="text-sm text-purple-700 font-medium">Compliance</p>
            </div>
            <div className="relative">
              <CircularProgress percentage={complianceData.overallCompliance} size={120} />
            </div>
            <div className={`mt-4 px-4 py-2 rounded-full text-sm font-semibold ${overallLevel.bgColor} ${overallLevel.color} shadow-sm`}>
              {overallLevel.icon} {overallLevel.level}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Completed Module 1: Introduction to Cybersecurity</p>
                <p className="text-xs text-gray-600">2 days ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="bg-blue-100 p-2 rounded-full">
                <Award className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Passed Quiz 1: Cybersecurity Basics (85%)</p>
                <p className="text-xs text-gray-600">2 days ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="bg-yellow-100 p-2 rounded-full">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Reviewed Information Security Policy</p>
                <p className="text-xs text-gray-600">1 week ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Requirements */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Upcoming Requirements
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Complete Module 2: Password Security</p>
                <p className="text-xs text-red-600">Due in 3 days</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <div className="bg-yellow-100 p-2 rounded-full">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Review Data Protection Policy</p>
                <p className="text-xs text-yellow-600">Due in 1 week</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="bg-blue-100 p-2 rounded-full">
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Annual Security Training Renewal</p>
                <p className="text-xs text-blue-600">Due in 2 months</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Action Buttons */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 p-8 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-6 text-xl">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="group flex flex-col items-center space-y-3 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center group-hover:bg-opacity-30 transition-all">
              <CheckCircle className="h-6 w-6" />
            </div>
            <span>Continue Training</span>
          </button>
          <button className="group flex flex-col items-center space-y-3 bg-gradient-to-br from-blue-500 to-primary-600 hover:from-blue-600 hover:to-primary-700 text-white px-6 py-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center group-hover:bg-opacity-30 transition-all">
              <Award className="h-6 w-6" />
            </div>
            <span>Take Assessment</span>
          </button>
          <button className="group flex flex-col items-center space-y-3 bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center group-hover:bg-opacity-30 transition-all">
              <Download className="h-6 w-6" />
            </div>
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Compliance Tips */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Award className="h-5 w-5 mr-2 text-blue-600" />
          Tips to Improve Your Compliance Score
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Complete all required training modules</p>
              <p className="text-xs text-gray-600">Stay up-to-date with the latest cybersecurity practices</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
              <Award className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Achieve high quiz scores</p>
              <p className="text-xs text-gray-600">Demonstrate your understanding of security concepts</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 p-2 rounded-full flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Review policies regularly</p>
              <p className="text-xs text-gray-600">Stay informed about company security policies</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-yellow-100 p-2 rounded-full flex-shrink-0">
              <Calendar className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Meet all deadlines</p>
              <p className="text-xs text-gray-600">Complete requirements on time to maintain compliance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComplianceLevelTab