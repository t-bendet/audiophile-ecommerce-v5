#!/usr/bin/env node

/**
 * Smoke Test for Template Repository
 * Tests basic connectivity and functionality of core features
 */

import { execSync } from 'child_process';
import http from 'http';

const API_URL = 'http://localhost:8000';
const TIMEOUT = 5000;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Request timeout after ${TIMEOUT}ms`));
    }, TIMEOUT);

    http.get(url, (res) => {
      clearTimeout(timeout);
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function runSmokeTests() {
  log('\n🧪 Running Smoke Tests for Template Repository\n', 'blue');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Build
  log('Test 1: Building all packages...', 'yellow');
  try {
    execSync('pnpm build', { stdio: 'pipe', cwd: process.cwd() });
    log('✓ Build successful', 'green');
    passed++;
  } catch (error) {
    log('✗ Build failed', 'red');
    log(`  ${error.message}`, 'red');
    failed++;
  }

  // Test 2: Health endpoint
  log('\nTest 2: Checking health endpoint...', 'yellow');
  try {
    const result = await httpGet(`${API_URL}/api/v1/health`);
    if (result.status === 200 && result.data?.status === 'ok') {
      log(`✓ Health endpoint responding (status: ${result.data.status})`, 'green');
      passed++;
    } else {
      log(`✗ Health endpoint returned unexpected response: ${result.status}`, 'red');
      failed++;
    }
  } catch (error) {
    log(`✗ Health endpoint unreachable: ${error.message}`, 'red');
    log('  Make sure the server is running: pnpm dev:server', 'yellow');
    failed++;
  }

  // Test 3: Auth status endpoint (public)
  log('\nTest 3: Checking auth status endpoint...', 'yellow');
  try {
    const result = await httpGet(`${API_URL}/api/v1/auth/status`);
    if (result.status === 200 || result.status === 401) {
      log(`✓ Auth status endpoint responding (status: ${result.status})`, 'green');
      passed++;
    } else {
      log(`✗ Auth status endpoint returned unexpected status: ${result.status}`, 'red');
      failed++;
    }
  } catch (error) {
    log(`✗ Auth status endpoint unreachable: ${error.message}`, 'red');
    failed++;
  }

  // Test 4: Categories endpoint (public)
  log('\nTest 4: Checking categories endpoint...', 'yellow');
  try {
    const result = await httpGet(`${API_URL}/api/v1/categories`);
    if (result.status === 200 && result.data?.data) {
      log(`✓ Categories endpoint responding (${result.data.data.length || 0} categories)`, 'green');
      passed++;
    } else {
      log(`✗ Categories endpoint returned unexpected response: ${result.status}`, 'red');
      failed++;
    }
  } catch (error) {
    log(`✗ Categories endpoint unreachable: ${error.message}`, 'red');
    failed++;
  }

  // Summary
  log('\n' + '='.repeat(50), 'blue');
  log(`Tests Passed: ${passed}`, 'green');
  log(`Tests Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log('='.repeat(50) + '\n', 'blue');

  if (failed > 0) {
    log('⚠️  Some tests failed. Please check the output above.', 'red');
    process.exit(1);
  } else {
    log('✅ All smoke tests passed!', 'green');
    process.exit(0);
  }
}

// Run tests
runSmokeTests().catch((error) => {
  log(`\n❌ Smoke test runner failed: ${error.message}`, 'red');
  process.exit(1);
});
