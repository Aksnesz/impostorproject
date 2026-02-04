import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

interface GamePlayState {
  players: string[];
  impostors: number[];
  categories: string[];
  currentWord: string;
}

export default function GamePlay() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();

  const handleBackPress = () => {
    Alert.alert("¿Quieres terminar el juego?", "", [
      {
        text: "Cancelar",
        onPress: () => {},
        style: "cancel",
      },
      {
        text: "Continuar",
        onPress: () => {
          router.push("/game-setup");
        },
        style: "destructive",
      },
    ]);
  };

  // Reconstruct game state from params
  const gameState: GamePlayState = {
    players: params.playersJson ? JSON.parse(params.playersJson as string) : [],
    impostors: params.impostorsJson
      ? JSON.parse(params.impostorsJson as string)
      : [],
    categories: params.categoriesJson
      ? JSON.parse(params.categoriesJson as string)
      : [],
    currentWord: params.currentWord as string,
  };

  const [timeLeft, setTimeLeft] = useState(420); // 7 minutes
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Select random speaker at component mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * gameState.players.length);
    setCurrentSpeakerIndex(randomIndex);
  }, []);

  // Timer countdown
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (timeLeft > 0) {
        setTimeLeft(timeLeft - 1);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const currentSpeaker = gameState.players[currentSpeakerIndex];
  const isSmallScreen = width < 380;
  const isMediumScreen = width < 480;

  const dynamicStyles = {
    messageFontSize: isSmallScreen ? 24 : isMediumScreen ? 28 : 32,
    timerFontSize: isSmallScreen ? 56 : isMediumScreen ? 72 : 88,
    playerFontSize: isSmallScreen ? 28 : isMediumScreen ? 36 : 44,
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Text style={styles.backButtonText}>← ATRÁS</Text>
      </TouchableOpacity>

      <View style={styles.centerContent}>
        {/* Message and Player Name */}
        <View style={styles.headerContainer}>
          <Text
            style={[
              styles.message,
              { fontSize: dynamicStyles.messageFontSize },
            ]}
          >
            COMIENZA
          </Text>

          <Text
            style={[
              styles.playerName,
              { fontSize: dynamicStyles.playerFontSize },
            ]}
          >
            {currentSpeaker}
          </Text>
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text
            style={[styles.timer, { fontSize: dynamicStyles.timerFontSize }]}
          >
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 80,
  },
  message: {
    color: "#00ff88",
    fontWeight: "bold",
    letterSpacing: 3,
    textAlign: "center",
  },
  playerName: {
    color: "#ff006e",
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 2,
    marginTop: 15,
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
  },
  timer: {
    color: "#ff006e",
    fontWeight: "bold",
    letterSpacing: 2,
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
  },
  backButtonText: {
    color: "#ff006e",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 1,
  },
});
