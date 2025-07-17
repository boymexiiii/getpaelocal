import { z } from 'zod';

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>"/\\&]/g, '') // Remove potentially harmful characters
    .substring(0, 1000); // Limit length
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailSchema = z.string().email();
  return emailSchema.safeParse(email).success;
};

// Phone validation (Nigerian format)
export const validateNigerianPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+234|234|0)?[789][01]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

// BVN validation
export const validateBVN = (bvn: string): boolean => {
  const bvnRegex = /^\d{11}$/;
  return bvnRegex.test(bvn);
};

// Amount validation
export const validateAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 10000000 && Number.isFinite(amount);
};

// Password strength validation
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Transaction validation schemas
export const transactionSchema = z.object({
  amount: z.number().positive().max(10000000),
  description: z.string().min(1).max(500),
  recipientEmail: z.string().email().optional(),
  type: z.enum(['send', 'bill_payment', 'spend'])
});

export const billPaymentSchema = z.object({
  billType: z.enum(['airtime', 'data', 'electricity', 'cable_tv', 'internet']),
  amount: z.number().positive().max(1000000),
  accountNumber: z.string().min(1).max(50),
  provider: z.string().min(1).max(100)
});

// KYC validation schema
export const kycSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  dateOfBirth: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 18 && age <= 100;
  }, 'Must be between 18 and 100 years old'),
  bvn: z.string().regex(/^\d{11}$/, 'BVN must be 11 digits'),
  phone: z.string().regex(/^(\+234|234|0)?[789][01]\d{8}$/, 'Invalid Nigerian phone number'),
  occupation: z.string().min(2).max(100),
  monthlyIncomeRange: z.enum(['below_100k', '100k_500k', '500k_1m', '1m_5m', 'above_5m']),
  sourceOfFunds: z.enum(['salary', 'business', 'investment', 'inheritance', 'other'])
});

// Input sanitization for different types
export const sanitizeInputs = {
  text: (input: string) => sanitizeInput(input),
  email: (input: string) => input.toLowerCase().trim(),
  phone: (input: string) => input.replace(/\s+/g, '').replace(/[^\d+]/g, ''),
  amount: (input: string) => parseFloat(input.replace(/[^\d.]/g, '')),
  bvn: (input: string) => input.replace(/\D/g, '').substring(0, 11)
};