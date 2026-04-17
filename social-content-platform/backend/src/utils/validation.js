// Input validation utilities

const { v4: uuidv4 } = require('uuid');

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate required fields
function validateRequired(fields, data) {
  const missing = [];
  
  fields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      missing.push(field);
    }
  });
  
  return {
    isValid: missing.length === 0,
    missing
  };
}

// Generate UUID
function generateId() {
  return uuidv4();
}

// Sanitize string input
function sanitizeString(str) {
  if (!str) return '';
  return str.trim().replace(/[<>]/g, '');
}

// Validate content status transition
function isValidStatusTransition(currentStatus, newStatus) {
  const validTransitions = {
    'draft': ['review', 'draft'],
    'review': ['approved', 'rejected', 'draft'],
    'approved': ['posted', 'draft'],
    'posted': []
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

// Role hierarchy for permission checks
const ROLE_HIERARCHY = {
  'owner': 5,
  'admin': 4,
  'reviewer': 3,
  'creator': 2,
  'viewer': 1
};

// Check if role has sufficient permissions
function hasPermission(userRole, requiredRole) {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

module.exports = {
  isValidEmail,
  validateRequired,
  generateId,
  sanitizeString,
  isValidStatusTransition,
  hasPermission,
  ROLE_HIERARCHY
};
