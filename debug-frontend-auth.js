#!/usr/bin/env node

// Simple Node.js script to test frontend authentication flow
import fetch from 'node-fetch';

const SERVER_URL = 'https://mobileuurka-gcp-server-v2-864851114868.europe-west4.run.app/api/v1';

console.log('🔍 Frontend Authentication Debug');
console.log('===============================\n');

console.log('🌐 Server URL:', SERVER_URL);

async function testServerHealth() {
  console.log('1. Testing server health...');
  try {
    const response = await fetch(SERVER_URL.replace('/api/v1', '/health'));
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Server is healthy');
      console.log('   Status:', data.status);
      console.log('   Environment:', data.environment);
      return true;
    } else {
      console.log('❌ Server health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot reach server:', error.message);
    return false;
  }
}

async function testCORS() {
  console.log('\n2. Testing CORS...');
  try {
    const response = await fetch(`${SERVER_URL}/cors-test`, {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5173',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ CORS test passed');
      console.log('   Message:', data.message);
      return true;
    } else {
      console.log('❌ CORS test failed');
      return false;
    }
  } catch (error) {
    console.log('❌ CORS test error:', error.message);
    return false;
  }
}

async function testAuthEndpoint() {
  console.log('\n3. Testing auth endpoint without token...');
  try {
    const response = await fetch(`${SERVER_URL}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      console.log('✅ Auth endpoint correctly returns 401 without token');
      const data = await response.json();
      console.log('   Error message:', data.error);
      return true;
    } else {
      console.log('❌ Auth endpoint should return 401 without token, got:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Auth endpoint test error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('Starting frontend authentication debug tests...\n');
  
  const serverHealthy = await testServerHealth();
  const corsWorking = await testCORS();
  const authWorking = await testAuthEndpoint();
  
  console.log('\n📊 Test Results:');
  console.log('================');
  console.log('Server Health:', serverHealthy ? '✅ PASS' : '❌ FAIL');
  console.log('CORS:', corsWorking ? '✅ PASS' : '❌ FAIL');
  console.log('Auth Endpoint:', authWorking ? '✅ PASS' : '❌ FAIL');
  
  console.log('\n💡 Frontend Debugging Tips:');
  console.log('===========================');
  console.log('1. Open browser dev tools (F12)');
  console.log('2. Check Console tab for errors');
  console.log('3. Check Network tab for failed requests');
  console.log('4. Check Application tab > Local Storage for access_token');
  console.log('5. If no token exists, you need to login first');
  
  if (!serverHealthy) {
    console.log('\n🚨 Server is not responding - this is likely the main issue');
  } else if (!corsWorking) {
    console.log('\n🚨 CORS is blocking requests - check server CORS configuration');
  } else if (!authWorking) {
    console.log('\n🚨 Auth endpoint not working properly');
  } else {
    console.log('\n✅ Server appears to be working correctly');
    console.log('   The issue is likely in the frontend authentication flow');
    console.log('   Check if you have a valid token in localStorage');
  }
  
  process.exit(0);
}

runTests();