'use client'

import React, { useState } from 'react'
import { FileText, BookOpen, BarChart3, Settings, Shield, Users } from 'lucide-react'
import PoliciesTab from './PoliciesTab'
import TrainingTab from './TrainingTab'
import ComplianceLevelTab from './ComplianceLevelTab'

interface MainTabsProps {
  user: {
    id: string
    name: string
    email: string
    role: 'admin' | 'manager' | 'employee'
    department: string
  }
}

const MainTabs: React.FC<MainTabsProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('policies')

  const tabs = [
    {
      id: 'policies',
      label: 'Policies',
      icon: FileText,
      description: 'Company policies and procedures'
    },
    {
      id: 'training',
      label: 'Training',
      icon: BookOpen,
      description: 'Cybersecurity training modules'
    },
    {
      id: 'compliance',
      label: 'Compliance Level',
      icon: BarChart3,
      description: 'Your compliance progress'
    }
  ]

  // Only show admin tabs for admin users
  if (user.role === 'admin') {
    tabs.push(
      {
        id: 'risk-assessment',
        label: 'Risk Assessment',
        icon: Shield,
        description: 'Security risk management'
      },
      {
        id: 'user-management',
        label: 'User Management',
        icon: Users,
        description: 'Manage users and permissions'
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        description: 'System configuration'
      }
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'policies':
        return <PoliciesTab user={user} />
      case 'training':
        return <TrainingTab user={user} />
      case 'compliance':
        return <ComplianceLevelTab user={user} />
      case 'risk-assessment':
        return (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Risk Assessment Dashboard</h3>
            <p className="text-gray-600 mb-4">Security risk management and analytics dashboard</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
              Under Development
            </span>
          </div>
        )
      case 'user-management':
        return (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
            <p className="text-gray-600 mb-4">Manage users, roles, and permissions</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              Coming Soon
            </span>
          </div>
        )
      case 'settings':
        return (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Settings className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">System Settings</h3>
            <p className="text-gray-600 mb-4">System configuration and preferences</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              In Progress
            </span>
          </div>
        )
      default:
        return <PoliciesTab user={user} />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`h-5 w-5 mr-2 ${
                  isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  )
}

export default MainTabs