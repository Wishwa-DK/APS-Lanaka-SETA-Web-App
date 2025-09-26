'use client';

import Link from 'next/link'
import { Shield, Users, FileText, BarChart3, AlertTriangle, CheckCircle, ArrowRight, Star, Zap, Lock, TrendingUp, BookOpen, Clock, Award } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check multiple possible user data storage keys
    const userData = localStorage.getItem('user') || 
                    localStorage.getItem('userData') || 
                    localStorage.getItem('currentUser');
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('✅ User data found and loaded:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('userData');
        localStorage.removeItem('currentUser');
      }
    } else {
      console.log('ℹ️ No user data found in localStorage');
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userData'); 
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    console.log('🔄 User logged out, localStorage cleared');
    setUser(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is logged in, show dashboard
  if (user) {
    console.log('🔍 User logged in:', user); // Debug log
    return (
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">APS Lanka Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  Welcome, {user.firstName} {user.lastName} ({user.department})
                </span>
                {/* Always show My Profile button for logged in users */}
                <Link 
                  href="/profile"
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                  title="Update your email and password"
                >
                  <Users className="h-4 w-4" />
                  <span>My Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link
              href="/policies"
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition group"
            >
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Policies</h3>
                  <p className="text-gray-600 text-sm">View and acknowledge policies</p>
                </div>
              </div>
            </Link>

            <Link
              href="/training"
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition group"
            >
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600 group-hover:text-green-700" />
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Training</h3>
                  <p className="text-gray-600 text-sm">Security training modules</p>
                </div>
              </div>
            </Link>

            <Link
              href="/risk-assessment"
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition group"
            >
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600 group-hover:text-purple-700" />
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Risk Assessment</h3>
                  <p className="text-gray-600 text-sm">Assess security risks</p>
                </div>
              </div>
            </Link>

            <Link
              href="/compliance"
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition group"
            >
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-teal-600 group-hover:text-teal-700" />
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Compliance</h3>
                  <p className="text-gray-600 text-sm">Track compliance status</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Welcome Message */}
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to APS Lanka Cybersecurity Platform
            </h2>
            <p className="text-gray-600 mb-6">
              Stay secure with our comprehensive cybersecurity training and policy management system.
              Your role: <strong>{user.role}</strong> | Department: <strong>{user.department}</strong>
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FileText className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Active Policies</h3>
                <p className="text-gray-600 text-sm">Review department-specific policies</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Users className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Training Modules</h3>
                <p className="text-gray-600 text-sm">Complete security awareness training</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <CheckCircle className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Compliance Tracking</h3>
                <p className="text-gray-600 text-sm">Monitor your compliance status</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Landing page for non-logged-in users
  return (
    <main className="flex-1">
      {/* Professional Header */}
      <header className="bg-white shadow-lg border-b-2 border-primary-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95 animate-fadeInDown">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center group">
              <div className="relative">
                <Shield className="h-10 w-10 text-primary-600 mr-3 transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-primary-600/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors duration-300">APS Lanka SETA</h1>
                <p className="text-xs text-gray-500 font-medium tracking-wider">SECURITY TRAINING & AWARENESS</p>
              </div>
            </div>
            <nav className="flex items-center space-x-6">
              <Link 
                href="/auth/login" 
                className="text-gray-700 hover:text-primary-600 font-medium transition-all duration-300 hover:scale-105 px-3 py-2 rounded-md hover:bg-primary-50"
              >
                Login
              </Link>
              <Link 
                href="/auth/signup" 
                className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                <span className="relative flex items-center">
                  <Shield className="mr-2 h-4 w-4" />
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Professional Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-primary-900 to-slate-800 text-white py-24 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full animate-spin" style={{ animationDuration: '30s' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            {/* Professional Badge */}
            <div className="inline-flex items-center bg-primary-500/20 backdrop-blur-sm border border-primary-300/30 rounded-full px-6 py-3 mb-8 animate-fadeInUp">
              <Award className="h-5 w-5 mr-2 text-yellow-400" />
              <span className="text-primary-200 font-semibold">Engineering Excellence Since 2007</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-bold mb-8 animate-fadeInUp delay-200 leading-tight">
              <span className="text-white">Powering</span>{' '}
              <span className="bg-gradient-to-r from-primary-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                Information Security
              </span>
              <br />
              <span className="text-white">Excellence</span>
            </h2>
            
            <p className="text-xl md:text-2xl mb-10 max-w-5xl mx-auto text-slate-200 leading-relaxed animate-fadeInUp delay-400">
              Comprehensive security training and awareness platform engineered for{' '}
              <span className="font-bold text-white">APS Lanka's MEP professionals</span>, 
              building on our <span className="font-bold text-yellow-400">18 years</span> of industry leadership.
            </p>
            
            {/* Company Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-12 animate-fadeInUp delay-600">
              <div className="group flex items-center bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20 hover:border-primary-400/50 transition-all duration-300 hover:scale-105">
                <Users className="h-6 w-6 mr-3 text-primary-400 group-hover:animate-pulse" />
                <div className="text-left">
                  <div className="font-bold text-lg">91+</div>
                  <div className="text-sm text-slate-300">Professionals</div>
                </div>
              </div>
              
              <div className="group flex items-center bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105">
                <Clock className="h-6 w-6 mr-3 text-yellow-400 group-hover:animate-pulse" />
                <div className="text-left">
                  <div className="font-bold text-lg">18</div>
                  <div className="text-sm text-slate-300">Years Excellence</div>
                </div>
              </div>
              
              <div className="group flex items-center bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20 hover:border-green-400/50 transition-all duration-300 hover:scale-105">
                <CheckCircle className="h-6 w-6 mr-3 text-green-400 group-hover:animate-pulse" />
                <div className="text-left">
                  <div className="font-bold text-lg">MEP</div>
                  <div className="text-sm text-slate-300">Industry Leader</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fadeInUp delay-800">
            <Link 
              href="/auth/signup" 
              className="group bg-gradient-to-r from-primary-600 to-primary-700 text-white px-10 py-4 rounded-xl font-bold text-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-2xl hover:shadow-primary-500/25 transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
              <span className="relative flex items-center">
                <Shield className="mr-3 h-6 w-6 group-hover:animate-pulse" />
                Begin Security Training
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Link>              <Link 
                href="#features" 
                className="group border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-slate-900 transition-all duration-300 backdrop-blur-sm"
              >
                <span className="flex items-center">
                  Explore Features
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Link>
            </div>
            
            <div className="mt-8 text-slate-400 text-sm font-medium animate-fadeInUp delay-1000">
              Trusted by leading construction & engineering firms across Sri Lanka
            </div>
          </div>
        </div>
      </section>

      {/* Professional Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-primary-100 text-primary-800 rounded-full px-4 py-2 font-medium text-sm mb-6 animate-bounce">
              <Shield className="h-4 w-4 mr-2" />
              End-to-End Security Solutions
            </div>
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 animate-fadeInUp">
              Engineering <span className="text-primary-600">Secure Excellence</span>
            </h3>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto animate-fadeInUp delay-200 leading-relaxed">
              Just as APS Lanka delivers comprehensive MEP solutions, our cybersecurity platform 
              provides complete protection for your digital infrastructure and workforce.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Policy Management */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-primary-200 animate-fadeInUp delay-300 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-blue-500"></div>
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </div>
              <h4 className="text-xl font-bold mb-4 text-gray-900 group-hover:text-primary-700 transition-colors">Policy Management</h4>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Centralized policy distribution, version control, and acknowledgment tracking - 
                engineered for construction industry compliance standards.
              </p>
              <ul className="text-sm text-gray-500 space-y-3">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-green-500" /> Document versioning & control</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-green-500" /> Digital acknowledgments</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-green-500" /> Compliance tracking</li>
              </ul>
            </div>

            {/* Training Platform */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-green-200 animate-fadeInUp delay-400 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
              </div>
              <h4 className="text-xl font-bold mb-4 text-gray-900 group-hover:text-green-700 transition-colors">Professional Training</h4>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Industry-specific cybersecurity training modules designed for engineering professionals, 
                tailored to construction and MEP environments.
              </p>
              <ul className="text-sm text-gray-500 space-y-3">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-green-500" /> Interactive modules</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-green-500" /> Progress tracking</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-green-500" /> Industry scenarios</li>
              </ul>
            </div>

            {/* Risk Dashboard */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-purple-200 animate-fadeInUp delay-500 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
              <h4 className="text-xl font-bold mb-4 text-gray-900 group-hover:text-purple-700 transition-colors">Enterprise Dashboard</h4>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Real-time compliance monitoring and analytics dashboard with comprehensive reporting 
                for management oversight and audit readiness.
              </p>
              <ul className="text-sm text-gray-500 space-y-3">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-green-500" /> Real-time analytics</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-green-500" /> Audit reports</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-green-500" /> Risk assessment</li>
              </ul>
            </div>

            {/* Compliance Tracking */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-teal-200 animate-fadeInUp delay-600 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-cyan-500"></div>
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <Award className="h-4 w-4 text-white" />
                </div>
              </div>
              <h4 className="text-xl font-bold mb-4 text-gray-900 group-hover:text-teal-700 transition-colors">Compliance Excellence</h4>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Automated compliance monitoring with audit trails, deadline management, 
                and regulatory alignment for engineering industry standards.
              </p>
              <ul className="text-sm text-gray-500 space-y-3">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-green-500" /> Regulatory compliance</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-green-500" /> Audit preparation</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-green-500" /> Deadline tracking</li>
              </ul>
            </div>

            {/* Enterprise Security */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-red-200 animate-fadeInUp delay-700 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-pink-500"></div>
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Lock className="h-4 w-4 text-white" />
                </div>
              </div>
              <h4 className="text-xl font-bold mb-4 text-gray-900 group-hover:text-red-700 transition-colors">Enterprise Security</h4>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Bank-grade security with encryption, secure file handling, and comprehensive 
                audit logging designed for engineering data protection.
              </p>
              <ul className="text-sm text-gray-500 space-y-3">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-green-500" /> Data encryption</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-green-500" /> Secure file handling</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-green-500" /> Audit logging</li>
              </ul>
            </div>

            {/* Alert Management */}
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-orange-200 animate-fadeInUp delay-800 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-yellow-500"></div>
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
              </div>
              <h4 className="text-xl font-bold mb-4 text-gray-900 group-hover:text-orange-700 transition-colors">Smart Alerts</h4>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Intelligent alerting system for policy violations and security incidents 
                with engineering workflow integration and escalation protocols.
              </p>
              <ul className="text-sm text-gray-500 space-y-3">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-green-500" /> Smart notifications</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-green-500" /> Escalation workflows</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-green-500" /> Incident tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Industry Stats Section */}
      <section className="py-20 bg-gradient-to-r from-slate-800 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 to-blue-900/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 animate-fadeInUp">
              Trusted by Industry Leaders
            </h3>
            <p className="text-xl text-gray-300 animate-fadeInUp delay-200">
              Following APS Lanka's commitment to excellence in MEP engineering solutions
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group animate-fadeInUp delay-300">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all duration-300 border border-white/20">
                <div className="text-4xl font-bold text-primary-400 mb-2 group-hover:scale-110 transition-transform duration-300">91</div>
                <div className="text-gray-300 font-medium">Team Members</div>
                <div className="text-sm text-gray-400 mt-1">Protected & Trained</div>
              </div>
            </div>
            
            <div className="group animate-fadeInUp delay-400">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all duration-300 border border-white/20">
                <div className="text-4xl font-bold text-green-400 mb-2 group-hover:scale-110 transition-transform duration-300">18</div>
                <div className="text-gray-300 font-medium">Years Experience</div>
                <div className="text-sm text-gray-400 mt-1">Industry Leadership</div>
              </div>
            </div>
            
            <div className="group animate-fadeInUp delay-500">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all duration-300 border border-white/20">
                <div className="text-4xl font-bold text-purple-400 mb-2 group-hover:scale-110 transition-transform duration-300">24/7</div>
                <div className="text-gray-300 font-medium">Security Monitor</div>
                <div className="text-sm text-gray-400 mt-1">Continuous Protection</div>
              </div>
            </div>
            
            <div className="group animate-fadeInUp delay-600">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all duration-300 border border-white/20">
                <div className="text-4xl font-bold text-yellow-400 mb-2 group-hover:scale-110 transition-transform duration-300">99.9%</div>
                <div className="text-gray-300 font-medium">Platform Uptime</div>
                <div className="text-sm text-gray-400 mt-1">Reliable Service</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Call to Action */}
      <section className="py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 border border-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 border border-white/5 rounded-full animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 mb-8 animate-fadeInUp">
            <Shield className="h-5 w-5 mr-2 text-yellow-400" />
            <span className="font-medium">Secure Your Engineering Excellence</span>
          </div>
          
          <h3 className="text-3xl md:text-4xl font-bold mb-6 animate-fadeInUp delay-200">
            Ready to Build a <span className="text-yellow-400">Cyber-Secure</span> Future?
          </h3>
          <p className="text-xl md:text-2xl mb-8 text-primary-100 leading-relaxed animate-fadeInUp delay-400">
            Join APS Lanka's commitment to excellence with comprehensive cybersecurity training 
            designed for engineering professionals.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fadeInUp delay-600">
            <Link 
              href="/auth/signup" 
              className="bg-white text-primary-700 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 inline-flex items-center text-lg group"
            >
              <Shield className="mr-2 h-5 w-5 group-hover:animate-pulse" />
              Begin Your Security Journey
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="text-primary-200 text-sm font-medium">
              Trusted by 91+ engineering professionals
            </div>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 to-blue-900/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="relative">
                  <Shield className="h-8 w-8 mr-3 text-primary-400" />
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <span className="font-bold text-xl">APS Lanka SETA</span>
                  <p className="text-sm text-primary-400">Security Excellence Training & Awareness</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Powering cybersecurity excellence through comprehensive training and awareness programs, 
                engineered specifically for construction and MEP industry professionals.
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center text-gray-400">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>18+ Years of Excellence</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Users className="h-4 w-4 mr-2" />
                  <span>91+ Professionals</span>
                </div>
              </div>
            </div>
            
            {/* Platform Links */}
            <div>
              <h5 className="font-bold mb-6 text-white">Security Platform</h5>
              <ul className="space-y-3 text-gray-300">
                <li><Link href="/features" className="hover:text-primary-400 transition-colors flex items-center"><ArrowRight className="h-3 w-3 mr-2" />Training Modules</Link></li>
                <li><Link href="/security" className="hover:text-green-400 transition-colors flex items-center"><ArrowRight className="h-3 w-3 mr-2" />Policy Management</Link></li>
                <li><Link href="/compliance" className="hover:text-purple-400 transition-colors flex items-center"><ArrowRight className="h-3 w-3 mr-2" />Compliance Tracking</Link></li>
                <li><Link href="/dashboard" className="hover:text-yellow-400 transition-colors flex items-center"><ArrowRight className="h-3 w-3 mr-2" />Analytics Dashboard</Link></li>
              </ul>
            </div>
            
            {/* Support & Contact */}
            <div>
              <h5 className="font-bold mb-6 text-white">Support & Resources</h5>
              <ul className="space-y-3 text-gray-300">
                <li><Link href="/docs" className="hover:text-primary-400 transition-colors flex items-center"><ArrowRight className="h-3 w-3 mr-2" />Documentation</Link></li>
                <li><Link href="/help" className="hover:text-green-400 transition-colors flex items-center"><ArrowRight className="h-3 w-3 mr-2" />Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-purple-400 transition-colors flex items-center"><ArrowRight className="h-3 w-3 mr-2" />Contact Support</Link></li>
                <li><Link href="/privacy" className="hover:text-yellow-400 transition-colors flex items-center"><ArrowRight className="h-3 w-3 mr-2" />Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Footer Bottom */}
          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                <p>&copy; 2025 APS Lanka International (Pvt) Ltd. All rights reserved.</p>
                <p className="mt-1">MEP Engineering Excellence Since 2007</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-green-400 text-xs font-medium">System Online</span>
                </div>
                <div className="text-gray-500 text-xs">
                  Platform Version 2025.1
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}