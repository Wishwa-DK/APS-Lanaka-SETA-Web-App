'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Shield, User, LogIn, UserPlus, Settings } from 'lucide-react'
import AuthModal from './AuthModal'

interface NavigationProps {
  isAuthenticated: boolean
  user?: {
    name: string
    role: string
  }
  onLogout: () => void
}

const Navigation: React.FC<NavigationProps> = ({ isAuthenticated, user, onLogout }) => {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  const handleLoginClick = () => {
    setAuthMode('login')
    setShowAuthModal(true)
  }

  const handleSignUpClick = () => {
    setAuthMode('signup')
    setShowAuthModal(true)
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
  }

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary-600 mr-3" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">APS Lanka</span>
                <span className="text-xs text-gray-500">Cybersecurity Portal</span>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link 
                  href="/" 
                  className="text-gray-900 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Home
                </Link>
                <Link 
                  href="/policies" 
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Policies
                </Link>
                <Link 
                  href="/training" 
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Training
                </Link>
                <Link 
                  href="/compliance" 
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Compliance Level
                </Link>
                {/* Profile Link for Authenticated Users */}
                {isAuthenticated && (
                  <Link 
                    href="/employee/profile" 
                    className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{user?.name}</span>
                    <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                      {user?.role}
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleLoginClick}
                    className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                  </button>
                  <button
                    onClick={handleSignUpClick}
                    className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Sign Up</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
            <Link href="/" className="block px-3 py-2 text-sm font-medium text-gray-900 hover:text-primary-600">
              Home
            </Link>
            <Link href="/policies" className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600">
              Policies
            </Link>
            <Link href="/training" className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600">
              Training
            </Link>
            <Link href="/compliance" className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600">
              Compliance Level
            </Link>
            {isAuthenticated && (
              <Link href="/employee/profile" className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600">
                <Settings className="h-4 w-4" />
                <span>My Profile</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          onToggleMode={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
        />
      )}
    </>
  )
}

export default Navigation