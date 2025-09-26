'use client'

import React, { useState } from 'react'
import { Shield, Mail, Lock, Eye, EyeOff, CheckCircle, ArrowRight, AlertTriangle, User, Building, BookOpen, BarChart3 } from 'lucide-react'
import AdminLogin from '../../../components/AdminLogin'
import AdminDashboard from '../../../components/AdminDashboard'
import MainTabs from '../../../components/MainTabs'

import { authApi } from '../../../utils/api'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'employee'
  department: string
}

const LoginPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'employee' | 'admin' | 'dashboard' | 'admin-dashboard'>('employee')

  const [user, setUser] = useState<User | null>(null)
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // New state for admin portal access validation
  const [showEmployeeIdModal, setShowEmployeeIdModal] = useState(false)
  const [employeeIdInput, setEmployeeIdInput] = useState('')
  const [employeeIdError, setEmployeeIdError] = useState('')

  // Load registered users from localStorage
  const getRegisteredUsers = () => {
    return JSON.parse(localStorage.getItem('apsLankaUsers') || '[]')
  }

  // This component handles real employee authentication via API

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Block admin from using regular employee login
    if (credentials.email === 'admin@apslanka.com') {
      setError('🔐 Admin accounts must use "Admin Portal Access" button below')
      setLoading(false)
      return
    }

    try {
      // Try API login first
      const response = await authApi.login({
        email: credentials.email,
        password: credentials.password
      })

      // API now returns { message, token, user } directly
      if (response.token && response.user) {
        // Store token in localStorage for future requests
        localStorage.setItem('authToken', response.token)
        
        // Set user state
        const userData = response.user
        setUser({
          id: userData.id,
          name: userData.fullName || `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          role: userData.role as 'admin' | 'manager' | 'employee',
          department: userData.department
        })
        
        if (userData.role === 'admin') {
          setCurrentView('admin-dashboard')
        } else {
          setCurrentView('dashboard')
        }
      } else {
        setError('Invalid response from server. Please try again.')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Parse error message from the API response
      let errorMessage = 'Login failed. Please try again.'
      if (error.message) {
        if (error.message.includes('Invalid credentials')) {
          errorMessage = 'Invalid email or password. Please try again.'
        } else if (error.message.includes('Too many')) {
          errorMessage = 'Too many login attempts. Please try again later.'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = (adminCredentials: { email: string; password: string; role: string; userData?: any }) => {
    // The AdminLogin component has already authenticated and stored the token
    // Just set the user state and navigate to dashboard
    if (adminCredentials.userData) {
      const userData = adminCredentials.userData
      setUser({
        id: userData.id,
        name: userData.fullName || `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        role: 'admin',
        department: userData.department
      })
    } else {
      // Fallback if userData is not provided
      setUser({
        id: 'admin-1',
        name: 'Admin User',
        email: adminCredentials.email,
        role: 'admin',
        department: 'IT'
      })
    }
    
    setCurrentView('admin-dashboard')
  }

  const handleLogout = () => {
    // Clear auth token from localStorage
    localStorage.removeItem('authToken')
    
    setUser(null)
    setCurrentView('employee')
    setCredentials({ email: '', password: '' })
    setError('')
    setRegistrationSuccess(false)
  }



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  // Handle admin portal access button click
  const handleAdminPortalAccess = () => {
    setShowEmployeeIdModal(true)
    setEmployeeIdInput('')
    setEmployeeIdError('')
  }

  // Validate employee ID for admin portal access
  const handleEmployeeIdValidation = (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedId = employeeIdInput.trim().toUpperCase()
    
    // Check if employee ID starts with EMP (blocked)
    if (trimmedId.startsWith('EMP')) {
      setEmployeeIdError('🚫 You are prohibited from accessing the Admin Portal!')
      return
    }
    
    // Check if it's the valid admin ID
    if (trimmedId === 'ADM001') {
      // Allow access to admin login
      setShowEmployeeIdModal(false)
      setCurrentView('admin')
    } else {
      setEmployeeIdError('❌ Invalid Employee ID for Admin Portal access')
    }
  }

  // Close modal
  const closeEmployeeIdModal = () => {
    setShowEmployeeIdModal(false)
    setEmployeeIdInput('')
    setEmployeeIdError('')
  }

  // Render Admin Login
  if (currentView === 'admin') {
    return (
      <AdminLogin 
        onLogin={handleAdminLogin}
        onBackToLogin={() => setCurrentView('employee')}
      />
    )
  }

  // Render Admin Dashboard
  if (currentView === 'admin-dashboard' && user) {
    return (
      <AdminDashboard 
        user={user}
        onLogout={handleLogout}
      />
    )
  }

  // Render Employee Dashboard
  if (currentView === 'dashboard' && user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Clean Employee Navigation Header */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo and Brand */}
              <div className="flex items-center">
                <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">APS Lanka</span>
                  <span className="text-sm text-gray-500 ml-2">Portal</span>
                </div>
              </div>
              
              {/* User Info and Actions */}
              <div className="flex items-center space-x-4">
                {/* User Info */}
                <div className="hidden md:flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.role} • {user.department}</div>
                  </div>
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-600" />
                  </div>
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                >
                  <ArrowRight className="mr-2 h-4 w-4 transform rotate-180" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Enhanced Main Dashboard Content */}
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    Welcome back, {user.name.split(' ')[0]}
                  </h1>
                  <p className="text-gray-600">
                    Access your cybersecurity training and compliance dashboard
                  </p>
                </div>
                
                {/* Quick Stats */}
                <div className="hidden lg:grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">Training</div>
                    <div className="text-xs text-gray-500">Active</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                      <BarChart3 className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">Compliance</div>
                    <div className="text-xs text-gray-500">On Track</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-2">
                      <Shield className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">Security</div>
                    <div className="text-xs text-gray-500">Protected</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Tabs */}
          <div>
            <MainTabs user={user} />
          </div>
        </main>
      </div>
    )
  }

  // Render Employee Login Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo and Header */}
        <div className="text-center animate-fadeInUp">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl animate-bounce">
            <Shield className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-3">Welcome Back</h2>
          <p className="text-xl text-white/90 font-medium">APS Lanka SETA Portal</p>
          <div className="flex items-center justify-center mt-4 space-x-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-sm text-green-300">Secure Employee Access</span>
          </div>
        </div>

        {/* Employee Login Instructions */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 animate-fadeInUp delay-200">
          <div className="flex items-center mb-3">
            <User className="h-5 w-5 mr-2 text-blue-400" />
            <h3 className="font-semibold text-white">Employee Portal Access</h3>
          </div>
          <p className="text-sm leading-relaxed text-white/80">Enter your APS Lanka employee credentials to access the cybersecurity training platform. Contact IT support if you need assistance.</p>
        </div>

        {/* Registration Success Message */}
        {registrationSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-green-700 animate-fadeInUp delay-300 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="font-bold text-lg text-green-800">Registration Successful!</h3>
                <p className="mt-1 text-green-600">Your account has been created. You can now sign in with your credentials.</p>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20 animate-fadeInUp delay-400">
          <form onSubmit={handleEmployeeLogin} className="space-y-6">
            <div className="group">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Mail className="h-4 w-4 mr-2 text-primary-500" />
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={credentials.email}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 group-hover:border-primary-300 bg-gray-50 focus:bg-white"
                  placeholder="Enter your email"
                  suppressHydrationWarning={true}
                />
              </div>
            </div>

            <div className="group">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Lock className="h-4 w-4 mr-2 text-primary-500" />
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 group-hover:border-primary-300 bg-gray-50 focus:bg-white"
                  placeholder="Enter your password"
                  suppressHydrationWarning={true}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors"
                  suppressHydrationWarning={true}
                  key="password-toggle"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-shake">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white transition-all duration-300 relative overflow-hidden group ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transform hover:scale-105 hover:-translate-y-1 shadow-xl hover:shadow-2xl'
                }`}
                suppressHydrationWarning={true}
              >
                {!loading && (
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                )}
                <span className="relative flex items-center">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-3 h-5 w-5 group-hover:animate-pulse" />
                      Sign In
                      <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleAdminPortalAccess}
                className="w-full flex justify-center py-3 px-4 border border-red-300 rounded-xl shadow-sm text-sm font-semibold text-red-700 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
                suppressHydrationWarning={true}
              >
                <Shield className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                Admin Portal Access
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>

          <div className="mt-8 text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Secure Authentication</span>
              <span className="mx-2">•</span>
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Data Protection</span>
            </div>
            
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <a
                href="/auth/signup"
                className="font-semibold text-primary-600 hover:text-primary-500 transition-colors duration-300 inline-flex items-center"
                suppressHydrationWarning={true}
              >
                Create Account
                <ArrowRight className="ml-1 h-3 w-3" />
              </a>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center text-sm text-white/80 space-y-2 animate-fadeInUp delay-600">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-4 w-4 text-green-400" />
            <span className="text-white/90">Secure Login • Two-Factor Authentication</span>
          </div>
          <p className="text-xs text-white/70">Session expires after 30 minutes of inactivity for security</p>
        </div>
      </div>

      {/* Employee ID Validation Modal */}
      {showEmployeeIdModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200 animate-scale">
            <div className="text-center mb-6">
              <div className="mx-auto h-12 w-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Admin Portal Access</h3>
              <p className="text-sm text-gray-600">
                Please enter your Employee ID to verify admin portal access permissions.
              </p>
            </div>
            
            <form onSubmit={handleEmployeeIdValidation}>
              <div className="mb-4">
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                  Employee ID
                </label>
                <input
                  id="employeeId"
                  type="text"
                  value={employeeIdInput}
                  onChange={(e) => {
                    setEmployeeIdInput(e.target.value)
                    if (employeeIdError) setEmployeeIdError('')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="XXXXXX (6 Digits)"
                  required
                />
              </div>

              {employeeIdError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600 font-medium">{employeeIdError}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={closeEmployeeIdModal}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Verify Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default LoginPage