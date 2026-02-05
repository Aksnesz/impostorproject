import { useLocalSearchParams, useRouter } from "expo-router";
import { onValue, ref, update } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { database } from "../config/firebase";
import { Room } from "../types/game";

export default function Game() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const roomCode = params.roomCode as string;
  const playerId = params.playerId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [allRevealed, setAllRevealed] = useState(false);

  const pan = useRef(new Animated.ValueXY()).current;

  const isSmallScreen = width < 380;
  const isMediumScreen = width < 480;

  const dynamicStyles = {
    playerNameFontSize: isSmallScreen ? 24 : isMediumScreen ? 28 : 32,
    cardTitleFontSize: isSmallScreen ? 14 : isMediumScreen ? 16 : 18,
    wordFontSize: isSmallScreen ? 32 : isMediumScreen ? 40 : 48,
    impostorFontSize: isSmallScreen ? 28 : isMediumScreen ? 36 : 44,
  };

  useEffect(() => {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as Room;
        setRoom(data);

        // Verificar si todos revelaron
        const players = Object.values(data.players);
        const allHaveRevealed = players.every((p) => p.hasRevealed);
        setAllRevealed(allHaveRevealed);

        // Si cambia a fase de juego, redirigir
        if (data.gameState.phase === "playing") {
          router.replace({
            pathname: "/game-play",
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !revealed,
      onMoveShouldSetPanResponder: () => !revealed,
      onPanResponderMove: (evt, gestureState) => {
        // Solo permitir movimiento hacia arriba (dy negativo)
        if (gestureState.dy < 0) {
          pan.setValue({ x: 0, y: gestureState.dy });
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Si deslizó suficiente hacia arriba, revelar
        if (gestureState.dy < -80 && !revealed) {
          // Animar hacia arriba completamente
          Animated.timing(pan, {
            toValue: { x: 0, y: -400 },
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            revealCard();
          });
        } else {
          // Regresar a la posición original
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 7,
            tension: 40,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  const revealCard = async () => {
    setRevealed(true);
    // Resetear la posición de la animación
    pan.setValue({ x: 0, y: 0 });

    // Marcar como revelado en la base de datos
    await update(ref(database, `rooms/${roomCode}/players/${playerId}`), {
      hasRevealed: true,
    });
  };

  const startPlaying = async () => {
    if (!room) return;

    // Solo el host puede iniciar la fase de juego
    const isHost = room.hostId === playerId;
    if (!isHost) return;

    await update(ref(database, `rooms/${roomCode}/gameState`), {
      phase: "playing",
    });
  };

  if (!room) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  const currentPlayer = room.players[playerId];
  const isImpostor = currentPlayer?.isImpostor || false;
  const isHost = room.hostId === playerId;
  const isWeb = Platform.OS === "web";

  return (
    <View style={styles.container}>
      <View style={styles.playerNameContainer}>
        <Text
          style={[
            styles.playerName,
            { fontSize: dynamicStyles.playerNameFontSize },
          ]}
        >
          {currentPlayer?.name}
        </Text>
      </View>

      <View style={styles.cardContainer}>
        {/* Tarjeta de fondo - siempre visible con la palabra */}
        <View style={[styles.card, styles.cardBackground]}>
          <Text
            style={[
              styles.cardTitle,
              { fontSize: dynamicStyles.cardTitleFontSize },
            ]}
          >
            TU PALABRA
          </Text>
          <View style={styles.cardContent}>
            {isImpostor ? (
              <>
                <Text
                  style={[
                    styles.impostorText,
                    { fontSize: dynamicStyles.impostorFontSize },
                  ]}
                >
                  IMPOSTOR
                </Text>
                {room.config.enableClue && (
                  <Text style={styles.clueText}>
                    Pista: {room.gameState.currentClue}
                  </Text>
                )}
              </>
            ) : (
              <Text
                style={[
                  styles.wordText,
                  { fontSize: dynamicStyles.wordFontSize },
                ]}
              >
                {room.gameState.currentWord}
              </Text>
            )}
          </View>
        </View>

        {/* Tarjeta frontal - se desliza hacia arriba */}
        {!revealed && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => !revealed && revealCard()}
            disabled={revealed}
            style={styles.cardTouchable}
          >
            <Animated.View
              {...(isWeb ? {} : panResponder.panHandlers)}
              style={[
                styles.card,
                styles.cardFront,
                {
                  transform: [{ translateY: pan.y }],
                },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  { fontSize: dynamicStyles.cardTitleFontSize },
                ]}
              >
                {isWeb ? "TOCA PARA REVELAR" : "DESLIZA HACIA ARRIBA"}
              </Text>
              <View style={styles.cardContent}>
                <Text style={styles.swipeHint}>{isWeb ? "👇" : "↑"}</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>

      {revealed && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {allRevealed
              ? isHost
                ? "Todos listos. Presiona COMENZAR"
                : "Esperando al host..."
              : "Esperando a los demás jugadores..."}
          </Text>

          <View style={styles.playersStatus}>
            {Object.values(room.players).map((player) => (
              <View key={player.id} style={styles.playerStatusItem}>
                <Text
                  style={[
                    styles.playerStatusText,
                    player.hasRevealed && styles.playerStatusRevealed,
                  ]}
                >
                  {player.name} {player.hasRevealed ? "✓" : "⏳"}
                </Text>
              </View>
            ))}
          </View>

          {isHost && allRevealed && (
            <TouchableOpacity style={styles.startButton} onPress={startPlaying}>
              <Text style={styles.startButtonText}>COMENZAR</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
  },
  playerNameContainer: {
    paddingVertical: 20,
    marginBottom: 20,
  },
  playerName: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 2,
  },
  cardContainer: {
    width: "100%",
    height: 350,
    position: "relative",
  },
  cardTouchable: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 2,
  },
  card: {
    width: "100%",
    height: 350,
    backgroundColor: "#16213e",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#ff006e",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    shadowColor: "#ff006e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  cardBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  cardFront: {
    backgroundColor: "#16213e",
    zIndex: 2,
  },
  cardTitle: {
    color: "#ff006e",
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 1,
  },
  cardContent: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  swipeHint: {
    color: "#888",
    fontSize: 40,
    fontWeight: "bold",
    marginTop: -20,
  },
  impostorText: {
    color: "#ff006e",
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 3,
  },
  wordText: {
    color: "#00ff88",
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 2,
  },
  clueText: {
    color: "#ffaa00",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 30,
    textAlign: "center",
    fontStyle: "italic",
  },
  statusContainer: {
    marginTop: 30,
    alignItems: "center",
    width: "100%",
  },
  statusText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    fontStyle: "italic",
  },
  playersStatus: {
    width: "100%",
    marginBottom: 20,
  },
  playerStatusItem: {
    paddingVertical: 8,
  },
  playerStatusText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  playerStatusRevealed: {
    color: "#00ff88",
  },
  startButton: {
    backgroundColor: "#ff006e",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 15,
    marginTop: 10,
    shadowColor: "#ff006e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 2,
  },
});
