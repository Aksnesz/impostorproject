import { useLocalSearchParams, useRouter } from "expo-router";
import { get, onValue, ref, update } from "firebase/database"; // ← AGREGADO get
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { database } from "../config/firebase";
import { Room } from "../types/game";

export default function GamePlay() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const roomCode = params.roomCode as string;
  const playerId = params.playerId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [timeLeft, setTimeLeft] = useState(420);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isSmallScreen = width < 380;
  const isMediumScreen = width < 480;

  const dynamicStyles = {
    messageFontSize: isSmallScreen ? 24 : isMediumScreen ? 28 : 32,
    timerFontSize: isSmallScreen ? 56 : isMediumScreen ? 72 : 88,
  };

  useEffect(() => {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as Room;
        setRoom(data);
        setTimeLeft(data.gameState.timeLeft);

        if (data.gameState.phase === "voting") {
          router.replace({
            pathname: "/voting",
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

  // NUEVA: Función para iniciar votación limpiando votos
  const startVotingPhase = useCallback(async () => {
    console.log("startVotingPhase ejecutado");
    // 1. Resetear votos de TODOS los jugadores
    const playersRef = ref(database, `rooms/${roomCode}/players`);
    const snapshot = await get(playersRef);

    if (snapshot.exists()) {
      const updates: any = {};
      snapshot.forEach((child) => {
        updates[`${child.key}/vote`] = "";
      });
      console.log("Actualizando votos:", updates);
      await update(playersRef, updates);
      console.log("Votos actualizados");
    }

    // 2. Cambiar fase a voting
    console.log("Cambiando fase a voting");
    await update(ref(database, `rooms/${roomCode}/gameState`), {
      phase: "voting",
      timeLeft: 0,
    });
    console.log("Fase cambiada a voting");
  }, [roomCode]);

  // Timer solo host
  useEffect(() => {
    if (!room) return;

    const isHost = room.hostId === playerId;

    if (isHost && room.gameState.phase === "playing") {
      timerRef.current = setInterval(async () => {
        const newTime = timeLeft - 1;

        if (newTime <= 0) {
          clearInterval(timerRef.current!);
          await startVotingPhase(); // ← USANDO LA NUEVA FUNCIÓN
        } else {
          await update(ref(database, `rooms/${roomCode}/gameState`), {
            timeLeft: newTime,
          });
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft, room, playerId, roomCode, startVotingPhase]);

  const handleBackPress = useCallback(async () => {
    console.log("handleBackPress ejecutado");
    // En web, usar window.confirm directamente
    if (Platform.OS === "web") {
      console.log("Ejecutando en web");
      const confirmEnd = window.confirm("¿Terminar el juego? Esto cerrará la partida para todos");
      console.log("Confirmación:", confirmEnd);
      if (!confirmEnd) return;
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      console.log("Actualizando fase a lobby");
      await update(ref(database, `rooms/${roomCode}/gameState`), {
        phase: "lobby",
      });
      console.log("Fase actualizada, redirigiendo");
      router.replace({
        pathname: "/room",
        params: { roomCode, playerId },
      });
    } else {
      // En móvil, usar Alert
      Alert.alert("¿Terminar el juego?", "Esto cerrará la partida para todos", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Terminar",
          style: "destructive",
          onPress: async () => {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            console.log("Actualizando fase a lobby (móvil)");
            await update(ref(database, `rooms/${roomCode}/gameState`), {
              phase: "lobby",
            });
            console.log("Fase actualizada, redirigiendo (móvil)");
            router.replace({
              pathname: "/room",
              params: { roomCode, playerId },
            });
          },
        },
      ]);
    }
  }, [roomCode, playerId, router]);

  // Botón skip (solo host)
  const handleSkipTimer = useCallback(async () => {
    console.log("handleSkipTimer ejecutado");
    // En web, usar window.confirm directamente
    if (Platform.OS === "web") {
      console.log("Ejecutando skip en web");
      const confirmSkip = window.confirm("¿Quieres pasar directamente a la votación?");
      console.log("Confirmación skip:", confirmSkip);
      if (!confirmSkip) return;
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      console.log("Ejecutando startVotingPhase desde skip");
      await startVotingPhase();
      console.log("startVotingPhase completado");
    } else {
      // En móvil, usar Alert
      Alert.alert("Saltar discusión", "¿Quieres pasar directamente a la votación?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, saltar",
          style: "destructive",
          onPress: async () => {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            console.log("Ejecutando startVotingPhase desde skip (móvil)");
            await startVotingPhase();
            console.log("startVotingPhase completado (móvil)");
          },
        },
      ]);
    }
  }, [startVotingPhase]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!room) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  const isHost = room.hostId === playerId;
  const isPlaying = room.gameState.phase === "playing";

  console.log("GamePlay - isHost:", isHost, "hostId:", room.hostId, "playerId:", playerId);
  console.log("GamePlay - phase:", room.gameState.phase, "isPlaying:", isPlaying);

  return (
    <View style={styles.container}>
      {isHost && (
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>← TERMINAR</Text>
        </TouchableOpacity>
      )}

      <View style={styles.centerContent}>
        <View style={styles.headerContainer}>
          <Text
            style={[
              styles.message,
              { fontSize: dynamicStyles.messageFontSize },
            ]}
          >
            ¡DISCUTAN!
          </Text>
          <Text style={styles.instruction}>Encuentren al impostor</Text>
        </View>

        <View style={styles.timerContainer}>
          <Text
            style={[styles.timer, { fontSize: dynamicStyles.timerFontSize }]}
          >
            {formatTime(timeLeft)}
          </Text>

          {isHost && isPlaying && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkipTimer}
            >
              <Text style={styles.skipButtonText}>SALTAR A VOTACIÓN</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.playersContainer}>
          <Text style={styles.playersTitle}>Jugadores en partida:</Text>
          {Object.values(room.players).map((player) => (
            <Text key={player.id} style={styles.playerText}>
              {player.name} {player.isHost && "👑"}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skipButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#ff006e",
    borderRadius: 12,
  },
  skipButtonText: {
    color: "#fff",
    fontWeight: "bold",
    letterSpacing: 1,
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  message: {
    color: "#00ff88",
    fontWeight: "bold",
    letterSpacing: 3,
    textAlign: "center",
  },
  instruction: {
    color: "#888",
    fontSize: 16,
    marginTop: 10,
    fontStyle: "italic",
  },
  timerContainer: {
    alignItems: "center",
    backgroundColor: "#16213e",
    borderRadius: 20,
    padding: 40,
    borderWidth: 2,
    borderColor: "#ff006e",
    shadowColor: "#ff006e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 40,
  },
  timer: {
    color: "#ff006e",
    fontWeight: "bold",
    letterSpacing: 2,
  },
  playersContainer: {
    alignItems: "center",
  },
  playersTitle: {
    color: "#ff006e",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    letterSpacing: 1,
  },
  playerText: {
    color: "#888",
    fontSize: 14,
    marginVertical: 3,
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#16213e",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ff006e",
    zIndex: 10,
  },
  backButtonText: {
    color: "#ff006e",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 1,
  },
});
