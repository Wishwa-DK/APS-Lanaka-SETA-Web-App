'use client'

import React, { useState } from 'react'
import FeedbackModal from './FeedbackModal'
import QuizModal from './QuizModal'
import MainTabs from './MainTabs'

interface User {
  id: string
  firstName: string
  lastName: string
  department: string
  role: string
  riskScore: number
  complianceScore: number
  trainingProgress: Array<{
    moduleId: string
    status: 'not-started' | 'in-progress' | 'completed'
    score?: number
  }>
}

interface DashboardProps {
  user: User
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showQuizModal, setShowQuizModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.firstName}!
              </h1>
              <p className="text-gray-600 mt-1">
                {user.department} • {user.role}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="text-sm font-medium text-gray-900">Today, 9:30 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Content */}
      <MainTabs user={{
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.id, // Using id as email for demo
        role: user.role as 'admin' | 'manager' | 'employee',
        department: user.department
      }} />

      {/* Modals */}
      {showFeedbackModal && (
        <FeedbackModal
          user={user}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}

      {showQuizModal && (
        <QuizModal
          onClose={() => setShowQuizModal(false)}
        />
      )}
    </div>
  )
}

export default Dashboard