import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { get, ref, set } from "firebase/database";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { database } from "../config/firebase";
import { generatePlayerId, generateRoomCode } from "../utils/gameHelpers";

export default function Index() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isSmallScreen = width < 380;
  const isMediumScreen = width < 480;
  const dynamicStyles = {
    titleFontSize: isSmallScreen ? 48 : isMediumScreen ? 60 : 72,
    buttonFontSize: isSmallScreen ? 16 : isMediumScreen ? 18 : 20,
    inputFontSize: isSmallScreen ? 14 : 16,
  };

  const createRoom = async () => {
    if (!playerName.trim()) {
      Alert.alert("Error", "Por favor ingresa tu nombre");
      return;
    }

    setIsLoading(true);
    try {
      const playerId = generatePlayerId();
      const newRoomCode = generateRoomCode();

      await AsyncStorage.setItem("playerId", playerId);
      await AsyncStorage.setItem("playerName", playerName.trim());

      const roomRef = ref(database, `rooms/${newRoomCode}`);
      await set(roomRef, {
        id: newRoomCode,
        hostId: playerId,
        players: {
          [playerId]: {
            id: playerId,
            name: playerName.trim(),
            isHost: true,
            hasRevealed: false,
            isImpostor: false,
            vote: "",
          },
        },
        config: {
          impostors: 1,
          enableClue: false,
          categories: [],
        },
        gameState: {
          phase: "lobby",
          currentWord: "",
          currentClue: "",
          timeLeft: 420,
          impostorIds: [],
        },
        createdAt: Date.now(),
      });

      router.push({
        pathname: "/room",
        params: { roomCode: newRoomCode, playerId },
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo crear la sala");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!playerName.trim()) {
      Alert.alert("Error", "Por favor ingresa tu nombre");
      return;
    }
    if (!roomCode.trim()) {
      Alert.alert("Error", "Por favor ingresa el código de sala");
      return;
    }

    setIsLoading(true);
    try {
      const playerId = generatePlayerId();
      const roomRef = ref(database, `rooms/${roomCode.toUpperCase()}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        Alert.alert("Error", "La sala no existe");
        return;
      }

      const roomData = snapshot.val();

      // Verificar si ya hay 6 jugadores
      if (Object.keys(roomData.players || {}).length >= 6) {
        Alert.alert("Error", "La sala está llena (máximo 6 jugadores)");
        return;
      }

      await AsyncStorage.setItem("playerId", playerId);
      await AsyncStorage.setItem("playerName", playerName.trim());

      await set(
        ref(database, `rooms/${roomCode.toUpperCase()}/players/${playerId}`),
        {
          id: playerId,
          name: playerName.trim(),
          isHost: false,
          hasRevealed: false,
          isImpostor: false,
          vote: "",
        },
      );

      router.push({
        pathname: "/room",
        params: { roomCode: roomCode.toUpperCase(), playerId },
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo unir a la sala");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontSize: dynamicStyles.titleFontSize }]}>
        IMPOSTOR
      </Text>

      <View style={styles.formContainer}>
        <TextInput
          style={[styles.input, { fontSize: dynamicStyles.inputFontSize }]}
          placeholder="Tu nombre"
          placeholderTextColor="#999"
          value={playerName}
          onChangeText={setPlayerName}
          maxLength={15}
        />

        <TouchableOpacity
          style={[styles.button, styles.createButton]}
          onPress={createRoom}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.buttonText,
              { fontSize: dynamicStyles.buttonFontSize },
            ]}
          >
            CREAR SALA
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>O</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={[styles.input, { fontSize: dynamicStyles.inputFontSize }]}
          placeholder="Código de sala"
          placeholderTextColor="#999"
          value={roomCode}
          onChangeText={(text) => setRoomCode(text.toUpperCase())}
          maxLength={6}
          autoCapitalize="characters"
        />

        <TouchableOpacity
          style={[styles.button, styles.joinButton]}
          onPress={joinRoom}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.buttonText,
              { fontSize: dynamicStyles.buttonFontSize },
            ]}
          >
            UNIRSE A SALA
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 20,
  },
  title: {
    fontWeight: "bold",
    color: "#ff006e",
    marginBottom: 60,
    letterSpacing: 4,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
  },
  input: {
    backgroundColor: "#16213e",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ff006e",
    marginBottom: 15,
    textAlign: "center",
  },
  button: {
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 15,
    shadowColor: "#ff006e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 15,
  },
  createButton: {
    backgroundColor: "#ff006e",
  },
  joinButton: {
    backgroundColor: "#00ff88",
  },
  buttonText: {
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 2,
    textAlign: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#444",
  },
  dividerText: {
    color: "#888",
    marginHorizontal: 15,
    fontSize: 14,
  },
});
