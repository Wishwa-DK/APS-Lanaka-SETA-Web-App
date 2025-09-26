'use client'

import React, { useState, useEffect } from 'react'
import { X, HelpCircle, CheckCircle, XCircle, Clock, Trophy } from 'lucide-react'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  category: 'policy' | 'training' | 'compliance'
}

interface QuizModalProps {
  onClose: () => void
}

const QuizModal: React.FC<QuizModalProps> = ({ onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [loading, setLoading] = useState(false)

  // Sample quiz questions - in real app, these would come from API
  const quizQuestions: Question[] = [
    {
      id: '1',
      question: 'What is the most common method cybercriminals use to gain unauthorized access to systems?',
      options: [
        'Physical theft of devices',
        'Phishing emails',
        'Brute force attacks',
        'SQL injection'
      ],
      correctAnswer: 1,
      explanation: 'Phishing emails are the most common attack vector, accounting for over 80% of security incidents.',
      category: 'training'
    },
    {
      id: '2',
      question: 'According to company policy, how often should you change your password?',
      options: [
        'Every 30 days',
        'Every 60 days',
        'Every 90 days',
        'Every 180 days'
      ],
      correctAnswer: 2,
      explanation: 'Company policy requires password changes every 90 days to maintain security.',
      category: 'policy'
    },
    {
      id: '3',
      question: 'Which of the following is NOT a requirement for compliance with data protection regulations?',
      options: [
        'Data encryption at rest',
        'Regular security audits',
        'Unlimited data retention',
        'Access control mechanisms'
      ],
      correctAnswer: 2,
      explanation: 'Data protection regulations require limited retention periods, not unlimited storage.',
      category: 'compliance'
    },
    {
      id: '4',
      question: 'What should you do if you receive a suspicious email asking for personal information?',
      options: [
        'Reply with the requested information',
        'Forward it to colleagues',
        'Delete it immediately and report to IT',
        'Click the links to verify authenticity'
      ],
      correctAnswer: 2,
      explanation: 'Always delete suspicious emails and report them to the IT security team.',
      category: 'training'
    },
    {
      id: '5',
      question: 'What is the minimum password complexity requirement in our security policy?',
      options: [
        '6 characters with numbers',
        '8 characters with uppercase, lowercase, numbers',
        '8 characters with uppercase, lowercase, numbers, and special characters',
        '12 characters with any combination'
      ],
      correctAnswer: 2,
      explanation: 'Strong passwords must be at least 8 characters with uppercase, lowercase, numbers, and special characters.',
      category: 'policy'
    }
  ]

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResults) {
      handleFinishQuiz()
    }
  }, [timeLeft, showResults])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answerIndex
    setSelectedAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleFinishQuiz = async () => {
    setLoading(true)
    
    // Simulate API call to save quiz results
    setTimeout(() => {
      setShowResults(true)
      setLoading(false)
    }, 1000)
  }

  const calculateScore = () => {
    let correct = 0
    selectedAnswers.forEach((answer, index) => {
      if (answer === quizQuestions[index].correctAnswer) {
        correct++
      }
    })
    return {
      correct,
      total: quizQuestions.length,
      percentage: Math.round((correct / quizQuestions.length) * 100)
    }
  }

  const score = calculateScore()

  if (showResults) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Results Header */}
          <div className={`p-6 text-white rounded-t-lg ${
            score.percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-green-600' :
            score.percentage >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
            'bg-gradient-to-r from-red-500 to-red-600'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold">Quiz Complete!</h2>
                  <p className="text-sm opacity-90">Your cybersecurity knowledge assessment</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Score Summary */}
          <div className="p-6">
            <div className="text-center mb-8">
              <div className={`text-6xl font-bold mb-2 ${
                score.percentage >= 80 ? 'text-green-600' :
                score.percentage >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {score.percentage}%
              </div>
              <p className="text-xl text-gray-700 mb-2">
                {score.correct} out of {score.total} correct
              </p>
              <p className="text-gray-600">
                {score.percentage >= 80 ? 'Excellent work! You have a strong understanding of cybersecurity.' :
                 score.percentage >= 60 ? 'Good job! Consider reviewing some areas for improvement.' :
                 'Keep learning! Additional training is recommended.'}
              </p>
            </div>

            {/* Question Review */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Review</h3>
              {quizQuestions.map((question, index) => {
                const userAnswer = selectedAnswers[index]
                const isCorrect = userAnswer === question.correctAnswer
                
                return (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 flex-1">{question.question}</h4>
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <p className="text-gray-600">
                        <span className="font-medium">Your answer:</span> {question.options[userAnswer] || 'Not answered'}
                      </p>
                      {!isCorrect && (
                        <p className="text-green-600">
                          <span className="font-medium">Correct answer:</span> {question.options[question.correctAnswer]}
                        </p>
                      )}
                      <p className="text-gray-600 bg-gray-50 p-2 rounded mt-2">
                        <span className="font-medium">Explanation:</span> {question.explanation}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Action Button */}
            <div className="flex justify-center mt-8">
              <button
                onClick={onClose}
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentQ = quizQuestions[currentQuestion]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
          <div className="flex items-center">
            <HelpCircle className="h-6 w-6 mr-3" />
            <div>
              <h2 className="text-xl font-semibold">Cybersecurity Knowledge Quiz</h2>
              <p className="text-sm opacity-90">Test your understanding of policies, training, and compliance</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{formatTime(timeLeft)}</span>
            </div>
            <button
              onClick={onClose}
              className="text-green-100 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestion + 1} of {quizQuestions.length}
            </span>
            <span className="text-sm text-gray-600 capitalize">
              {currentQ.category}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {currentQ.question}
          </h3>

          {/* Answer Options */}
          <div className="space-y-3 mb-8">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  selectedAnswers[currentQuestion] === index
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedAnswers[currentQuestion] === index
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedAnswers[currentQuestion] === index && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                  <span className="ml-2">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
              className="px-4 py-2 text-gray-600 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md font-medium transition-colors"
            >
              Previous
            </button>

            <div className="flex space-x-3">
              {currentQuestion === quizQuestions.length - 1 ? (
                <button
                  onClick={handleFinishQuiz}
                  disabled={selectedAnswers.length !== quizQuestions.length || loading}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md font-medium transition-colors"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trophy className="h-4 w-4" />
                  )}
                  <span>Finish Quiz</span>
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  disabled={selectedAnswers[currentQuestion] === undefined}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md font-medium transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuizModal