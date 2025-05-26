import { countryCodeEmoji } from './emoji';
import { validatePhoneForCountry, formatPhoneForDisplay } from './phoneValidation';

export const countryPhoneCodes = [
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' }, // Saudi Arabia first
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+967', country: 'Yemen', flag: '🇾🇪' },
  { code: '+962', country: 'Jordan', flag: '🇯🇴' },
  { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
  { code: '+963', country: 'Syria', flag: '🇸🇾' },
  { code: '+964', country: 'Iraq', flag: '🇮🇶' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+970', country: 'Palestine', flag: '🇵🇸' },
  // ... rest of country codes remain the same
].filter((country, index, self) => 
  index === self.findIndex((c) => c.code === country.code)
);

export const validatePhoneNumber = (phone: string, countryCode: string) => {
  return validatePhoneForCountry(phone, countryCode);
};

export const formatPhoneNumber = (countryCode: string, phone: string) => {
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Remove leading zeros
  const phoneWithoutLeadingZeros = cleanPhone.replace(/^0+/, '');
  
  // Format the phone number
  const formattedPhone = formatPhoneForDisplay(phoneWithoutLeadingZeros, countryCode);
  
  // Format with space between country code and number
  return `${countryCode} ${formattedPhone}`;
};

export const parsePhoneNumber = (phone: string): { countryCode: string; number: string } => {
  if (!phone) return { countryCode: '+966', number: '' };

  const match = phone.match(/^(\+\d+)\s*(.*)$/);
  if (match) {
    return {
      countryCode: match[1],
      number: match[2].replace(/\s/g, '')
    };
  }

  return {
    countryCode: '+966',
    number: phone.replace(/\D/g, '')
  };
};