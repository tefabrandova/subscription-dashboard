import { countryPhoneCodes } from './phone';

interface PhoneValidationRule {
  country: string;
  lengths: number[];
  pattern?: RegExp;
}

// Phone number validation rules by country
const phoneValidationRules: PhoneValidationRule[] = [
  { country: '+966', lengths: [9], pattern: /^5\d{8}$/ }, // Saudi Arabia (9 digits, starts with 5)
  { country: '+971', lengths: [9], pattern: /^[0-9]{9}$/ }, // UAE
  { country: '+974', lengths: [8], pattern: /^[0-9]{8}$/ }, // Qatar
  { country: '+973', lengths: [8], pattern: /^[0-9]{8}$/ }, // Bahrain
  { country: '+965', lengths: [8], pattern: /^[0-9]{8}$/ }, // Kuwait
  { country: '+968', lengths: [8], pattern: /^[0-9]{8}$/ }, // Oman
  { country: '+967', lengths: [9], pattern: /^[0-9]{9}$/ }, // Yemen
  { country: '+962', lengths: [9], pattern: /^[0-9]{9}$/ }, // Jordan
  { country: '+961', lengths: [7, 8], pattern: /^[0-9]{7,8}$/ }, // Lebanon
  { country: '+963', lengths: [9], pattern: /^[0-9]{9}$/ }, // Syria
  { country: '+964', lengths: [10], pattern: /^[0-9]{10}$/ }, // Iraq
  { country: '+20', lengths: [10], pattern: /^[0-9]{10}$/ }, // Egypt
  { country: '+970', lengths: [9], pattern: /^[0-9]{9}$/ }, // Palestine
];

// Default validation rule for countries not in the list
const defaultValidationRule: PhoneValidationRule = {
  country: 'default',
  lengths: [8, 9, 10],
  pattern: /^[0-9]{8,10}$/
};

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validatePhoneForCountry = (phone: string, countryCode: string): ValidationResult => {
  // Remove any non-digit characters except leading plus
  const cleanPhone = phone.replace(/[^\d]/g, '');
  
  // Find validation rule for country code
  const rule = phoneValidationRules.find(r => r.country === countryCode) || defaultValidationRule;
  
  // Check if length is valid
  if (!rule.lengths.includes(cleanPhone.length)) {
    const expectedLengths = rule.lengths.join(' or ');
    return {
      isValid: false,
      error: `Phone number must be ${expectedLengths} digits for ${getCountryName(countryCode)}`
    };
  }

  // Check pattern if defined
  if (rule.pattern && !rule.pattern.test(cleanPhone)) {
    return {
      isValid: false,
      error: `Invalid phone number format for ${getCountryName(countryCode)}`
    };
  }

  return { isValid: true };
};

export const getCountryName = (countryCode: string): string => {
  const country = countryPhoneCodes.find(c => c.code === countryCode);
  return country ? country.country : 'this country';
};

export const formatPhoneForDisplay = (phone: string, countryCode: string): string => {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  
  // Format based on country-specific rules
  switch (countryCode) {
    case '+966': // Saudi Arabia
      return cleanPhone.replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
    case '+971': // UAE
      return cleanPhone.replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
    default:
      // Default formatting: groups of 3-4 digits
      return cleanPhone.replace(/(\d{3})(\d{3})(\d{4}|\d{3})/, '$1 $2 $3').trim();
  }
};