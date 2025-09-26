// Clean database script - Remove all test data for production setup
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./server/models/User');
const Policy = require('./server/models/Policy');

const cleanDatabase = async () => {
  try {
    console.log('🧹 CLEANING DATABASE FOR PRODUCTION SETUP\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}\n`);

    // Check current data
    const userCount = await User.countDocuments();
    const policyCount = await Policy.countDocuments();
    
    console.log('📋 Current Database State:');
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   📄 Policies: ${policyCount}\n`);

    if (userCount === 0 && policyCount === 0) {
      console.log('✅ Database is already clean!');
      process.exit(0);
    }

    // List current users before deletion
    if (userCount > 0) {
      console.log('👥 Current Users (will be deleted):');
      const users = await User.find({}).select('email firstName lastName role department');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - ${user.firstName} ${user.lastName} (${user.role}/${user.department})`);
      });
      console.log('');
    }

    // List current policies before deletion
    if (policyCount > 0) {
      console.log('📄 Current Policies (will be deleted):');
      const policies = await Policy.find({}).select('title status targetAudience.departments');
      policies.forEach((policy, index) => {
        const targets = policy.targetAudience.allUsers ? 'All Users' : 
                       policy.targetAudience.departments.join(', ') || 'Specific Users';
        console.log(`   ${index + 1}. "${policy.title}" - Status: ${policy.status} - Target: ${targets}`);
      });
      console.log('');
    }

    // Confirmation prompt (in production, we'll skip this)
    console.log('⚠️  WARNING: This will DELETE ALL existing data!');
    console.log('   - All users (including admins)');
    console.log('   - All policies');
    console.log('   - All authentication data');
    console.log('   - All acknowledgments and login history\n');

    // Delete all data
    console.log('🗑️  Deleting all data...');
    
    const deletedUsers = await User.deleteMany({});
    console.log(`   ✅ Deleted ${deletedUsers.deletedCount} users`);
    
    const deletedPolicies = await Policy.deleteMany({});
    console.log(`   ✅ Deleted ${deletedPolicies.deletedCount} policies`);

    console.log('\n🎉 DATABASE CLEANED SUCCESSFULLY!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Set up user registration system');
    console.log('   2. Create first admin user through signup');
    console.log('   3. Build proper user management');
    console.log('   4. Remove all test credentials from code');
    console.log('\n✨ Ready for production user registration!');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
};

cleanDatabase();