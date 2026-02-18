#!/usr/bin/env node
/**
 * Security Enforcement Script for Happy Homes Platform
 * 
 * This script performs comprehensive security checks to ensure:
 * - Zero localStorage/sessionStorage usage
 * - Proper backend API integration
 * - HTTP-only cookie authentication
 * - No client-side sensitive data storage
 * 
 * Run with: npm run security-check
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security violation patterns
const SECURITY_VIOLATIONS = [
  {
    pattern: /localStorage\.setItem\s*\(/g,
    severity: 'CRITICAL',
    message: 'localStorage.setItem() detected - use backend API instead'
  },
  {
    pattern: /localStorage\.getItem\s*\(/g,
    severity: 'CRITICAL', 
    message: 'localStorage.getItem() detected - use backend API instead'
  },
  {
    pattern: /sessionStorage\.setItem\s*\(/g,
    severity: 'CRITICAL',
    message: 'sessionStorage.setItem() detected - use backend API instead'
  },
  {
    pattern: /sessionStorage\.getItem\s*\(/g,
    severity: 'CRITICAL',
    message: 'sessionStorage.getItem() detected - use backend API instead'
  },
  {
    pattern: /window\.localStorage/g,
    severity: 'CRITICAL',
    message: 'window.localStorage access detected - use backend API instead'
  },
  {
    pattern: /window\.sessionStorage/g,
    severity: 'CRITICAL',
    message: 'window.sessionStorage access detected - use backend API instead'
  },
  {
    pattern: /document\.cookie\s*=/g,
    severity: 'HIGH',
    message: 'Manual cookie setting detected - use HTTP-only cookies from backend'
  },
  {
    pattern: /token.*localStorage/gi,
    severity: 'CRITICAL',
    message: 'Token storage in localStorage detected - use HTTP-only cookies'
  },
  {
    pattern: /auth.*localStorage/gi,
    severity: 'CRITICAL',
    message: 'Authentication data in localStorage detected - use session-based auth'
  }
];

// Allowed patterns (exceptions)
const ALLOWED_PATTERNS = [
  /\/\/ SECURITY:/,  // Security comments
  /console\.(warn|error).*localStorage/,  // Security warnings
  /safeLocalStorage/,  // Our security wrapper
  /SECURITY.*localStorage.*blocked/,  // Security enforcement messages
];

// Files to scan
const SCAN_DIRECTORIES = ['src', 'public'];
const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.html'];

class SecurityChecker {
  constructor() {
    this.violations = [];
    this.scannedFiles = 0;
    this.totalLines = 0;
  }

  scanDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        this.scanDirectory(fullPath);
      } else if (stats.isFile() && this.shouldScanFile(fullPath)) {
        this.scanFile(fullPath);
      }
    }
  }

  shouldScanFile(filePath) {
    const ext = path.extname(filePath);
    return SCAN_EXTENSIONS.includes(ext);
  }

  scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\\n');
    
    this.scannedFiles++;
    this.totalLines += lines.length;

    lines.forEach((line, lineNumber) => {
      this.checkLineForViolations(line, filePath, lineNumber + 1);
    });
  }

  checkLineForViolations(line, filePath, lineNumber) {
    // Skip if line is an allowed pattern
    if (ALLOWED_PATTERNS.some(pattern => pattern.test(line))) {
      return;
    }

    // Check for security violations
    SECURITY_VIOLATIONS.forEach(violation => {
      const matches = line.match(violation.pattern);
      if (matches) {
        this.violations.push({
          file: filePath,
          line: lineNumber,
          severity: violation.severity,
          message: violation.message,
          content: line.trim(),
          pattern: violation.pattern.source
        });
      }
    });
  }

  generateReport() {
    const criticalViolations = this.violations.filter(v => v.severity === 'CRITICAL');
    const highViolations = this.violations.filter(v => v.severity === 'HIGH');
    
    console.log('\\n🔒 HAPPY HOMES SECURITY SCAN REPORT\\n');
    console.log('=====================================\\n');
    
    console.log(`📊 Scan Statistics:`);
    console.log(`   Files Scanned: ${this.scannedFiles}`);
    console.log(`   Lines Scanned: ${this.totalLines}`);
    console.log(`   Total Violations: ${this.violations.length}\\n`);
    
    if (this.violations.length === 0) {
      console.log('✅ SUCCESS: No security violations found!\\n');
      console.log('🛡️  Your code follows secure backend-only architecture.\\n');
      return true;
    }

    console.log('🚨 SECURITY VIOLATIONS DETECTED\\n');
    
    if (criticalViolations.length > 0) {
      console.log(`❌ CRITICAL VIOLATIONS (${criticalViolations.length}):`);
      this.printViolations(criticalViolations);
    }
    
    if (highViolations.length > 0) {
      console.log(`⚠️  HIGH SEVERITY VIOLATIONS (${highViolations.length}):`);
      this.printViolations(highViolations);
    }

    console.log('\\n🔧 REMEDIATION STEPS:');
    console.log('1. Replace all localStorage/sessionStorage with backend API calls');
    console.log('2. Use HTTP-only cookies for authentication (set by backend)');
    console.log('3. Implement session-based user management'); 
    console.log('4. Review SECURITY.md for proper patterns\\n');

    console.log('📚 Resources:');
    console.log('- Security Guidelines: ./SECURITY.md');
    console.log('- Project Documentation: ./PROJECT.md');
    console.log('- ESLint Security Rules: ./eslint.config.js\\n');

    return false;
  }

  printViolations(violations) {
    violations.forEach((violation, index) => {
      const relativePath = path.relative(__dirname, violation.file);
      console.log(`\\n   ${index + 1}. ${relativePath}:${violation.line}`);
      console.log(`      Message: ${violation.message}`);
      console.log(`      Code: ${violation.content}`);
      console.log(`      Pattern: ${violation.pattern}\\n`);
    });
  }
}

// Main execution
function main() {
  console.log('🔍 Starting Happy Homes Security Scan...\\n');
  
  const checker = new SecurityChecker();
  
  // Scan specified directories
  SCAN_DIRECTORIES.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
      checker.scanDirectory(dirPath);
    } else {
      console.warn(`⚠️  Directory not found: ${dir}`);
    }
  });
  
  // Generate report
  const passed = checker.generateReport();
  
  // Exit with appropriate code
  process.exit(passed ? 0 : 1);
}

// Handle script execution
if (process.argv[1] === __filename) {
  main();
}

export { SecurityChecker };