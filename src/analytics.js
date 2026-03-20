import ReactGA from "react-ga4";

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function initAnalytics() {
  if (!MEASUREMENT_ID) return;
  ReactGA.initialize(MEASUREMENT_ID);
}

export function trackEvent(category, action, label) {
  if (!MEASUREMENT_ID) return;
  ReactGA.event({ category, action, label });
}

// Conveniences
export const Analytics = {
  loginSuccess: (role) => trackEvent("Auth", "login_success", role),
  loginFailure: (reason) => trackEvent("Auth", "login_failure", reason),
  register: () => trackEvent("Auth", "register"),
  logout: (role) => trackEvent("Auth", "logout", role),
  viewChange: (view) => trackEvent("Navigation", "view_change", view),
  eventCreated: (tipo) => trackEvent("Events", "event_created", tipo),
  eventDeleted: (tipo) => trackEvent("Events", "event_deleted", tipo),
  eventEdited: (tipo) => trackEvent("Events", "event_edited", tipo),
};
