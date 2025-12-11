/**
 * Secure password generation utilities using crypto.getRandomValues
 */

export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  feedback: string[];
}

// Character sets for password generation
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Generate an unbiased random index using rejection sampling
 * This eliminates modulo bias that occurs when the range doesn't evenly divide 2^32
 * 
 * @param max The exclusive upper bound (0 to max-1)
 * @returns An unbiased random integer in [0, max)
 */
function getUnbiasedRandomIndex(max: number): number {
  if (max <= 0 || max > 0x100000000) {
    throw new Error('Invalid range for random index');
  }
  
  // Calculate the largest multiple of max that fits in 32 bits
  // Any value >= threshold would introduce bias
  const threshold = 0x100000000 - (0x100000000 % max);
  
  let randomValue: number;
  const randomArray = new Uint32Array(1);
  
  // Rejection sampling: discard values that would cause bias
  do {
    crypto.getRandomValues(randomArray);
    randomValue = randomArray[0];
  } while (randomValue >= threshold);
  
  return randomValue % max;
}

export function generateSecurePassword(options: PasswordOptions): string {
  let charset = '';
  
  if (options.includeUppercase) charset += UPPERCASE;
  if (options.includeLowercase) charset += LOWERCASE;
  if (options.includeNumbers) charset += NUMBERS;
  if (options.includeSymbols) charset += SYMBOLS;
  
  if (charset.length === 0) {
    throw new Error('At least one character type must be selected');
  }
  
  // Generate password using unbiased random selection
  const password = new Array(options.length);
  
  for (let i = 0; i < options.length; i++) {
    password[i] = charset[getUnbiasedRandomIndex(charset.length)];
  }
  
  // Ensure at least one character from each selected type is included
  let passwordArray = password.slice();
  let position = 0;
  
  if (options.includeUppercase) {
    passwordArray[position] = UPPERCASE[getUnbiasedRandomIndex(UPPERCASE.length)];
    position++;
  }
  
  if (options.includeLowercase) {
    passwordArray[position] = LOWERCASE[getUnbiasedRandomIndex(LOWERCASE.length)];
    position++;
  }
  
  if (options.includeNumbers) {
    passwordArray[position] = NUMBERS[getUnbiasedRandomIndex(NUMBERS.length)];
    position++;
  }
  
  if (options.includeSymbols) {
    passwordArray[position] = SYMBOLS[getUnbiasedRandomIndex(SYMBOLS.length)];
    position++;
  }
  
  // Fisher-Yates shuffle using unbiased random selection
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const randomIndex = getUnbiasedRandomIndex(i + 1);
    [passwordArray[i], passwordArray[randomIndex]] = [passwordArray[randomIndex], passwordArray[i]];
  }
  
  return passwordArray.join('');
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const feedback: string[] = [];
  
  // Length scoring
  if (password.length >= 12) {
    score += 1;
  } else {
    feedback.push('Use at least 12 characters');
  }
  
  if (password.length >= 16) {
    score += 1;
  }
  
  // Character variety scoring
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);
  
  const varietyCount = [hasLowercase, hasUppercase, hasNumbers, hasSymbols].filter(Boolean).length;
  
  if (varietyCount >= 3) {
    score += 1;
  } else {
    feedback.push('Include uppercase, lowercase, numbers, and symbols');
  }
  
  if (varietyCount === 4) {
    score += 1;
  }
  
  // Pattern detection (basic)
  const hasRepeatingChars = /(.)\1{2,}/.test(password);
  const hasSequentialChars = /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789)/i.test(password);
  
  if (hasRepeatingChars) {
    score -= 1;
    feedback.push('Avoid repeating characters');
  }
  
  if (hasSequentialChars) {
    score -= 1;
    feedback.push('Avoid sequential characters');
  }
  
  // Ensure score is within bounds
  score = Math.max(0, Math.min(4, score));
  
  // Determine label and color based on score
  let label: string;
  let color: string;
  
  switch (score) {
    case 0:
    case 1:
      label = 'Weak';
      color = 'text-red-500';
      break;
    case 2:
      label = 'Fair';
      color = 'text-orange-500';
      break;
    case 3:
      label = 'Good';
      color = 'text-yellow-500';
      break;
    case 4:
      label = 'Strong';
      color = 'text-green-500';
      break;
    default:
      label = 'Unknown';
      color = 'text-gray-500';
  }
  
  return {
    score,
    label,
    color,
    feedback: feedback.length > 0 ? feedback : ['Password looks good!']
  };
}

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
}; 