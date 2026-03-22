import { isProfane } from '@/lib/profanity-filter';

export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

export function validateUsername(username: string): UsernameValidationResult {
  if (!username || username.trim().length === 0) {
    return {
      isValid: false,
      error: 'Username is required'
    };
  }

  const trimmed = username.trim();

  if (trimmed !== username) {
    return {
      isValid: false,
      error: 'Username cannot contain leading or trailing spaces',
      sanitized: trimmed
    };
  }

  if (trimmed.includes(' ')) {
    return {
      isValid: false,
      error: 'Username cannot contain spaces'
    };
  }

  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: 'Username must be at least 3 characters long'
    };
  }

  if (trimmed.length > 20) {
    return {
      isValid: false,
      error: 'Username must be 20 characters or less'
    };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, underscores, and hyphens'
    };
  }

  if (trimmed.startsWith('-') || trimmed.startsWith('_') || trimmed.endsWith('-') || trimmed.endsWith('_')) {
    return {
      isValid: false,
      error: 'Username cannot start or end with underscores or hyphens'
    };
  }

  if (isProfane(trimmed)) {
    return {
      isValid: false,
      error: 'Username contains inappropriate language'
    };
  }

  const reservedUsernames = [
    'admin', 'api', 'www', 'mail', 'ftp', 'localhost', 'root', 'user',
    'test', 'guest', 'anonymous', 'null', 'undefined', 'system', 'support',
    'help', 'info', 'contact', 'about', 'terms', 'privacy', 'login', 'signup',
    'register', 'auth', 'oauth', 'profile', 'settings', 'account', 'dashboard'
  ];

  if (reservedUsernames.includes(trimmed.toLowerCase())) {
    return {
      isValid: false,
      error: 'This username is reserved and cannot be used'
    };
  }

  return {
    isValid: true,
    sanitized: trimmed
  };
}

export function sanitizeUsername(username: string): string {
  return username.trim().replace(/\s+/g, '');
}