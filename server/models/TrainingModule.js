const mongoose = require('mongoose');

const trainingModuleSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Training module title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Module description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  objectives: [{
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Objective cannot exceed 200 characters'],
  }],
  
  // Content & Structure
  content: {
    type: String,
    required: [true, 'Training content is required'],
  },
  duration: {
    estimated: {
      type: Number, // in minutes
      required: [true, 'Estimated duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
      max: [480, 'Duration cannot exceed 8 hours'],
    },
    actual: {
      type: Number, // average actual completion time
      default: 0,
    },
  },
  
  // Classification & Organization
  category: {
    type: String,
    required: [true, 'Training category is required'],
    enum: {
      values: [
        'phishing_awareness',
        'password_security',
        'data_protection',
        'social_engineering',
        'mobile_security',
        'email_security',
        'web_browsing_safety',
        'incident_reporting',
        'physical_security',
        'remote_work_security',
        'compliance_training',
        'privacy_awareness'
      ],
      message: 'Invalid training category'
    },
    index: true,
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: [100, 'Subcategory cannot exceed 100 characters'],
  },
  difficulty: {
    type: String,
    enum: {
      values: ['beginner', 'intermediate', 'advanced'],
      message: 'Invalid difficulty level'
    },
    default: 'beginner',
    index: true,
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters'],
  }],
  
  // Content Sections
  sections: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Section title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'video', 'interactive', 'quiz', 'simulation'],
      default: 'text',
    },
    duration: Number, // in minutes
    media: [{
      type: {
        type: String,
        enum: ['image', 'video', 'audio', 'document', 'interactive'],
      },
      url: String,
      filename: String,
      size: Number,
      description: String,
    }],
    order: {
      type: Number,
      required: true,
      default: 0,
    },
  }],
  
  // Assessment & Quizzes
  assessments: [{
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['multiple_choice', 'true_false', 'scenario', 'simulation'],
      default: 'multiple_choice',
    },
    questions: [{
      question: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['multiple_choice', 'true_false', 'text_input', 'scenario'],
        default: 'multiple_choice',
      },
      options: [String], // For multiple choice questions
      correctAnswer: mongoose.Schema.Types.Mixed, // Can be string, number, or array
      explanation: String,
      points: {
        type: Number,
        default: 1,
      },
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
      },
    }],
    passingScore: {
      type: Number,
      default: 80,
      min: [0, 'Passing score cannot be negative'],
      max: [100, 'Passing score cannot exceed 100'],
    },
    maxAttempts: {
      type: Number,
      default: 3,
      min: [1, 'Must allow at least 1 attempt'],
    },
    timeLimit: Number, // in minutes
  }],
  
  // Prerequisites & Dependencies
  prerequisites: [{
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingModule',
    },
    required: {
      type: Boolean,
      default: true,
    },
  }],
  
  // Status & Lifecycle
  status: {
    type: String,
    enum: {
      values: ['draft', 'review', 'approved', 'published', 'archived'],
      message: 'Invalid module status'
    },
    default: 'draft',
    index: true,
  },
  version: {
    type: String,
    default: '1.0',
  },
  
  // Assignment & Targeting
  targetAudience: {
    departments: [{
      type: String,
      trim: true,
    }],
    roles: [{
      type: String,
      enum: ['admin', 'manager', 'employee', 'contractor', 'all'],
    }],
    specificUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    allUsers: {
      type: Boolean,
      default: false,
    },
  },
  
  mandatory: {
    type: Boolean,
    default: false,
  },
  deadlineType: {
    type: String,
    enum: ['fixed_date', 'days_from_assignment', 'recurring'],
    default: 'days_from_assignment',
  },
  deadline: {
    fixedDate: Date,
    daysFromAssignment: {
      type: Number,
      default: 30,
    },
    recurringInterval: {
      type: String,
      enum: ['monthly', 'quarterly', 'semi_annually', 'annually'],
    },
  },
  
  // Tracking & Analytics
  enrollments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    startedAt: Date,
    completedAt: Date,
    status: {
      type: String,
      enum: ['enrolled', 'in_progress', 'completed', 'failed', 'expired'],
      default: 'enrolled',
    },
    progress: {
      sectionsCompleted: {
        type: Number,
        default: 0,
      },
      totalSections: Number,
      currentSection: {
        type: Number,
        default: 0,
      },
      timeSpent: {
        type: Number,
        default: 0, // in minutes
      },
    },
    attempts: [{
      attemptNumber: Number,
      startedAt: Date,
      completedAt: Date,
      score: Number,
      passed: Boolean,
      answers: [{
        questionId: String,
        answer: mongoose.Schema.Types.Mixed,
        correct: Boolean,
        points: Number,
      }],
    }],
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificateId: String,
  }],
  
  // Content Management
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // File Attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    type: {
      type: String,
      enum: ['resource', 'template', 'certificate_template'],
      default: 'resource',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Metrics & Analytics
  metrics: {
    totalEnrollments: {
      type: Number,
      default: 0,
    },
    completionRate: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    averageCompletionTime: {
      type: Number,
      default: 0, // in minutes
    },
    passRate: {
      type: Number,
      default: 0,
    },
  },
  
  // Feedback & Reviews
  feedback: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for performance
trainingModuleSchema.index({ status: 1, category: 1 });
trainingModuleSchema.index({ 'targetAudience.departments': 1 });
trainingModuleSchema.index({ 'targetAudience.roles': 1 });
trainingModuleSchema.index({ mandatory: 1 });
trainingModuleSchema.index({ createdAt: -1 });
trainingModuleSchema.index({ title: 'text', description: 'text' });

// Virtual fields
trainingModuleSchema.virtual('totalSections').get(function() {
  return this.sections.length;
});

trainingModuleSchema.virtual('totalQuestions').get(function() {
  return this.assessments.reduce((total, assessment) => total + assessment.questions.length, 0);
});

// Methods
trainingModuleSchema.methods.enrollUser = async function(userId, assignedBy = null) {
  // Check if user is already enrolled
  const existingEnrollment = this.enrollments.find(
    enrollment => enrollment.user.toString() === userId.toString()
  );
  
  if (existingEnrollment) {
    throw new Error('User is already enrolled in this module');
  }
  
  // Add enrollment
  this.enrollments.push({
    user: userId,
    enrolledAt: new Date(),
    status: 'enrolled',
    progress: {
      sectionsCompleted: 0,
      totalSections: this.sections.length,
      currentSection: 0,
      timeSpent: 0,
    },
  });
  
  // Update metrics
  this.metrics.totalEnrollments += 1;
  
  return this.save();
};

trainingModuleSchema.methods.updateUserProgress = async function(userId, sectionIndex, timeSpent = 0) {
  const enrollment = this.enrollments.find(
    enrollment => enrollment.user.toString() === userId.toString()
  );
  
  if (!enrollment) {
    throw new Error('User is not enrolled in this module');
  }
  
  // Update progress
  enrollment.progress.currentSection = Math.max(enrollment.progress.currentSection, sectionIndex + 1);
  enrollment.progress.sectionsCompleted = Math.max(
    enrollment.progress.sectionsCompleted, 
    sectionIndex + 1
  );
  enrollment.progress.timeSpent += timeSpent;
  
  // Update status
  if (enrollment.status === 'enrolled') {
    enrollment.status = 'in_progress';
    enrollment.startedAt = new Date();
  }
  
  return this.save();
};

trainingModuleSchema.methods.completeAssessment = async function(userId, assessmentIndex, answers) {
  const enrollment = this.enrollments.find(
    enrollment => enrollment.user.toString() === userId.toString()
  );
  
  if (!enrollment) {
    throw new Error('User is not enrolled in this module');
  }
  
  const assessment = this.assessments[assessmentIndex];
  if (!assessment) {
    throw new Error('Assessment not found');
  }
  
  // Calculate score
  let totalPoints = 0;
  let earnedPoints = 0;
  const gradedAnswers = [];
  
  assessment.questions.forEach((question, index) => {
    totalPoints += question.points;
    const userAnswer = answers[index];
    const isCorrect = this.checkAnswer(question, userAnswer);
    
    gradedAnswers.push({
      questionId: question._id.toString(),
      answer: userAnswer,
      correct: isCorrect,
      points: isCorrect ? question.points : 0,
    });
    
    if (isCorrect) {
      earnedPoints += question.points;
    }
  });
  
  const score = Math.round((earnedPoints / totalPoints) * 100);
  const passed = score >= assessment.passingScore;
  
  // Record attempt
  const attemptNumber = enrollment.attempts.length + 1;
  enrollment.attempts.push({
    attemptNumber,
    startedAt: new Date(),
    completedAt: new Date(),
    score,
    passed,
    answers: gradedAnswers,
  });
  
  // Update status if passed and all sections completed
  if (passed && enrollment.progress.sectionsCompleted >= this.sections.length) {
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
    
    // Update module metrics
    this.updateCompletionMetrics();
  }
  
  return this.save();
};

trainingModuleSchema.methods.checkAnswer = function(question, userAnswer) {
  switch (question.type) {
    case 'multiple_choice':
      return question.correctAnswer === userAnswer;
    case 'true_false':
      return question.correctAnswer === userAnswer;
    case 'text_input':
      return question.correctAnswer.toLowerCase() === userAnswer.toLowerCase();
    default:
      return false;
  }
};

trainingModuleSchema.methods.updateCompletionMetrics = function() {
  const completedEnrollments = this.enrollments.filter(e => e.status === 'completed');
  const totalEnrollments = this.enrollments.length;
  
  if (totalEnrollments > 0) {
    this.metrics.completionRate = Math.round((completedEnrollments.length / totalEnrollments) * 100);
    
    // Calculate average score
    const scores = completedEnrollments
      .map(e => e.attempts[e.attempts.length - 1]?.score)
      .filter(score => score !== undefined);
    
    if (scores.length > 0) {
      this.metrics.averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    }
    
    // Calculate average completion time
    const completionTimes = completedEnrollments
      .map(e => e.progress.timeSpent)
      .filter(time => time > 0);
    
    if (completionTimes.length > 0) {
      this.metrics.averageCompletionTime = Math.round(
        completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      );
    }
    
    // Calculate pass rate
    const passedEnrollments = completedEnrollments.filter(e => 
      e.attempts.some(attempt => attempt.passed)
    );
    this.metrics.passRate = Math.round((passedEnrollments.length / totalEnrollments) * 100);
  }
};

trainingModuleSchema.methods.addFeedback = async function(userId, rating, comment = '') {
  // Check if user has already provided feedback
  const existingFeedback = this.feedback.find(
    feedback => feedback.user.toString() === userId.toString()
  );
  
  if (existingFeedback) {
    existingFeedback.rating = rating;
    existingFeedback.comment = comment;
    existingFeedback.submittedAt = new Date();
  } else {
    this.feedback.push({
      user: userId,
      rating,
      comment,
      submittedAt: new Date(),
    });
  }
  
  // Update average rating
  const totalRating = this.feedback.reduce((sum, feedback) => sum + feedback.rating, 0);
  this.averageRating = totalRating / this.feedback.length;
  
  return this.save();
};

// Static methods
trainingModuleSchema.statics.getModulesForUser = function(userId, userDepartment, userRole) {
  return this.find({
    status: 'published',
    $or: [
      { 'targetAudience.allUsers': true },
      { 'targetAudience.departments': userDepartment },
      { 'targetAudience.roles': userRole },
      { 'targetAudience.specificUsers': userId }
    ]
  });
};

trainingModuleSchema.statics.getMandatoryModules = function() {
  return this.find({
    status: 'published',
    mandatory: true
  });
};

trainingModuleSchema.statics.getModulesByCategory = function(category) {
  return this.find({
    status: 'published',
    category: category
  });
};

module.exports = mongoose.model('TrainingModule', trainingModuleSchema);