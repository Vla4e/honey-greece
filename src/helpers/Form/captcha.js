let siteKey = '6LeduiYqAAAAAM0sVYQ7IRkiObV6HU5w-ZPFkLbQ'
export async function getCaptchaToken() {
  await new Promise(resolve => {
    grecaptcha.ready(resolve);
  });

  try {
    const token = await grecaptcha.execute(siteKey, { action: 'submit' });
    return token;
  } catch (error) {
    console.error('reCAPTCHA execution failed:', error);
    alert('We had trouble verifying you’re not a bot. Please try again or contact us at info@premiumhoney.gr if the problem persists.');
    // Throw so the caller knows it failed and stops any further logic
    throw error;
  }
}