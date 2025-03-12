// validation.js
export const validateEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!value) return 'Email is required';
  if (!emailRegex.test(value)) return 'Invalid email format';
  return null;
};

export const validateName = (value, fieldName = 'Name') => {
  if (!value) return `${fieldName} is required`;
  if (value.length < 2) return `${fieldName} must be at least 2 characters`;
  return null;
};

export const validateCompany = (value) => {
  if (!value) return 'Company name is required';
  if (value.length < 2) return 'Company name must be at least 2 characters';
  return null;
};

export const validatePhone = (value) => {
  const phoneRegex = /^\+?(?!.*\+)(?=(.*\d){8})[\d -]+$/;
  if (!value) return null;
  
  // Clean version for validation
  const cleanValue = value.replace(/[ -]/g, '');
  
  if (!phoneRegex.test(value)) return 'Invalid phone number format';
  if (cleanValue.replace('+', '').length < 8) return 'Minimum 8 digits required';
  return null;
};

export const validateWebsite = (value) => {
  if (!value) return null;
  const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?$/;
  if (!urlRegex.test(value)) return 'Invalid website URL';
  return null;
};

export const validateForm = (form) => {
  const errors = {};

  errors.email = validateEmail(form.email);
  
  if (form.customerType === 'business') {
    errors.firstName = validateName(form.firstName, 'First name');
    errors.lastName = validateName(form.lastName, 'Last name');
    errors.companyName = validateCompany(form.companyName);
    errors.phoneNumber = validatePhone(form.phoneNumber);
    // errors.website = validateWebsite(form.website);
  }

  return {
    isValid: Object.values(errors).every(error => error === null),
    errors
  };
};