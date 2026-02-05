import { useLocalSearchParams, useRouter } from "expo-router";
import { onValue, ref, update } from "firebase/database";
import { useEffect, useState } from "react";
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { database } from "../config/firebase";
import { Room } from "../types/game";

export default function Results() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const roomCode = params.roomCode as string;
  const playerId = params.playerId as string;

  const [room, setRoom] = useState<Room | null>(null);

  const isSmallScreen = width < 380;
  const isMediumScreen = width < 480;

  const dynamicStyles = {
    titleFontSize: isSmallScreen ? 28 : isMediumScreen ? 36 : 44,
    subtitleFontSize: isSmallScreen ? 16 : isMediumScreen ? 18 : 20,
    buttonFontSize: isSmallScreen ? 14 : isMediumScreen ? 16 : 18,
  };

  useEffect(() => {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as Room;
        setRoom(data);

        // Si vuelve a lobby, redirigir
        if (data.gameState.phase === "lobby") {
          router.replace({
            pathname: "/room",
            params: { roomCode, playerId },
          });
        }
      } else {
        // Sala cerrada
        if (Platform.OS === "web") {
          alert("La sala ha sido cerrada");
          router.replace("/");
        } else {
          Alert.alert("Sala cerrada", "La sala ha sido cerrada por el host", [
            { text: "OK", onPress: () => router.replace("/") },
          ]);
        }
      }
    });

    return () => unsubscribe();
  }, [roomCode, playerId]);

  const handlePlayAgain = async () => {
    if (!room) return;

    const isHost = room.hostId === playerId;
    if (!isHost) return;

    // Resetear el estado del juego
    const playerIds = Object.keys(room.players);
    for (const pId of playerIds) {
      await update(ref(database, `rooms/${roomCode}/players/${pId}`), {
        hasRevealed: false,
        isImpostor: false,
        vote: "",
      });
    }

    await update(ref(database, `rooms/${roomCode}/gameState`), {
      phase: "lobby",
      currentWord: "",
      currentClue: "",
      timeLeft: 420,
      impostorIds: [],
      votingResults: null,
      mostVoted: null,
    });
  };

  if (!room) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  const mostVotedId = room.gameState.mostVoted;
  const mostVotedPlayer = mostVotedId ? room.players[mostVotedId] : null;
  const wasImpostor = mostVotedPlayer?.isImpostor || false;

  const impostors = Object.values(room.players).filter((p) => p.isImpostor);
  const isHost = room.hostId === playerId;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Resultado principal */}
        <View style={styles.resultContainer}>
          <Text
            style={[
              styles.votedTitle,
              { fontSize: dynamicStyles.subtitleFontSize },
            ]}
          >
            Jugador más votado:
          </Text>
          <Text
            style={[
              styles.votedName,
              { fontSize: dynamicStyles.titleFontSize },
            ]}
          >
            {mostVotedPlayer?.name || "Nadie"}
          </Text>

          {mostVotedPlayer && (
            <View
              style={[
                styles.resultBadge,
                wasImpostor ? styles.correctBadge : styles.wrongBadge,
              ]}
            >
              <Text style={styles.resultText}>
                {wasImpostor ? "¡ERA EL IMPOSTOR! ✓" : "NO ERA EL IMPOSTOR ✗"}
              </Text>
            </View>
          )}
        </View>

        {/* Mostrar palabra */}
        <View style={styles.wordContainer}>
          <Text style={styles.wordLabel}>La palabra era:</Text>
          <Text style={styles.wordText}>{room.gameState.currentWord}</Text>
        </View>

        {/* Mostrar quién era el impostor si no acertaron */}
        {!wasImpostor && (
          <View style={styles.impostorsContainer}>
            <Text style={styles.impostorsTitle}>
              {impostors.length > 1
                ? "Los impostores eran:"
                : "El impostor era:"}
            </Text>
            {impostors.map((impostor) => (
              <Text key={impostor.id} style={styles.impostorName}>
                {impostor.name}
              </Text>
            ))}
          </View>
        )}

        {/* Resultados de votación */}
        <View style={styles.votingResultsContainer}>
          <Text style={styles.votingResultsTitle}>Resultados de votación:</Text>
          {Object.entries(room.gameState.votingResults || {}).map(
            ([pId, votes]) => {
              const player = room.players[pId];
              return (
                <View key={pId} style={styles.voteResultItem}>
                  <Text style={styles.votePlayerName}>{player?.name}</Text>
                  <Text style={styles.voteCount}>
                    {votes} voto{votes !== 1 ? "s" : ""}
                  </Text>
                </View>
              );
            },
          )}
        </View>

        {/* Ganador */}
        <View style={styles.winnerContainer}>
          <Text style={styles.winnerTitle}>
            {wasImpostor
              ? "¡GANAN LOS CIUDADANOS! 🎉"
              : "¡GANA EL IMPOSTOR! 😈"}
          </Text>
        </View>

        {/* Botón jugar de nuevo */}
        {isHost ? (
          <TouchableOpacity
            style={styles.playAgainButton}
            onPress={handlePlayAgain}
          >
            <Text
              style={[
                styles.playAgainText,
                { fontSize: dynamicStyles.buttonFontSize },
              ]}
            >
              JUGAR DE NUEVO
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>Esperando al host...</Text>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  resultContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  votedTitle: {
    color: "#888",
    fontWeight: "600",
    marginBottom: 10,
    letterSpacing: 1,
  },
  votedName: {
    color: "#fff",
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 20,
  },
  resultBadge: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginTop: 10,
  },
  correctBadge: {
    backgroundColor: "#00ff88",
  },
  wrongBadge: {
    backgroundColor: "#ff006e",
  },
  resultText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  wordContainer: {
    backgroundColor: "#16213e",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#00ff88",
    alignItems: "center",
  },
  wordLabel: {
    color: "#888",
    fontSize: 14,
    marginBottom: 8,
  },
  wordText: {
    color: "#00ff88",
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  impostorsContainer: {
    backgroundColor: "#16213e",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#ff006e",
    alignItems: "center",
  },
  impostorsTitle: {
    color: "#ff006e",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    letterSpacing: 1,
  },
  impostorName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginVertical: 5,
  },
  votingResultsContainer: {
    backgroundColor: "#16213e",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#444",
  },
  votingResultsTitle: {
    color: "#ff006e",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    letterSpacing: 1,
  },
  voteResultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  votePlayerName: {
    color: "#fff",
    fontSize: 16,
  },
  voteCount: {
    color: "#00ff88",
    fontSize: 16,
    fontWeight: "600",
  },
  winnerContainer: {
    backgroundColor: "#16213e",
    padding: 25,
    borderRadius: 15,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: "#ffaa00",
    alignItems: "center",
  },
  winnerTitle: {
    color: "#ffaa00",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 2,
    textAlign: "center",
  },
  playAgainButton: {
    backgroundColor: "#ff006e",
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#ff006e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  playAgainText: {
    color: "#fff",
    fontWeight: "bold",
    letterSpacing: 2,
  },
  waitingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  waitingText: {
    color: "#888",
    fontSize: 16,
    fontStyle: "italic",
  },
});
