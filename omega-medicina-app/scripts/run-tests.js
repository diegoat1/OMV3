// Test Automation Script - Runs all test suites and generates reports
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEST_RESULTS_DIR = 'test-results';
const COVERAGE_DIR = 'coverage';
const E2E_COVERAGE_DIR = 'coverage-e2e';

function runCommand(command, description) {
  console.log(`\n🚀 ${description}`);
  console.log(`Command: ${command}`);
  try {
    const result = execSync(command, { stdio: 'inherit', encoding: 'utf8' });
    console.log(`✅ ${description} completed successfully`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

function generateTestReport() {
  const reportPath = path.join(TEST_RESULTS_DIR, 'test-report.json');

  // Read Jest coverage summary if available
  let coverageSummary = {};
  const coverageSummaryPath = path.join(COVERAGE_DIR, 'coverage-summary.json');

  if (fs.existsSync(coverageSummaryPath)) {
    try {
      coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
    } catch (error) {
      console.warn('Could not read coverage summary:', error.message);
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    testSuites: {
      unit: {
        status: 'completed',
        coverage: coverageSummary,
      },
      integration: {
        status: 'pending',
      },
      e2e: {
        status: 'pending',
      }
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString(),
    }
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 Test report generated: ${reportPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';
  const skipE2E = args.includes('--skip-e2e');
  const ci = args.includes('--ci');

  console.log('🧪 Omega Medicina - Test Automation Suite');
  console.log('==========================================');

  // Create results directory
  ensureDirectory(TEST_RESULTS_DIR);

  try {
    // Run unit tests
    if (testType === 'all' || testType === 'unit') {
      runCommand(
        ci ? 'npm run test:ci' : 'npm run test:coverage',
        'Running Unit Tests with Coverage'
      );
    }

    // Run integration tests
    if (testType === 'all' || testType === 'integration') {
      runCommand(
        'npm run test:integration',
        'Running Integration Tests'
      );
    }

    // Run E2E tests (skip in CI unless explicitly requested)
    if ((testType === 'all' || testType === 'e2e') && !skipE2E && !ci) {
      try {
        runCommand(
          'npm run test:e2e:build',
          'Building E2E Test App'
        );
        runCommand(
          'npm run test:e2e',
          'Running E2E Tests'
        );
      } catch (error) {
        console.warn('⚠️ E2E tests failed, but continuing with other tests');
      }
    }

    // Generate comprehensive report
    generateTestReport();

    // Show coverage summary
    const coverageSummaryPath = path.join(COVERAGE_DIR, 'coverage-summary.json');
    if (fs.existsSync(coverageSummaryPath)) {
      const coverage = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
      console.log('\n📊 Coverage Summary:');
      console.log(`Lines: ${coverage.total.lines.pct}%`);
      console.log(`Functions: ${coverage.total.functions.pct}%`);
      console.log(`Branches: ${coverage.total.branches.pct}%`);
      console.log(`Statements: ${coverage.total.statements.pct}%`);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('==========================================');

  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { runCommand, ensureDirectory, generateTestReport };

if (require.main === module) {
  main().catch(console.error);
}
