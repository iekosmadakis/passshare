export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  feedback: string[];
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/** Unbiased random index via rejection sampling to eliminate modulo bias */
function getUnbiasedRandomIndex(max: number): number {
  if (max <= 0 || max > 0x100000000) {
    throw new Error('Invalid range for random index');
  }

  const threshold = 0x100000000 - (0x100000000 % max);
  const randomArray = new Uint32Array(1);
  let randomValue: number;

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

  const password = new Array(options.length);
  for (let i = 0; i < options.length; i++) {
    password[i] = charset[getUnbiasedRandomIndex(charset.length)];
  }

  // Guarantee at least one character from each selected type
  const passwordArray = password.slice();
  let position = 0;

  if (options.includeUppercase) {
    passwordArray[position++] = UPPERCASE[getUnbiasedRandomIndex(UPPERCASE.length)];
  }
  if (options.includeLowercase) {
    passwordArray[position++] = LOWERCASE[getUnbiasedRandomIndex(LOWERCASE.length)];
  }
  if (options.includeNumbers) {
    passwordArray[position++] = NUMBERS[getUnbiasedRandomIndex(NUMBERS.length)];
  }
  if (options.includeSymbols) {
    passwordArray[position++] = SYMBOLS[getUnbiasedRandomIndex(SYMBOLS.length)];
  }

  // Fisher-Yates shuffle
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = getUnbiasedRandomIndex(i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join('');
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 12) score += 1;
  else feedback.push('Use at least 12 characters');

  if (password.length >= 16) score += 1;

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);

  const varietyCount = [hasLowercase, hasUppercase, hasNumbers, hasSymbols].filter(Boolean).length;

  if (varietyCount >= 3) score += 1;
  else feedback.push('Include uppercase, lowercase, numbers, and symbols');

  if (varietyCount === 4) score += 1;

  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeating characters');
  }

  if (/(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789)/i.test(password)) {
    score -= 1;
    feedback.push('Avoid sequential characters');
  }

  score = Math.max(0, Math.min(4, score));

  const levels: Record<number, { label: string; color: string }> = {
    0: { label: 'Weak', color: 'text-red-500' },
    1: { label: 'Weak', color: 'text-red-500' },
    2: { label: 'Fair', color: 'text-orange-500' },
    3: { label: 'Good', color: 'text-yellow-500' },
    4: { label: 'Strong', color: 'text-green-500' },
  };

  const { label, color } = levels[score];

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
