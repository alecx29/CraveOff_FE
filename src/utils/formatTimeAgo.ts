export function formatTimeAgo(input?: string | number | Date): string {
  try {
    if (!input) return '';
    const date = new Date(input);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    let diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds
    if (diff < 0) diff = 0;
    if (diff < 5) return 'now';
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return mins === 1 ? '1 min ago' : `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return months <= 1 ? '1 month ago' : `${months} months ago`;
    const years = Math.floor(days / 365);
    return years <= 1 ? '1 year ago' : `${years} years ago`;
  } catch {
    return '';
  }
}


