export function timeAgo(dateString: string) {
  const date = new Date(dateString); // NON aggiungere offset
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds} secondi fa`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minuti fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ore fa`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} giorni fa`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} settimane fa`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mesi fa`;
  const years = Math.floor(days / 365);
  return `${years} anni fa`;
}
