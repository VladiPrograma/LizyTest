import { Filter } from 'bad-words';
import validator from 'validator';

const filter = new Filter();

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedContent?: string;
}

export interface ValidationOptions {
  allowLinks?: boolean;
  maxLinks?: number;
  allowProfanity?: boolean;
  maxLength?: number;
  minLength?: number;
}

const DEFAULT_OPTIONS: ValidationOptions = {
  allowLinks: false,
  maxLinks: 0,
  allowProfanity: false,
  maxLength: 1000,
  minLength: 1,
};

export function validateMessageContent(
  content: string,
  options: ValidationOptions = {}
): ValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];
  const sanitizedContent = content.trim();

  if (!sanitizedContent) {
    return {
      isValid: false,
      errors: ['Message cannot be empty'],
    };
  }

  if (sanitizedContent.length < opts.minLength!) {
    errors.push(`Message must be at least ${opts.minLength} characters long`);
  }

  if (sanitizedContent.length > opts.maxLength!) {
    errors.push(`Message must be no more than ${opts.maxLength} characters long`);
  }

  if (!opts.allowProfanity && filter.isProfane(sanitizedContent)) {
    errors.push('Message contains inappropriate language');
  }

  const urls = extractUrls(sanitizedContent);
  if (!opts.allowLinks && urls.length > 0) {
    errors.push('Links are not allowed in messages');
  } else if (opts.allowLinks && urls.length > opts.maxLinks!) {
    errors.push(`Maximum ${opts.maxLinks} links allowed per message`);
  }

  if (!containsOnlyValidCharacters(sanitizedContent)) {
    errors.push('Message contains invalid characters');
  }

  if (containsSuspiciousPatterns(sanitizedContent)) {
    errors.push('Message contains suspicious content');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedContent: errors.length === 0 ? sanitizedContent : undefined,
  };
}

function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([^\s]+\.[a-z]{2,}(?:\/[^\s]*)?)/gi;
  const matches = text.match(urlRegex) || [];
  
  return matches.filter(match => {
    if (match.startsWith('http://') || match.startsWith('https://')) {
      return validator.isURL(match);
    }
    if (match.startsWith('www.')) {
      return validator.isURL(`http://${match}`);
    }
    return validator.isURL(`http://${match}`);
  });
}

function containsOnlyValidCharacters(text: string): boolean {
  const validCharPattern = /^[\w\s\p{L}\p{N}\p{P}\p{S}\p{M}]+$/u;
  return validCharPattern.test(text);
}

function containsSuspiciousPatterns(text: string): boolean {
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /document\.write/gi,
    /window\.location/gi,
    /\bphishing\b/gi,
    /\bscam\b/gi,
    /urgent.*click.*here/gi,
    /verify.*account.*immediately/gi,
    /suspended.*account/gi,
    /click.*here.*now/gi,
    /limited.*time.*offer/gi,
    /\$\d+.*per.*day/gi,
    /work.*from.*home.*\$\d+/gi,
    /crypto.*investment.*guaranteed/gi,
    /bitcoin.*double.*money/gi,
    /\b(?:viagra|cialis|pharmacy|meds|pills)\b/gi,
    /\b(?:casino|poker|gambling|lottery|jackpot)\b/gi,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(text));
}

export function sanitizeContent(content: string): string {
  return content
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .slice(0, 1000);
}

export function isProfane(text: string): boolean {
  return filter.isProfane(text);
}

export function cleanProfanity(text: string): string {
  return filter.clean(text);
}

export function hasLinks(text: string): boolean {
  return extractUrls(text).length > 0;
}

export function removeLinks(text: string): string {
  const urls = extractUrls(text);
  let cleanText = text;
  
  urls.forEach(url => {
    cleanText = cleanText.replace(url, '[LINK REMOVED]');
  });
  
  return cleanText;
}

