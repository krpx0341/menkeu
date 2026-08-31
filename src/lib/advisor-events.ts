// Lets a header button open the AI Advisor panel without lifting its open
// state up — the panel is mounted once at the body level (src/app/layout.tsx)
// while its trigger now lives inside the header, in a different component tree.
export const OPEN_ADVISOR_EVENT = "menkeu:open-advisor";

export function openAdvisor() {
  window.dispatchEvent(new Event(OPEN_ADVISOR_EVENT));
}
