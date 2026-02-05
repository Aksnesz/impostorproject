export const generateRoomCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const generatePlayerId = (): string => {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const selectImpostors = (
  playerIds: string[],
  count: number,
): string[] => {
  const shuffled = shuffleArray(playerIds);
  return shuffled.slice(0, count);
};
