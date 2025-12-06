// Jest setup file
// Add any global test setup here

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/algotrader_test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
