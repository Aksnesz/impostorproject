export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  hasRevealed: boolean;
  isImpostor: boolean;
  vote: string;
}

export interface Room {
  id: string;
  hostId: string;
  players: { [key: string]: Player };
  config: {
    impostors: number;
    enableClue: boolean;
    categories: string[];
  };
  gameState: {
    phase: "lobby" | "revealing" | "playing" | "voting" | "results";
    currentWord: string;
    currentClue: string;
    timeLeft: number;
    impostorIds: string[];
    votingResults?: { [playerId: string]: number };
    mostVoted?: string;
    wordRejections?: { [playerId: string]: boolean }; // Track who rejected
    rejectionCount?: number; // Total rejections for current word
  };
  createdAt: number;
}
