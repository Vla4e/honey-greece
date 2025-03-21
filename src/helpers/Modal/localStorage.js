export const newsletterManager = {
  // Keys for localStorage
  SUBSCRIBED_KEY: 'newsletter_subscribed',
  DISMISSED_KEY: 'newsletter_dismissed_until',
  
  // Check if user has already subscribed
  hasSubscribed() {
    return localStorage.getItem(this.SUBSCRIBED_KEY) === 'true';
  },
  
  // Mark user as subscribed
  markAsSubscribed() {
    localStorage.setItem(this.SUBSCRIBED_KEY, 'true');
  },
  
  // Check if modal was dismissed recently
  isDismissed() {
    const dismissedUntil = localStorage.getItem(this.DISMISSED_KEY);
    if (!dismissedUntil) return false;
    
    return new Date().getTime() < parseInt(dismissedUntil);
  },
  
  // Dismiss modal for a period (default 7 days)
  dismissModal(days = 1) {
    // const dismissUntil = new Date().getTime() + (days * 24 * 60 * 60 * 1000);
    const dismissUntil = new Date().getTime() + (days * 24 * 60 * 60 * 1000);
    localStorage.setItem(this.DISMISSED_KEY, dismissUntil.toString());
  },

  clearModalLocalStorage(){
    console.log("Clearing Storage", this.SUBSCRIBED_KEY, this.DISMISSED_KEY)
    localStorage.setItem(this.SUBSCRIBED_KEY, 'false');
    localStorage.setItem(this.DISMISSED_KEY, 'false');
  },

  // Should show modal based on all conditions
  shouldShowModal(currentRoute, forceShow = false) {
    if (forceShow) return true
    // Only show on homepage or specific routes
    console.log("Checking show modal", currentRoute)
    const allowedRoutes = ['/', '/home'];
    const isAllowedRoute = allowedRoutes.includes(currentRoute);

    let hasSubscribed = this.hasSubscribed()
    let isDismissed = this.isDismissed()
    console.log("should show modal:", isAllowedRoute, hasSubscribed, isDismissed)

    let flag = isAllowedRoute && !hasSubscribed && !isDismissed;
    console.log("flag", flag)
    return flag;
  }
};