'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { authApi } from '../utils/api'
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react'

interface AdminLoginProps {
  onLogin: (credentials: { email: string; password: string; role: string; userData?: any }) => void
  onBackToLogin: () => void
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBackToLogin }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Call the admin-login API endpoint
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      })

      const data = await response.json()

      if (response.ok && data.token && data.user) {
        // Store token in localStorage
        localStorage.setItem('authToken', data.token)
        
        // Call the onLogin callback with full user data
        onLogin({
          email: data.user.email,
          password: credentials.password,
          role: data.user.role,
          userData: data.user  // Pass the full user data
        })
      } else {
        setError(data.error || 'Admin login failed. Please try again.')
      }
    } catch (error: any) {
      console.error('Admin login error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Back Button */}
        <button
          onClick={onBackToLogin}
          className="flex items-center text-white/80 hover:text-white transition-colors duration-300 group animate-fadeInUp"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
          Back to Employee Login
        </button>

        {/* Logo and Header */}
        <div className="text-center animate-fadeInUp delay-100">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl animate-bounce">
            <Shield className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-3">Admin Portal</h2>
          <p className="text-xl text-red-200 font-medium">APS Lanka Cybersecurity Platform</p>
          <div className="flex items-center justify-center mt-4 space-x-2">
            <CheckCircle className="h-4 w-4 text-orange-400" />
            <span className="text-sm text-orange-300">Administrative Access</span>
          </div>
        </div>

        {/* Admin Login Instructions */}
        <div className="bg-red-800/30 backdrop-blur-sm border border-red-600/50 rounded-xl p-6 text-red-100 animate-fadeInUp delay-200">
          <div className="flex items-center mb-3">
            <Shield className="h-5 w-5 mr-2 text-red-400" />
            <h3 className="font-semibold text-red-200">Admin Portal Access</h3>
          </div>
          <p className="text-sm leading-relaxed">Use your admin credentials to access the management portal. Contact IT support if you need assistance with login.</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20 animate-fadeInUp delay-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Mail className="h-4 w-4 mr-2 text-red-500" />
                Admin Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={credentials.email}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 group-hover:border-red-300 bg-gray-50 focus:bg-white"
                  placeholder="Enter admin email"
                  suppressHydrationWarning={true}
                />
              </div>
            </div>

            <div className="group">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Lock className="h-4 w-4 mr-2 text-red-500" />
                Admin Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 group-hover:border-red-300 bg-gray-50 focus:bg-white"
                  placeholder="Enter admin password"
                  suppressHydrationWarning={true}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors"
                  suppressHydrationWarning={true}
                  key="admin-password-toggle"
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
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transform hover:scale-105 hover:-translate-y-1 shadow-xl hover:shadow-2xl'
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
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-3 h-5 w-5 group-hover:animate-pulse" />
                      Sign In as Admin
                      <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>

          <div className="mt-8 text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <CheckCircle className="h-3 w-3 text-red-500" />
              <span>Administrative Access</span>
              <span className="mx-2">•</span>
              <CheckCircle className="h-3 w-3 text-red-500" />
              <span>Secure Authentication</span>
            </div>
            
            <button
              onClick={onBackToLogin}
              className="inline-flex items-center text-sm text-red-600 hover:text-red-500 font-medium transition-colors duration-300"
              suppressHydrationWarning={true}
            >
              <ArrowLeft className="mr-1 h-3 w-3" />
              Back to Employee Login
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center text-sm text-red-200 space-y-2 animate-fadeInUp delay-500">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-4 w-4 text-orange-400" />
            <span>Secure Admin Access • Multi-Factor Authentication</span>
          </div>
          <p className="text-xs">Admin sessions expire after 1 hour for enhanced security</p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin