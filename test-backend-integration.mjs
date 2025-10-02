#!/usr/bin/env node

/**
 * Backend Integration Test Script
 * Tests both Supabase API routes and Spring Boot backend endpoints
 */

// Using built-in fetch (Node.js 18+)

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:8080';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  log(`\n🧪 Testing: ${name}`, 'blue');
}

function logPass(message) {
  log(`✅ ${message}`, 'green');
}

function logFail(message) {
  log(`❌ ${message}`, 'red');
}

function logWarn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test helper functions
async function testEndpoint(url, options = {}) {
  try {
    const response = await fetch(url, {
      timeout: 5000,
      ...options
    });
    return {
      success: true,
      status: response.status,
      data: response.ok ? await response.json() : await response.text()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Test Supabase API routes (through Next.js API)
async function testSupabaseIntegration() {
  logTest('Supabase Integration via Next.js API Routes');
  
  // Test transformers endpoint
  const transformersResult = await testEndpoint(`${FRONTEND_URL}/api/transformers`);
  if (transformersResult.success && transformersResult.status === 200) {
    logPass(`Transformers API: GET /api/transformers - ${Array.isArray(transformersResult.data) ? transformersResult.data.length : 0} transformers found`);
  } else {
    logFail(`Transformers API: ${transformersResult.error || `HTTP ${transformersResult.status}`}`);
  }

  // Test images endpoint
  const imagesResult = await testEndpoint(`${FRONTEND_URL}/api/images`);
  if (imagesResult.success && imagesResult.status === 200) {
    logPass(`Images API: GET /api/images - ${Array.isArray(imagesResult.data) ? imagesResult.data.length : 0} images found`);
  } else {
    logFail(`Images API: ${imagesResult.error || `HTTP ${imagesResult.status}`}`);
  }

  // Test inspections endpoint
  const inspectionsResult = await testEndpoint(`${FRONTEND_URL}/api/inspections`);
  if (inspectionsResult.success && inspectionsResult.status === 200) {
    logPass(`Inspections API: GET /api/inspections - ${Array.isArray(inspectionsResult.data) ? inspectionsResult.data.length : 0} inspections found`);
  } else {
    logFail(`Inspections API: ${inspectionsResult.error || `HTTP ${inspectionsResult.status}`}`);
  }

  // Test auth endpoints
  const authMeResult = await testEndpoint(`${FRONTEND_URL}/api/auth/me`);
  if (authMeResult.success) {
    logPass(`Auth API: GET /api/auth/me - HTTP ${authMeResult.status}`);
  } else {
    logFail(`Auth API: ${authMeResult.error}`);
  }
}

// Test Spring Boot backend endpoints
async function testSpringBootBackend() {
  logTest('Spring Boot Backend Direct API Tests');
  
  // Test if backend is running
  const healthResult = await testEndpoint(`${BACKEND_URL}/api/transformers`);
  if (!healthResult.success) {
    logWarn('Spring Boot backend is not running. Starting backend tests...');
    logFail(`Backend connection: ${healthResult.error}`);
    return false;
  }

  logPass('Backend is running!');

  // Test transformers CRUD
  const transformersResult = await testEndpoint(`${BACKEND_URL}/api/transformers`);
  if (transformersResult.success && transformersResult.status === 200) {
    logPass(`Backend Transformers: GET /api/transformers - ${Array.isArray(transformersResult.data) ? transformersResult.data.length : 0} transformers`);
  } else {
    logFail(`Backend Transformers: ${transformersResult.error || `HTTP ${transformersResult.status}`}`);
  }

  // Test images CRUD
  const imagesResult = await testEndpoint(`${BACKEND_URL}/api/images`);
  if (imagesResult.success && imagesResult.status === 200) {
    logPass(`Backend Images: GET /api/images - ${Array.isArray(imagesResult.data) ? imagesResult.data.length : 0} images`);
  } else {
    logFail(`Backend Images: ${imagesResult.error || `HTTP ${imagesResult.status}`}`);
  }

  // Test inspections CRUD
  const inspectionsResult = await testEndpoint(`${BACKEND_URL}/api/inspections`);
  if (inspectionsResult.success && inspectionsResult.status === 200) {
    logPass(`Backend Inspections: GET /api/inspections - ${Array.isArray(inspectionsResult.data) ? inspectionsResult.data.length : 0} inspections`);
  } else {
    logFail(`Backend Inspections: ${inspectionsResult.error || `HTTP ${inspectionsResult.status}`}`);
  }

  // Test auth endpoints
  const authResult = await testEndpoint(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  if (authResult.success) {
    logPass(`Backend Auth: POST /api/auth/login - HTTP ${authResult.status}`);
  } else {
    logFail(`Backend Auth: ${authResult.error || `HTTP ${authResult.status}`}`);
  }

  // Test seed endpoint
  const seedResult = await testEndpoint(`${BACKEND_URL}/api/seed`, {
    method: 'POST'
  });
  if (seedResult.success && [200, 201].includes(seedResult.status)) {
    logPass(`Backend Seed: POST /api/seed - HTTP ${seedResult.status}`);
  } else {
    logFail(`Backend Seed: ${seedResult.error || `HTTP ${seedResult.status}`}`);
  }

  return true;
}

// Test CREATE operations
async function testCreateOperations() {
  logTest('CREATE Operations Test');

  // Test creating a transformer via Supabase API
  const newTransformer = {
    id: 'TEST-001',
    poleNo: 'TEST-POLE-001',
    region: 'Test Region',
    type: 'Distribution',
    capacity: '100kVA',
    location: 'Test Location'
  };

  const createResult = await testEndpoint(`${FRONTEND_URL}/api/transformers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newTransformer)
  });

  if (createResult.success && [200, 201].includes(createResult.status)) {
    logPass(`Create Transformer: POST /api/transformers - HTTP ${createResult.status}`);
    
    // Test retrieving the created transformer
    const getResult = await testEndpoint(`${FRONTEND_URL}/api/transformers/TEST-001`);
    if (getResult.success && getResult.status === 200) {
      logPass('Retrieve Created Transformer: GET /api/transformers/TEST-001 - Found');
    } else {
      logFail(`Retrieve Created Transformer: ${getResult.error || `HTTP ${getResult.status}`}`);
    }
  } else {
    logFail(`Create Transformer: ${createResult.error || `HTTP ${createResult.status}`}`);
  }
}

// Main test runner
async function runTests() {
  log('🚀 Starting Backend Integration Tests\n', 'blue');
  
  try {
    // Test 1: Supabase Integration via Next.js
    await testSupabaseIntegration();
    
    // Test 2: Spring Boot Backend (if available)
    const backendAvailable = await testSpringBootBackend();
    
    // Test 3: CRUD Operations
    await testCreateOperations();
    
    log('\n📊 Test Summary:', 'blue');
    logPass('Supabase integration via Next.js API routes tested');
    
    if (backendAvailable) {
      logPass('Spring Boot backend integration tested');
    } else {
      logWarn('Spring Boot backend not available - install Maven and run: mvn spring-boot:run');
    }
    
    log('\n💡 To test Spring Boot backend:', 'yellow');
    log('1. Install Maven: winget install Maven.Maven', 'yellow');
    log('2. Navigate to backend directory: cd backend', 'yellow');
    log('3. Start backend: mvn spring-boot:run', 'yellow');
    log('4. Re-run this test script', 'yellow');
    
  } catch (error) {
    logFail(`Test execution failed: ${error.message}`);
  }
}

// Run the tests
runTests().catch(console.error);