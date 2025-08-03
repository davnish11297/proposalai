// Content validation and sanitization utilities

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedContent?: string;
}

// Common vulgarity patterns (basic examples - you might want to expand this)
const VULGARITY_PATTERNS = [
  /\b(fuck|shit|bitch|asshole|dick|pussy|cunt|cock|twat|whore|slut)\b/gi,
  /\b(damn|hell|god\s*dammit)\b/gi,
  // Add more patterns as needed
];

// Code injection patterns
const CODE_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick, onload, etc.
  /eval\s*\(/gi,
  /document\./gi,
  /window\./gi,
  /alert\s*\(/gi,
  /console\./gi,
];

// SQL injection patterns
const SQL_PATTERNS = [
  /\b(select|insert|update|delete|drop|create|alter|exec|execute|union|where|from|table|database)\b/gi,
  /['"]\s*(union|select|insert|update|delete|drop|create|alter)\s*['"]/gi,
  /;\s*(select|insert|update|delete|drop|create|alter)/gi,
];

// HTML tag patterns (excluding basic formatting)
const HTML_PATTERNS = [
  /<iframe\b[^>]*>/gi,
  /<object\b[^>]*>/gi,
  /<embed\b[^>]*>/gi,
  /<form\b[^>]*>/gi,
  /<input\b[^>]*>/gi,
  /<button\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
  /<meta\b[^>]*>/gi,
];

// Unicode and code breaking characters
const CODE_BREAKING_PATTERNS = [
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, // Control characters (excluding tab, newline, carriage return)
  /[\u200B-\u200D\uFEFF]/g, // Zero-width characters
  /[\u2028\u2029]/g, // Line/paragraph separators
];

// Excessive special characters (more than 8 consecutive special chars)
const EXCESSIVE_SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}/g;

// Random text/gibberish detection
const GIBBERISH_PATTERNS = [
  /[a-z]{20,}/gi, // Very long strings of letters
  /[0-9]{10,}/g, // Very long strings of numbers
  /[a-zA-Z0-9]{30,}/g, // Very long alphanumeric strings
];

export function validateContent(content: string): ValidationResult {
  console.log('Validating content:', {
    content: content,
    length: content.length,
    charCodes: Array.from(content).map(char => char.charCodeAt(0))
  });
  
  const errors: string[] = [];
  let sanitizedContent = content;

  // Check for vulgarity
  for (const pattern of VULGARITY_PATTERNS) {
    if (pattern.test(content)) {
      errors.push('Content contains inappropriate language');
      break;
    }
  }

  // Check for code injection
  for (const pattern of CODE_PATTERNS) {
    if (pattern.test(content)) {
      errors.push('Content contains potentially harmful code');
      break;
    }
  }

  // Check for SQL injection
  for (const pattern of SQL_PATTERNS) {
    if (pattern.test(content)) {
      errors.push('Content contains database commands');
      break;
    }
  }

  // Check for HTML injection
  for (const pattern of HTML_PATTERNS) {
    if (pattern.test(content)) {
      errors.push('Content contains unsafe HTML elements');
      break;
    }
  }

  // Check for code breaking characters
  const codeBreakingMatches = CODE_BREAKING_PATTERNS.filter(pattern => pattern.test(content));
  if (codeBreakingMatches.length > 0) {
    console.log('Code breaking characters detected:', {
      content: content,
      contentLength: content.length,
      charCodes: Array.from(content).map(char => char.charCodeAt(0)),
      patterns: codeBreakingMatches.map(pattern => pattern.toString())
    });
    errors.push('Content contains invalid characters');
  }

  // Check for excessive special characters
  if (EXCESSIVE_SPECIAL_CHARS.test(content)) {
    console.log('Excessive special characters detected in:', content);
    errors.push('Content contains excessive special characters');
  }

  // Check for gibberish/random text
  for (const pattern of GIBBERISH_PATTERNS) {
    if (pattern.test(content)) {
      errors.push('Content appears to contain random text or gibberish');
      break;
    }
  }

  // Sanitize content if there are no critical errors
  if (errors.length === 0) {
    // Remove code breaking characters
    sanitizedContent = content.replace(CODE_BREAKING_PATTERNS.join('|'), '');
    
    // Remove excessive whitespace
    sanitizedContent = sanitizedContent.replace(/\s+/g, ' ').trim();
  }

  const result = {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors[0] : undefined,
    sanitizedContent: errors.length === 0 ? sanitizedContent : undefined
  };
  
  console.log('Validation result:', result);
  return result;
}

export function getErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    'Content contains inappropriate language': 'Please rephrase your request using professional language.',
    'Content contains potentially harmful code': 'Please avoid including code or scripts in your proposal.',
    'Content contains database commands': 'Please avoid including technical commands in your proposal.',
    'Content contains unsafe HTML elements': 'Please avoid including HTML code in your proposal.',
    'Content contains invalid characters': 'Please avoid using special characters that could cause issues.',
    'Content contains excessive special characters': 'Please use standard punctuation and formatting.',
    'Content appears to contain random text or gibberish': 'Please provide a clear, coherent description for your proposal.'
  };

  return errorMessages[error] || 'Please try rephrasing your request with clearer, more professional language.';
}

export function addContentFilteringInstructions(systemPrompt: string): string {
  const filteringInstructions = `

IMPORTANT CONTENT GUIDELINES:
- Generate only professional, business-appropriate content
- Do not include vulgarity, profanity, or inappropriate language
- Do not include code, scripts, HTML tags, or technical commands
- Do not include SQL queries, database commands, or system instructions
- Do not include random text, gibberish, or nonsensical content
- Use clear, coherent, and professional language
- Focus on business value, solutions, and professional communication
- If the request seems inappropriate or unclear, explain why and suggest alternatives

If the user's request contains inappropriate content, respond with a professional explanation of why it cannot be processed and suggest how to rephrase the request appropriately.`;

  return systemPrompt + filteringInstructions;
} 