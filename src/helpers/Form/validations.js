// validation.js
export const validateRequired = (value, fieldName = null) => {
  if(!value){
    if(fieldName){
      return `${fieldName} is required`
    } else return 'This field is required'
  } else return null
}
export const validateEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!value) return 'Please add your email address';
  if (!emailRegex.test(value)) return 'Please enter a valid email.';
  return null;
};

export const validateName = (value, fieldName = 'Name') => {
  if (!value) return `${fieldName} is required`;
  if (value.length < 2) return `${fieldName} must be at least 2 characters`;
  return null;
};

export const validateCompany = (value) => {
  if (!value) return 'Please add your company name';
  if (value.length < 2) return 'Company name must be at least 2 characters';
  return null;
};

export const validatePhone = (value) => {
  const phoneRegex = /^\+?(?!.*\+)(?=(.*\d){8})[\d -]+$/;
  if (!value) return 'Please add a phone number';
  
  // Clean version for validation
  const cleanValue = value.replace(/[ -]/g, '');
  
  if (!phoneRegex.test(value)) return 'Please enter a valid phone number.';
  if (cleanValue.replace('+', '').length < 8) return 'Minimum 8 digits required';
  return null;
};

export const validateWebsite = (value) => {
  if (!value) return null;
  const urlRegex = /^(?:https?:\/\/)?(?:www\.)?[\w-]+\.[a-z]{2,}(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i;
  if (!urlRegex.test(value)) return 'Please enter a valid website url';
  return null;
};

export const validateForm = (form, formType = null) => {
  // console.log("Validating form:", form)
  const errors = {};

  errors.email = validateEmail(form.email);
  
  if (form.customerType === 'business') {
    errors.firstName = validateName(form.firstName, 'First name');
    errors.lastName = validateName(form.lastName, 'Last name');
    errors.companyName = validateCompany(form.companyName);
    errors.phoneNumber = validatePhone(form.phoneNumber);
    // errors.website = validateWebsite(form.website);
  }

  if(formType === 'contact'){
    errors.subject = validateRequired(form.subject, 'Inquiry subject')
    errors.message = validateRequired(form.message, 'Inquiry message')
    // errors.firstName = validateName(form.firstName, 'First name');
    // errors.lastName = validateName(form.lastName, 'Last name');
  }
  console.log("Errors before returning: ", errors)
  return {
    isValid: Object.values(errors).every(error => error === null),
    errors
  };
};