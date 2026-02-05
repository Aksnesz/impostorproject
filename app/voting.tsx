import { useLocalSearchParams, useRouter } from "expo-router";
import { get, onValue, ref, update } from "firebase/database";
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

export default function Voting() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const roomCode = params.roomCode as string;
  const playerId = params.playerId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);

  const isSmallScreen = width < 380;
  const isMediumScreen = width < 480;

  const dynamicStyles = {
    titleFontSize: isSmallScreen ? 24 : isMediumScreen ? 28 : 32,
    buttonFontSize: isSmallScreen ? 14 : isMediumScreen ? 16 : 18,
  };

  useEffect(() => {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as Room;
        setRoom(data);

        const myVote = data.players[playerId]?.vote;
        if (myVote && myVote !== "") {
          setSelectedVote(myVote);
        }

        if (data.gameState.phase === "results") {
          router.replace({
            pathname: "/results",
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

  const handleVote = async (votedPlayerId: string) => {
    if (!room) return;

    setSelectedVote(votedPlayerId);

    // 1. Guardar voto en Firebase
    await update(ref(database, `rooms/${roomCode}/players/${playerId}`), {
      vote: votedPlayerId,
    });

    // 2. Solo el host procesa la votación
    const isHost = room.hostId === playerId;
    if (!isHost) return;

    // 3. Obtener datos actualizados de Firebase para verificar si todos votaron
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) return;
    
    const updatedRoom = snapshot.val() as Room;
    const playersArray = Object.values(updatedRoom.players);

    // 4. Verificar si TODOS votaron
    const allVoted = playersArray.every(
      (p) => p.vote && p.vote !== "",
    );

    if (!allVoted) {
      console.log("Falta alguien por votar:", playersArray);
      return;
    }

    // 5. Contar votos
    const voteCounts: { [key: string]: number } = {};
    playersArray.forEach((player) => {
      const vote = player.vote!;
      voteCounts[vote] = (voteCounts[vote] || 0) + 1;
    });

    // 6. Más votado
    let maxVotes = 0;
    let mostVoted = "";
    Object.entries(voteCounts).forEach(([pId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        mostVoted = pId;
      }
    });

    console.log(
      "Todos votaron! Resultados:",
      voteCounts,
      "Más votado:",
      mostVoted,
    );

    // 7. Cambiar a resultados
    await update(ref(database, `rooms/${roomCode}/gameState`), {
      phase: "results",
      votingResults: voteCounts,
      mostVoted,
    });
  };

  if (!room) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  const players = Object.values(room.players);
  const votedPlayers = players.filter((p) => p.vote && p.vote !== "").length;
  const hasVoted = selectedVote !== null && selectedVote !== "";

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: dynamicStyles.titleFontSize }]}>
          ¿QUIÉN ES EL IMPOSTOR?
        </Text>
        <Text style={styles.subtitle}>
          Vota por quien creas que es el impostor
        </Text>
      </View>

      <View style={styles.voteStatus}>
        <Text style={styles.voteStatusText}>
          {votedPlayers} / {players.length} jugadores han votado
        </Text>
      </View>

      <View style={styles.playersContainer}>
        {players
          .map((player) => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.playerButton,
                selectedVote === player.id && styles.playerButtonSelected,
                hasVoted &&
                  selectedVote !== player.id &&
                  styles.playerButtonDisabled,
              ]}
              onPress={() => !hasVoted && handleVote(player.id)}
              disabled={hasVoted}
            >
              <Text
                style={[
                  styles.playerButtonText,
                  selectedVote === player.id && styles.playerButtonTextSelected,
                ]}
              >
                {player.name}
                {selectedVote === player.id && " ✓"}
              </Text>
            </TouchableOpacity>
          ))}
      </View>

      {hasVoted && (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>Esperando a que todos voten...</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    color: "#ff006e",
    fontWeight: "bold",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  voteStatus: {
    backgroundColor: "#16213e",
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#ff006e",
  },
  voteStatusText: {
    color: "#00ff88",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  playersContainer: {
    gap: 12,
  },
  playerButton: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "#444",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  playerButtonSelected: {
    backgroundColor: "#ff006e",
    borderColor: "#ff006e",
  },
  playerButtonDisabled: {
    opacity: 0.5,
  },
  playerButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 1,
  },
  playerButtonTextSelected: {
    color: "#fff",
  },
  waitingContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  waitingText: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
  },
});
