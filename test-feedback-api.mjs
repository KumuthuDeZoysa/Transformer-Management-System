/**
 * Test script for the Feedback Logging System
 * 
 * This script tests the feedback logging API endpoints
 * Run with: node test-feedback-api.mjs
 */

const BASE_URL = 'http://localhost:3000'

// Test data with detailed annotation structure
const testFeedbackLog = {
  image_id: 'test_img_' + Date.now(),
  model_predicted_anomalies: {
    detections: [
      {
        x: 100,
        y: 150,
        width: 200,
        height: 180,
        label: 'Point Overload',
        type: 'Point Overload (Faulty)',
        confidence: 0.85,
        severity: 'Critical',
        isAI: true,
        action: 'confirmed',
        annotationType: 'AI_GENERATED'
      },
      {
        x: 300,
        y: 250,
        width: 150,
        height: 130,
        label: 'Thermal Hotspot',
        type: 'Thermal Hotspot',
        confidence: 0.72,
        severity: 'Warning',
        isAI: true,
        action: 'confirmed',
        annotationType: 'AI_GENERATED'
      },
      {
        x: 500,
        y: 400,
        width: 120,
        height: 110,
        label: 'Insulation Damage',
        type: 'Insulation Damage',
        confidence: 0.68,
        severity: 'Warning',
        isAI: true,
        action: 'confirmed',
        annotationType: 'AI_GENERATED'
      }
    ],
    label: 'Critical',
    confidence: 0.89,
    detectionCount: 3,
    metadata: {
      modelVersion: 'v1.2.3',
      processingTime: 1250,
      imageUrl: 'https://example.com/thermal_image.jpg'
    }
  },
  final_accepted_annotations: {
    detections: [
      {
        x: 105,
        y: 148,
        width: 195,
        height: 178,
        label: 'Point Overload (Verified)',
        type: 'Point Overload (Faulty)',
        confidence: 1.0,
        severity: 'Critical',
        isAI: false,
        action: 'edited',
        annotationType: 'USER_EDITED',
        notes: 'Adjusted bounding box for better fit',
        modificationTypes: ['resized', 'relocated'],
        modificationDetails: 'Resized, Relocated'
      },
      {
        x: 500,
        y: 400,
        width: 120,
        height: 110,
        label: 'Insulation Damage (Confirmed)',
        type: 'Insulation Damage',
        confidence: 1.0,
        severity: 'Warning',
        isAI: false,
        action: 'confirmed',
        annotationType: 'USER_EDITED',
        notes: 'Confirmed as valid'
      },
      {
        x: 650,
        y: 550,
        width: 100,
        height: 95,
        label: 'Oil Leak',
        type: 'Oil Leak',
        confidence: 1.0,
        severity: 'Critical',
        isAI: false,
        action: 'added',
        annotationType: 'USER_CREATED',
        notes: 'User identified additional anomaly missed by AI'
      }
    ],
    label: 'Critical',
    detectionCount: 3,
    userModifications: {
      added: 1,    // Oil Leak was added by user
      edited: 1,   // Point Overload was edited
      deleted: 1,  // Thermal Hotspot was removed (false positive)
      confirmed: 1 // Insulation Damage was confirmed
    },
    metadata: {
      totalChanges: 3,
      timeSpentSeconds: 120
    }
  },
  annotator_metadata: {
    annotator_id: 'test_user_123',
    annotator_name: 'Test User',
    user_id: 'test_user_123',
    username: 'test.user',
    session_id: 'session_' + Date.now(),
    timestamp: new Date().toISOString(),
    changes_made: 3,
    time_spent_seconds: 120,
    notes: 'Removed false positive thermal hotspot, adjusted point overload bbox, added missed oil leak'
  }
}

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
}

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset)
}

async function testPostFeedbackLog() {
  log('\n📝 Test 1: POST /api/feedback/log', 'blue')
  log('Creating a new feedback log...', 'yellow')
  
  try {
    const response = await fetch(`${BASE_URL}/api/feedback/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testFeedbackLog)
    })

    const data = await response.json()

    if (response.ok && data.success) {
      log('✅ SUCCESS: Feedback log created', 'green')
      console.log('Response:', JSON.stringify(data, null, 2))
      return data.data.id
    } else {
      log('❌ FAILED: ' + (data.error || 'Unknown error'), 'red')
      console.log('Response:', JSON.stringify(data, null, 2))
      return null
    }
  } catch (error) {
    log('❌ ERROR: ' + error.message, 'red')
    return null
  }
}

async function testGetFeedbackLogs() {
  log('\n📋 Test 2: GET /api/feedback/log', 'blue')
  log('Fetching feedback logs...', 'yellow')
  
  try {
    const response = await fetch(`${BASE_URL}/api/feedback/log?limit=10&offset=0`)
    const data = await response.json()

    if (response.ok && data.success) {
      log(`✅ SUCCESS: Retrieved ${data.data.length} feedback logs`, 'green')
      console.log('Pagination:', JSON.stringify(data.pagination, null, 2))
      if (data.data.length > 0) {
        console.log('First log:', JSON.stringify(data.data[0], null, 2))
      }
    } else {
      log('❌ FAILED: ' + (data.error || 'Unknown error'), 'red')
      console.log('Response:', JSON.stringify(data, null, 2))
    }
  } catch (error) {
    log('❌ ERROR: ' + error.message, 'red')
  }
}

async function testExportJSON() {
  log('\n📦 Test 3: GET /api/feedback/export (JSON)', 'blue')
  log('Exporting feedback logs as JSON...', 'yellow')
  
  try {
    const response = await fetch(`${BASE_URL}/api/feedback/export?format=json`)
    const data = await response.json()

    if (response.ok) {
      log(`✅ SUCCESS: Exported ${data.total_records} records`, 'green')
      console.log('Export date:', data.export_date)
      console.log('Total records:', data.total_records)
    } else {
      log('❌ FAILED: ' + (data.error || 'Unknown error'), 'red')
      console.log('Response:', JSON.stringify(data, null, 2))
    }
  } catch (error) {
    log('❌ ERROR: ' + error.message, 'red')
  }
}

async function testExportCSV() {
  log('\n📊 Test 4: GET /api/feedback/export (CSV)', 'blue')
  log('Exporting feedback logs as CSV...', 'yellow')
  
  try {
    const response = await fetch(`${BASE_URL}/api/feedback/export?format=csv`)
    const csv = await response.text()

    if (response.ok) {
      const lines = csv.split('\n')
      log(`✅ SUCCESS: Exported ${lines.length - 1} records`, 'green')
      console.log('CSV Header:', lines[0])
      if (lines.length > 1) {
        console.log('First row:', lines[1].substring(0, 100) + '...')
      }
    } else {
      log('❌ FAILED: Unable to export CSV', 'red')
    }
  } catch (error) {
    log('❌ ERROR: ' + error.message, 'red')
  }
}

async function testInvalidData() {
  log('\n⚠️  Test 5: POST with invalid data', 'blue')
  log('Testing validation with missing fields...', 'yellow')
  
  try {
    const response = await fetch(`${BASE_URL}/api/feedback/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_id: 'test' }) // Missing required fields
    })

    const data = await response.json()

    if (response.status === 400) {
      log('✅ SUCCESS: Validation working correctly', 'green')
      console.log('Error message:', data.error)
    } else {
      log('❌ FAILED: Validation should reject invalid data', 'red')
      console.log('Response:', JSON.stringify(data, null, 2))
    }
  } catch (error) {
    log('❌ ERROR: ' + error.message, 'red')
  }
}

// Main test runner
async function runTests() {
  log('🚀 Starting Feedback Logging API Tests', 'blue')
  log('Target: ' + BASE_URL, 'yellow')
  log('=' .repeat(60), 'blue')

  await testPostFeedbackLog()
  await testGetFeedbackLogs()
  await testExportJSON()
  await testExportCSV()
  await testInvalidData()

  log('\n' + '='.repeat(60), 'blue')
  log('✨ All tests completed!', 'green')
  log('\nNote: Make sure your Next.js server is running on ' + BASE_URL, 'yellow')
  log('Note: Make sure the database table is created (run the SQL migration)', 'yellow')
}

// Run the tests
runTests().catch(console.error)
