import { useLocalSearchParams, useRouter } from "expo-router";
import { onValue, ref, remove, update } from "firebase/database";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { database } from "../config/firebase";
import { Room } from "../types/game";
import { selectImpostors } from "../utils/gameHelpers";

const WORDS_DATABASE: Record<string, string[]> = {
  Famosos: [
    "Taylor Swift",
    "Cristiano Ronaldo",
    "Messi",
    "Elon Musk",
    "Beyoncé",
  ],
  Deportes: ["Fútbol", "Basquetbol", "Tenis", "Natación", "Voleibol"],
  Películas: ["Avatar", "Titanic", "Inception", "Matrix", "Jurassic Park"],
  Comida: ["Tacos", "Pizza", "Sushi", "Hamburguesa", "Pasta"],
  Animales: ["Gato", "Perro", "León", "Elefante", "Águila"],
  Países: ["México", "España", "Japón", "Brasil", "Francia"],
  Músicos: ["Bad Bunny", "The Weeknd", "Shakira", "J Balvin", "Harry Styles"],
  Videojuegos: [
    "The Legend of Zelda",
    "Minecraft",
    "Elden Ring",
    "Super Mario",
    "Fortnite",
  ],
};

const CLUES_DATABASE: Record<string, string[]> = {
  "Taylor Swift": ["Música", "Cantante", "Popstar", "Eras"],
  "Cristiano Ronaldo": ["Fútbol", "Portugal", "Goles", "CR7"],
  Messi: ["Argentina", "Barcelona", "Fútbol", "GOAT"],
  "Elon Musk": ["Tesla", "SpaceX", "Billonario", "Twitter"],
  Beyoncé: ["Música", "Reina", "Diva", "Artista"],
  Fútbol: ["Pelota", "Gol", "Equipo", "Cancha"],
  Basquetbol: ["Aro", "NBA", "Cancha", "Pelota"],
  Tenis: ["Raqueta", "Red", "Wimbledon", "Pelota"],
  Natación: ["Agua", "Piscina", "Brazadas", "Olímpico"],
  Voleibol: ["Red", "Pelota", "Salto", "Equipo"],
  Avatar: ["Azul", "Pandora", "2009", "3D"],
  Titanic: ["Barco", "Iceberg", "1997", "Rose"],
  Inception: ["Sueños", "Leonardo", "Mente", "Compleja"],
  Matrix: ["Código", "Realidad", "Neo", "Píldora"],
  "Jurassic Park": ["Dinosaurios", "Parque", "Isla", "T-Rex"],
  Tacos: ["Tortilla", "Carne", "México", "Salsa"],
  Pizza: ["Queso", "Tomate", "Italia", "Horno"],
  Sushi: ["Arroz", "Pescado", "Japón", "Algas"],
  Hamburguesa: ["Pan", "Carne", "Americana", "Queso"],
  Pasta: ["Tallarín", "Italia", "Salsa", "Espagueti"],
  Gato: ["Felino", "Bigotes", "Mascota", "Miaus"],
  Perro: ["Ladridos", "Mascota", "Leal", "Canino"],
  León: ["Felino", "Melena", "Rey", "África"],
  Elefante: ["Trompa", "Enorme", "África", "Memoria"],
  Águila: ["Vuelo", "Rapaz", "Alas", "Visión"],
  México: ["América", "Tacos", "CDMX", "Español"],
  España: ["Europa", "Paella", "Madrid", "Flamenco"],
  Japón: ["Asia", "Sushi", "Tokio", "Anime"],
  Brasil: ["América", "Carnaval", "Samba", "Fútbol"],
  Francia: ["Europa", "Torre", "París", "Vino"],
  "Bad Bunny": ["Reggaeton", "Puertorriqueño", "Conejo", "Trap"],
  "The Weeknd": ["Canadá", "R&B", "XO", "Abel"],
  Shakira: ["Colombia", "Cadera", "Latina", "Cantante"],
  "J Balvin": ["Reggaeton", "Colombia", "Verde", "Latino"],
  "Harry Styles": ["One Direction", "Inglés", "Pop", "Solo"],
  "The Legend of Zelda": ["Link", "Nintendo", "Espada", "Triforce"],
  Minecraft: ["Bloques", "Construcción", "Cuadrado", "Crafting"],
  "Elden Ring": ["Difícil", "Jefe", "Fromsoftware", "Anillo"],
  "Super Mario": ["Tuberías", "Champiñón", "Nintendo", "Saltos"],
  Fortnite: ["Batalla Real", "Construcción", "Isla", "Multijugador"],
};

export default function RoomScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const roomCode = params.roomCode as string;
  const playerId = params.playerId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [impostors, setImpostors] = useState(1);
  const [enableClue, setEnableClue] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const categories = Object.keys(WORDS_DATABASE);

  const isSmallScreen = width < 380;
  const isMediumScreen = width < 480;
  const dynamicStyles = {
    titleFontSize: isSmallScreen ? 16 : isMediumScreen ? 18 : 20,
    buttonFontSize: isSmallScreen ? 14 : isMediumScreen ? 16 : 18,
  };

  const isHost = room?.hostId === playerId;
  const players = room?.players ? Object.values(room.players) : [];
  const canStart = players.length >= 3 && selectedCategories.length > 0;

  useEffect(() => {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as Room;
        setRoom(data);

        // Si el juego ya inició, redirigir a la pantalla correspondiente
        if (data.gameState.phase === "revealing") {
          router.replace({
            pathname: "/game",
            params: { roomCode, playerId },
          });
        } else if (data.gameState.phase === "playing") {
          router.replace({
            pathname: "/game-play",
            params: { roomCode, playerId },
          });
        } else if (data.gameState.phase === "voting") {
          router.replace({
            pathname: "/voting",
            params: { roomCode, playerId },
          });
        } else if (data.gameState.phase === "results") {
          router.replace({
            pathname: "/results",
            params: { roomCode, playerId },
          });
        }
      } else {
        Alert.alert("Sala cerrada", "La sala ha sido cerrada por el host", [
          { text: "OK", onPress: () => router.replace("/") },
        ]);
      }
    });

    return () => unsubscribe();
  }, [roomCode, playerId]);

  const handleCategorySelect = (category: string) => {
    if (!isHost) return;

    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleLeaveRoom = async () => {
    if (isHost) {
      Alert.alert(
        "¿Cerrar sala?",
        "Eres el host. Si sales, se cerrará la sala para todos.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Cerrar",
            style: "destructive",
            onPress: async () => {
              await remove(ref(database, `rooms/${roomCode}`));
              router.replace("/");
            },
          },
        ],
      );
    } else {
      await remove(ref(database, `rooms/${roomCode}/players/${playerId}`));
      router.replace("/");
    }
  };

  const startGame = async () => {
    if (!isHost || !canStart) return;

    // Seleccionar palabra aleatoria de las categorías seleccionadas
    const randomCategory =
      selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
    const categoryWords = WORDS_DATABASE[randomCategory];
    const randomWord =
      categoryWords[Math.floor(Math.random() * categoryWords.length)];

    // Seleccionar pista
    const clues = CLUES_DATABASE[randomWord] || ["Adivina"];
    const randomClue = clues[Math.floor(Math.random() * clues.length)];

    // Seleccionar impostores
    const playerIds = Object.keys(room!.players);
    const impostorIds = selectImpostors(playerIds, impostors);

    // Actualizar estado del juego
    await update(ref(database, `rooms/${roomCode}`), {
      "config/impostors": impostors,
      "config/enableClue": enableClue,
      "config/categories": selectedCategories,
      "gameState/phase": "revealing",
      "gameState/currentWord": randomWord,
      "gameState/currentClue": randomClue,
      "gameState/impostorIds": impostorIds,
      "gameState/timeLeft": 420,
    });

    // Marcar quién es impostor en cada jugador
    for (const pId of playerIds) {
      await update(ref(database, `rooms/${roomCode}/players/${pId}`), {
        isImpostor: impostorIds.includes(pId),
        hasRevealed: false,
        vote: null,
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleLeaveRoom}>
          <Text style={styles.backButtonText}>← SALIR</Text>
        </TouchableOpacity>

        <View style={styles.roomCodeContainer}>
          <Text style={styles.roomCodeLabel}>CÓDIGO:</Text>
          <Text style={styles.roomCode}>{roomCode}</Text>
        </View>
      </View>

      {/* Lista de jugadores */}
      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { fontSize: dynamicStyles.titleFontSize },
          ]}
        >
          Jugadores ({players.length}/6)
        </Text>
        <View style={styles.playersList}>
          {players.map((player) => (
            <View key={player.id} style={styles.playerItem}>
              <Text style={styles.playerName}>
                {player.name}
                {player.isHost && " 👑"}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {isHost && (
        <>
          {/* Configuración de impostores */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { fontSize: dynamicStyles.titleFontSize },
              ]}
            >
              Impostores
            </Text>
            <View style={styles.impostorOptions}>
              {[1, 2].map((num) => {
                const isDisabled = num === 2 && players.length <= 5;
                return (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.impostorButton,
                      impostors === num && styles.impostorButtonActive,
                      isDisabled && styles.impostorButtonDisabled,
                    ]}
                    onPress={() => !isDisabled && setImpostors(num)}
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.impostorButtonText,
                        impostors === num && styles.impostorButtonTextActive,
                        isDisabled && styles.impostorButtonTextDisabled,
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Categorías */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { fontSize: dynamicStyles.titleFontSize },
              ]}
            >
              Categorías
            </Text>
            <View style={styles.categoriesList}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryOption,
                    selectedCategories.includes(category) &&
                      styles.categoryOptionActive,
                  ]}
                  onPress={() => handleCategorySelect(category)}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      selectedCategories.includes(category) &&
                        styles.categoryOptionTextActive,
                    ]}
                  >
                    {category}
                    {selectedCategories.includes(category) && " ✓"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Pista */}
          <View style={styles.section}>
            <View style={styles.clueHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { fontSize: dynamicStyles.titleFontSize },
                ]}
              >
                Pista
              </Text>
              <Switch
                value={enableClue}
                onValueChange={setEnableClue}
                trackColor={{ false: "#444", true: "#ff006e" }}
                thumbColor={enableClue ? "#ff006e" : "#888"}
              />
            </View>
          </View>

          {/* Botón iniciar */}
          <TouchableOpacity
            style={[styles.startButton, !canStart && styles.buttonDisabled]}
            onPress={startGame}
            disabled={!canStart}
          >
            <Text
              style={[
                styles.startButtonText,
                { fontSize: dynamicStyles.buttonFontSize },
              ]}
            >
              {canStart ? "INICIAR JUEGO" : "Mínimo 3 jugadores y 1 categoría"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {!isHost && (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>
            Esperando a que el host inicie el juego...
          </Text>
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
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  backButton: {
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
  },
  roomCodeContainer: {
    alignItems: "center",
  },
  roomCodeLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 5,
  },
  roomCode: {
    color: "#00ff88",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 3,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ff006e",
    marginBottom: 15,
    letterSpacing: 1,
  },
  playersList: {
    gap: 8,
  },
  playerItem: {
    backgroundColor: "#16213e",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#ff006e",
  },
  playerName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  impostorOptions: {
    flexDirection: "row",
    gap: 15,
  },
  impostorButton: {
    flex: 1,
    backgroundColor: "#16213e",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#444",
  },
  impostorButtonActive: {
    backgroundColor: "#ff006e",
    borderColor: "#ff006e",
  },
  impostorButtonDisabled: {
    backgroundColor: "#333",
    borderColor: "#555",
    opacity: 0.5,
  },
  impostorButtonText: {
    color: "#888",
    fontSize: 20,
    fontWeight: "bold",
  },
  impostorButtonTextActive: {
    color: "#fff",
  },
  impostorButtonTextDisabled: {
    color: "#555",
  },
  categoriesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryOption: {
    backgroundColor: "#16213e",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#444",
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
  },
  categoryOptionActive: {
    backgroundColor: "#ff006e",
    borderColor: "#ff006e",
  },
  categoryOptionText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
  },
  categoryOptionTextActive: {
    color: "#fff",
  },
  clueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#ff006e",
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#ff006e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  buttonDisabled: {
    backgroundColor: "#555",
    shadowColor: "#555",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  waitingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  waitingText: {
    color: "#888",
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
  },
});
