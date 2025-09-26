'use client'

import React, { useState, useEffect } from 'react'
import { BookOpen, PlayCircle, CheckCircle, Clock, Award, ChevronRight, FileText, Video, HelpCircle } from 'lucide-react'

interface TrainingModule {
  id: string
  title: string
  description: string
  content: string
  duration: number // in minutes
  completed: boolean
  score?: number
  type: 'module' | 'quiz' | 'exam'
  moduleNumber?: number
  quizId?: string
  prerequisites?: string[]
}

interface TrainingTabProps {
  user: {
    id: string
    name: string
    email: string
    role: 'admin' | 'manager' | 'employee'
    department: string
  }
}

const TrainingTab: React.FC<TrainingTabProps> = ({ user }) => {
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null)
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  // Sample training modules data
  const trainingModules: TrainingModule[] = [
    {
      id: 'module-1',
      title: 'Module 1: Introduction to Cybersecurity',
      description: 'Basic concepts and importance of cybersecurity in the workplace',
      content: `
# Module 1: Introduction to Cybersecurity

## Learning Objectives
By the end of this module, you will understand:
- What cybersecurity means for APS Lanka
- Common threats and vulnerabilities
- Your role in maintaining security

## What is Cybersecurity?
Cybersecurity is the practice of protecting our digital information, systems, and networks from cyber threats. At APS Lanka, cybersecurity is everyone's responsibility.

## Why Cybersecurity Matters
- **Data Protection**: Safeguarding sensitive company and customer information
- **Business Continuity**: Preventing disruptions to our operations
- **Reputation**: Maintaining trust with our clients and partners
- **Legal Compliance**: Meeting regulatory requirements

## Common Cyber Threats
1. **Phishing Attacks**: Fraudulent emails designed to steal credentials
2. **Malware**: Malicious software that can damage systems
3. **Social Engineering**: Manipulating people to reveal information
4. **Ransomware**: Malware that encrypts files for ransom
5. **Data Breaches**: Unauthorized access to sensitive information

## Your Role in Cybersecurity
Every employee plays a critical role in our cybersecurity defense:
- Follow security policies and procedures
- Report suspicious activities immediately
- Keep software and systems updated
- Use strong, unique passwords
- Be cautious with emails and links

## Key Takeaways
- Cybersecurity is a shared responsibility
- Threats are constantly evolving
- Prevention is better than remediation
- When in doubt, ask the IT security team

**Remember**: You are the first line of defense against cyber threats!
      `,
      duration: 25,
      completed: false,
      type: 'module',
      moduleNumber: 1
    },
    {
      id: 'quiz-1',
      title: 'Quiz 1: Cybersecurity Basics',
      description: 'Test your understanding of fundamental cybersecurity concepts',
      content: '',
      duration: 10,
      completed: false,
      type: 'quiz',
      prerequisites: ['module-1']
    },
    {
      id: 'module-2',
      title: 'Module 2: Password Security & Authentication',
      description: 'Best practices for creating and managing secure passwords',
      content: `
# Module 2: Password Security & Authentication

## Learning Objectives
- Understand password security principles
- Learn to create strong passwords
- Explore multi-factor authentication

## Password Security Fundamentals
Passwords are your first line of defense against unauthorized access. Weak passwords are one of the most common security vulnerabilities.

## Strong Password Requirements
At APS Lanka, passwords must:
- Be at least 8 characters long
- Include uppercase letters (A-Z)
- Include lowercase letters (a-z)
- Include numbers (0-9)
- Include special characters (!@#$%^&*)
- Not contain personal information
- Be unique for each account

## Password Creation Strategies
1. **Passphrase Method**: Use memorable phrases
   - Example: "I love coffee in the morning!" → ILc1tm!
2. **Acronym Method**: Create acronyms from sentences
   - Example: "My daughter was born in 2010" → Mdwbi2010!
3. **Substitution Method**: Replace letters with numbers/symbols
   - Example: "Password" → P@ssw0rd! (but avoid common substitutions)

## Password Management
- **Never reuse passwords** across multiple accounts
- **Change passwords** every 90 days
- **Use a password manager** to generate and store unique passwords
- **Don't share passwords** with colleagues
- **Report compromised passwords** immediately

## Multi-Factor Authentication (MFA)
MFA adds an extra layer of security:
- Something you know (password)
- Something you have (phone/token)
- Something you are (fingerprint)

## Common Password Mistakes
❌ Using personal information (names, birthdays)
❌ Using keyboard patterns (qwerty, 123456)
❌ Using common words (password, admin)
❌ Writing passwords on sticky notes
❌ Sharing passwords via email or chat

## Best Practices
✅ Use unique passwords for each account
✅ Enable MFA whenever possible
✅ Use a reputable password manager
✅ Regular password updates
✅ Secure password storage

Your password is the key to your digital identity - protect it well!
      `,
      duration: 30,
      completed: false,
      type: 'module',
      moduleNumber: 2
    },
    {
      id: 'quiz-2',
      title: 'Quiz 2: Password Security',
      description: 'Assess your knowledge of password security best practices',
      content: '',
      duration: 10,
      completed: false,
      type: 'quiz',
      prerequisites: ['module-2']
    },
    {
      id: 'module-3',
      title: 'Module 3: Phishing & Email Security',
      description: 'Identifying and avoiding phishing attacks and email threats',
      content: `
# Module 3: Phishing & Email Security

## Learning Objectives
- Recognize phishing attempts
- Understand email security best practices
- Learn proper incident reporting procedures

## What is Phishing?
Phishing is a cyberattack where criminals impersonate legitimate organizations to steal sensitive information like passwords, credit card numbers, or personal data.

## Types of Phishing Attacks
1. **Email Phishing**: Fraudulent emails from fake organizations
2. **Spear Phishing**: Targeted attacks on specific individuals
3. **Whaling**: Attacks targeting senior executives
4. **Smishing**: Phishing via SMS text messages
5. **Vishing**: Voice phishing over phone calls

## Red Flags to Watch For
🚩 **Urgent or threatening language**
   - "Your account will be closed immediately"
   - "Immediate action required"

🚩 **Generic greetings**
   - "Dear Customer" instead of your name
   - "Dear Sir/Madam"

🚩 **Suspicious sender addresses**
   - Misspelled company names
   - Free email providers for business communications
   - Random numbers or letters

🚩 **Poor grammar and spelling**
   - Multiple typos
   - Awkward phrasing
   - Translation errors

🚩 **Suspicious links**
   - Hover to see the real destination
   - Shortened URLs (bit.ly, tinyurl)
   - Misspelled domain names

🚩 **Unexpected attachments**
   - .exe, .zip, .scr files
   - Documents requesting macros
   - Files from unknown senders

## How to Verify Legitimate Emails
1. **Check the sender's email address** carefully
2. **Look up contact information** independently
3. **Call the organization** using official phone numbers
4. **Visit the website directly** instead of clicking links
5. **Ask your IT team** if you're unsure

## Safe Email Practices
✅ Verify sender identity before clicking links
✅ Type URLs directly into your browser
✅ Keep software and antivirus updated
✅ Report suspicious emails immediately
✅ Never provide sensitive information via email
✅ Use caution with public Wi-Fi for email

## If You Think You've Been Phished
1. **Don't panic** - quick action can minimize damage
2. **Change your passwords** immediately
3. **Contact IT security** right away
4. **Monitor your accounts** for suspicious activity
5. **Report the incident** following company procedures

## Reporting Phishing Attempts
At APS Lanka, report suspicious emails to:
- IT Security Team: security@apslanka.com
- Use the "Report Phishing" button in Outlook
- Forward the email with full headers
- Don't delete the email until instructed

Remember: When in doubt, don't click! It's better to verify than to become a victim.
      `,
      duration: 35,
      completed: false,
      type: 'module',
      moduleNumber: 3
    },
    {
      id: 'quiz-3',
      title: 'Quiz 3: Phishing & Email Security',
      description: 'Test your ability to identify phishing attempts',
      content: '',
      duration: 15,
      completed: false,
      type: 'quiz',
      prerequisites: ['module-3']
    },
    {
      id: 'module-4',
      title: 'Module 4: Data Protection & Privacy',
      description: 'Understanding data classification and protection requirements',
      content: `
# Module 4: Data Protection & Privacy

## Learning Objectives
- Understand data classification levels
- Learn data handling procedures
- Know privacy regulations and compliance

## Data Classification at APS Lanka
We classify data into three categories:

### 🔴 Confidential Data
- Customer personal information
- Financial records
- Trade secrets
- Strategic plans
- Legal documents

**Handling**: Encrypted storage, need-to-know access, secure disposal

### 🟡 Internal Data
- Employee information
- Internal procedures
- Project documents
- Training materials

**Handling**: Internal access only, standard security measures

### 🟢 Public Data
- Marketing materials
- Press releases
- Public website content
- Job postings

**Handling**: Can be shared externally, standard care required

## Data Protection Principles
1. **Minimize Data Collection**: Only collect necessary data
2. **Purpose Limitation**: Use data only for stated purposes
3. **Data Accuracy**: Keep information current and correct
4. **Storage Limitation**: Delete data when no longer needed
5. **Security**: Protect against unauthorized access
6. **Accountability**: Document data processing activities

## Personal Data Handling
When handling personal data:
- Get proper consent before collection
- Inform individuals how their data will be used
- Provide access to their data upon request
- Allow correction of inaccurate data
- Delete data when requested (where legally possible)
- Report data breaches within required timeframes

## Data Storage and Transfer
**Secure Storage:**
- Use company-approved cloud services
- Encrypt sensitive data at rest
- Regular backups with tested recovery

**Secure Transfer:**
- Use encrypted email for sensitive data
- Secure file sharing platforms
- Never use personal email for business data
- Verify recipient before sending

## Data Breach Response
If you suspect a data breach:
1. **Immediately stop** any ongoing data exposure
2. **Secure the affected systems**
3. **Contact IT Security** within 1 hour
4. **Document what happened**
5. **Preserve evidence** for investigation
6. **Follow incident response procedures**

## Privacy Rights
Individuals have the right to:
- Know what data we collect
- Access their personal data
- Correct inaccurate information
- Delete their data (right to be forgotten)
- Port their data to another organization
- Object to certain processing

## Compliance Requirements
APS Lanka must comply with:
- General Data Protection Regulation (GDPR)
- Personal Data Protection Act
- Industry-specific regulations
- Contractual obligations

## Best Practices
✅ Handle data with care and respect
✅ Use the minimum data necessary
✅ Keep data secure and confidential
✅ Report incidents immediately
✅ Stay informed about privacy laws
✅ Ask questions when uncertain

Remember: Protecting data protects our customers, our company, and our reputation.
      `,
      duration: 40,
      completed: false,
      type: 'module',
      moduleNumber: 4
    },
    {
      id: 'quiz-4',
      title: 'Quiz 4: Data Protection & Privacy',
      description: 'Evaluate your understanding of data protection requirements',
      content: '',
      duration: 15,
      completed: false,
      type: 'quiz',
      prerequisites: ['module-4']
    },
    {
      id: 'final-exam',
      title: 'Final Exam: Comprehensive Cybersecurity Assessment',
      description: 'Complete assessment covering all training modules',
      content: '',
      duration: 30,
      completed: false,
      type: 'exam',
      prerequisites: ['module-1', 'quiz-1', 'module-2', 'quiz-2', 'module-3', 'quiz-3', 'module-4', 'quiz-4']
    }
  ]

  useEffect(() => {
    // Simulate loading user progress from API
    setTimeout(() => {
      setUserProgress({
        'module-1': true,
        'quiz-1': true,
        'module-2': false,
        // ... other progress data
      })
      setLoading(false)
      // Set first incomplete module as selected
      const firstIncomplete = trainingModules.find(module => !userProgress[module.id])
      setSelectedModule(firstIncomplete || trainingModules[0])
    }, 1000)
  }, [])

  const getModuleIcon = (module: TrainingModule) => {
    switch (module.type) {
      case 'module':
        return <BookOpen className="h-5 w-5" />
      case 'quiz':
        return <HelpCircle className="h-5 w-5" />
      case 'exam':
        return <Award className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getModuleStatus = (module: TrainingModule) => {
    if (userProgress[module.id]) {
      return { icon: <CheckCircle className="h-4 w-4 text-green-500" />, text: 'Completed', color: 'text-green-600' }
    }
    
    if (module.prerequisites) {
      const prereqsCompleted = module.prerequisites.every(prereq => userProgress[prereq])
      if (!prereqsCompleted) {
        return { icon: <Clock className="h-4 w-4 text-gray-400" />, text: 'Locked', color: 'text-gray-400' }
      }
    }
    
    return { icon: <PlayCircle className="h-4 w-4 text-blue-500" />, text: 'Available', color: 'text-blue-600' }
  }

  const canAccessModule = (module: TrainingModule) => {
    if (!module.prerequisites) return true
    return module.prerequisites.every(prereq => userProgress[prereq])
  }

  const handleModuleClick = (module: TrainingModule) => {
    if (canAccessModule(module)) {
      setSelectedModule(module)
    }
  }

  const handleCompleteModule = () => {
    if (selectedModule) {
      setUserProgress(prev => ({ ...prev, [selectedModule.id]: true }))
      
      // Auto-advance to next available module
      const currentIndex = trainingModules.findIndex(m => m.id === selectedModule.id)
      const nextModule = trainingModules[currentIndex + 1]
      if (nextModule && canAccessModule(nextModule)) {
        setSelectedModule(nextModule)
      }
    }
  }

  const calculateProgress = () => {
    const completed = Object.values(userProgress).filter(Boolean).length
    return Math.round((completed / trainingModules.length) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading training modules...</span>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Left Sidebar - Module List */}
      <div className="w-1/3 bg-gradient-to-b from-blue-50 to-white border-r border-gray-200 overflow-y-auto">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Training Modules</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Your Progress</span>
              <span className="text-lg font-bold text-primary-600">{calculateProgress()}%</span>
            </div>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Started</span>
              <span>In Progress</span>
              <span>Complete</span>
            </div>
          </div>

          {/* Module List */}
          <div className="space-y-2">
            {trainingModules.map((module) => {
              const status = getModuleStatus(module)
              const isSelected = selectedModule?.id === module.id
              const isAccessible = canAccessModule(module)
              
              return (
                <button
                  key={module.id}
                  onClick={() => handleModuleClick(module)}
                  disabled={!isAccessible}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] ${
                    isSelected
                      ? 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-300 shadow-lg'
                      : isAccessible
                      ? 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md text-gray-900'
                      : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected 
                          ? 'bg-primary-500 text-white shadow-md' 
                          : isAccessible 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        {getModuleIcon(module)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm leading-tight mb-1">{module.title}</h3>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-3">{module.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                            <Clock className="h-3 w-3 mr-1" />
                            {module.duration} min
                          </span>
                          <div className={`flex items-center space-x-1 text-xs font-medium ${status.color}`}>
                            {status.icon}
                            <span>{status.text}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0 ml-2">
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                          <ChevronRight className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedModule ? (
          <>
            {/* Enhanced Content Header */}
            <div className="bg-gradient-to-r from-white to-blue-50 border-b border-gray-200 px-8 py-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
                      {getModuleIcon(selectedModule)}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{selectedModule.title}</h1>
                      <p className="text-primary-600 font-medium">Module {selectedModule.moduleNumber || 'Assessment'}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">{selectedModule.description}</p>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-700">{selectedModule.duration} minutes</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="font-medium text-gray-700 capitalize">{selectedModule.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                    {getModuleStatus(selectedModule).icon}
                  </div>
                  <span className="text-xs font-medium text-gray-600 mt-2">Status</span>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto bg-white">
              {selectedModule.type === 'module' ? (
                <div className="px-6 py-8">
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {selectedModule.content}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="px-8 py-12 text-center">
                  <div className="max-w-lg mx-auto">
                    <div className="bg-gradient-to-br from-blue-50 to-primary-50 rounded-2xl p-8 border border-blue-200 shadow-sm">
                      {selectedModule.type === 'quiz' ? (
                        <>
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <HelpCircle className="h-10 w-10 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready for the Quiz?</h3>
                          <p className="text-gray-600 mb-8 leading-relaxed">
                            Test your knowledge with {selectedModule.title}. 
                            You'll have {selectedModule.duration} minutes to complete it.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <Award className="h-10 w-10 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-4">Final Assessment</h3>
                          <p className="text-gray-600 mb-8 leading-relaxed">
                            Complete your cybersecurity training with this comprehensive assessment.
                            You'll have {selectedModule.duration} minutes to demonstrate your knowledge.
                          </p>
                        </>
                      )}
                      <button
                        onClick={() => {
                          // In real app, this would open quiz modal
                          alert(`Starting ${selectedModule.title}...`)
                          handleCompleteModule()
                        }}
                        className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Start {selectedModule.type === 'exam' ? 'Final Assessment' : 'Quiz'} →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Content Footer - Next Button */}
            {selectedModule.type === 'module' && !userProgress[selectedModule.id] && (
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Mark this module as complete to unlock the next section
                  </div>
                  <button
                    onClick={handleCompleteModule}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <span>Complete Module</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Training Module</h3>
              <p className="text-gray-600">Choose a module from the left to begin your cybersecurity training.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrainingTab