/**
 * Masks an email address showing first 3 characters and full domain
 * Example: john.doe@gmail.com -> joh***@gmail.com
 */
export function maskEmail(email: string): string {
  if (!email || email.length < 5) return '***@***';

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return '***@***';

  const visibleChars = Math.min(3, localPart.length);
  const maskedLocal = localPart.substring(0, visibleChars) + '***';

  return `${maskedLocal}@${domain}`;
}

/**
 * Calculate "hot" score for Reddit-style ranking
 * Higher score = more recent and more upvotes
 */
export function calculateHotScore(upvotes: number, createdAt: string): number {
  const now = new Date().getTime();
  const created = new Date(createdAt).getTime();
  const ageInHours = (now - created) / (1000 * 60 * 60);

  // Decay factor: posts lose relevance over time
  // Score = upvotes / (age_in_hours + 2)^1.5
  return upvotes / Math.pow(ageInHours + 2, 1.5);
}

/**
 * Get display name for category
 */
export function getCategoryDisplayName(category: string): string {
  const categoryMap: Record<string, string> = {
    bug_report: 'Zgłoszenie błędu',
    feature_request: 'Prośba o funkcję',
    ui_ux_feedback: 'Opinia UI/UX',
    general_feedback: 'Opinia ogólna',
  };
  return categoryMap[category] || category;
}

/**
 * Get display name for status
 */
export function getStatusDisplayName(status: string): string {
  const statusMap: Record<string, string> = {
    open: 'Otwarte',
    in_progress: 'W trakcie',
    completed: 'Zakończone',
    closed: 'Zamknięte',
  };
  return statusMap[status] || status;
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    open: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    in_progress: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
    completed: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
    closed: 'bg-slate-500/20 border-slate-500/30 text-slate-300',
  };
  return colorMap[status] || 'bg-slate-500/20 border-slate-500/30 text-slate-300';
}

/**
 * Get category color
 */
export function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    bug_report: 'bg-red-500/20 border-red-500/30 text-red-300',
    feature_request: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
    ui_ux_feedback: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
    general_feedback: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
  };
  return colorMap[category] || 'bg-slate-500/20 border-slate-500/30 text-slate-300';
}
