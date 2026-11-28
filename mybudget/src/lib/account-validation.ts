export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 32;
export const PASSWORD_MIN_LENGTH = 8;

const USERNAME_PATTERN = /^[a-z0-9_-]+$/;

export function normalizeUsernameInput(value: string): string {
  return value.trim().toLowerCase();
}

export function validateUsername(raw: string): { valid: boolean; normalized: string; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, normalized: "", error: "Username is required." };
  }
  if (/\s/.test(trimmed)) {
    return { valid: false, normalized: trimmed, error: "Username cannot contain spaces." };
  }
  if (trimmed !== trimmed.toLowerCase()) {
    return {
      valid: false,
      normalized: trimmed.toLowerCase(),
      error: "Username must use lowercase letters only.",
    };
  }
  if (trimmed.length < USERNAME_MIN_LENGTH) {
    return {
      valid: false,
      normalized: trimmed,
      error: `Username must be at least ${USERNAME_MIN_LENGTH} characters.`,
    };
  }
  if (trimmed.length > USERNAME_MAX_LENGTH) {
    return {
      valid: false,
      normalized: trimmed,
      error: `Username must be ${USERNAME_MAX_LENGTH} characters or fewer.`,
    };
  }
  if (!USERNAME_PATTERN.test(trimmed)) {
    return {
      valid: false,
      normalized: trimmed,
      error: "Username may only contain lowercase letters, numbers, underscores, and hyphens.",
    };
  }
  return { valid: true, normalized: trimmed };
}

export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: "New password is required." };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    };
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      valid: false,
      error: "Password must include at least one letter and one number.",
    };
  }
  return { valid: true };
}
