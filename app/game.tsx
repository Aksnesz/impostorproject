import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

interface GameState {
  players: string[];
  impostors: number;
  enableClue: boolean;
  categories: string[];
}

export default function Game() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();

  // Reconstruct game state from params
  const gameState: GameState = {
    players: params.playersJson ? JSON.parse(params.playersJson as string) : [],
    impostors: params.impostors ? parseInt(params.impostors as string) : 1,
    enableClue: params.enableClue === "true",
    categories: params.categoriesJson
      ? JSON.parse(params.categoriesJson as string)
      : [],
  };

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [impostorIndices, setImpostorIndices] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [revealedPlayers, setRevealedPlayers] = useState<number[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentWord, setCurrentWord] = useState("");
  const [currentClue, setCurrentClue] = useState("");
  const [shuffledPlayerIndices, setShuffledPlayerIndices] = useState<number[]>(
    [],
  );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pan = useRef(new Animated.ValueXY()).current;

  // Fisher-Yates shuffle algorithm
  const shuffleArray = (array: number[]): number[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Mock words for each category
  const wordsDatabase: Record<string, string[]> = {
    Famosos: [
      "Taylor Swift",
      "Cristiano Ronaldo",
      "Messi",
      "Elon Musk",
      "Beyoncé",
      "Oprah Winfrey",
      "Kim Kardashian",
      "Dwayne Johnson",
      "Zendaya",
    ],
    Deportes: [
      "Fútbol",
      "Basquetbol",
      "Tenis",
      "Natación",
      "Voleibol",
      "Golf",
      "Boxeo",
      "Ciclismo",
      "Atletismo",
    ],
    Películas: [
      "Avatar",
      "Titanic",
      "Inception",
      "Matrix",
      "Jurassic Park",
      "Interestelar",
      "Coco",
      "Harry Potter",
      "Top Gun",
    ],
    Comida: [
      "Tacos",
      "Pizza",
      "Sushi",
      "Hamburguesa",
      "Pasta",
      "Ceviche",
      "Ramen",
      "Paella",
      "Croissant",
    ],
    Animales: [
      "Gato",
      "Perro",
      "León",
      "Elefante",
      "Águila",
      "Delfín",
      "Tigre",
      "Jirafa",
      "Oso",
    ],
    Países: [
      "México",
      "España",
      "Japón",
      "Brasil",
      "Francia",
      "Alemania",
      "Italia",
      "Corea del Sur",
      "Canadá",
    ],
    Músicos: [
      "Bad Bunny",
      "The Weeknd",
      "Shakira",
      "J Balvin",
      "Harry Styles",
      "BTS",
      "Dua Lipa",
      "Drake",
      "Ariana Grande",
    ],
    Videojuegos: [
      "The Legend of Zelda",
      "Minecraft",
      "Elden Ring",
      "Super Mario",
      "Fortnite",
      "Call of Duty",
      "Pokémon",
      "Final Fantasy",
      "Halo",
    ],
  };

  // Clues for each category
  const cluesDatabase: Record<string, Record<string, string[]>> = {
    "Taylor Swift": [
      "Música",
      "Cantante",
      "Eras",
      "Popstar",
      "Álbumes",
      "Gatos",
      "Americana",
    ],
    "Cristiano Ronaldo": [
      "Fútbol",
      "Goles",
      "Portugal",
      "Delantero",
      "Músculos",
      "Celebración",
      "Real Madrid",
    ],
    Messi: [
      "Argentina",
      "Fútbol",
      "Barcelona",
      "Goles",
      "Tímido",
      "Leyenda",
      "GOAT",
    ],
    "Elon Musk": [
      "Tesla",
      "SpaceX",
      "Emprendedor",
      "Billonario",
      "Innovación",
      "Tweets",
      "Cohetes",
    ],
    Beyoncé: [
      "Música",
      "Reina",
      "Diva",
      "Artista",
      "Poder",
      "Glamour",
      "Dancer",
    ],
    "Oprah Winfrey": [
      "Televisión",
      "Billonaria",
      "Presentadora",
      "Filántropa",
      "Talkshow",
      "Libro",
      "Corazón",
    ],
    "Kim Kardashian": [
      "Realidad",
      "Influencer",
      "Belleza",
      "KUWTK",
      "Instagram",
      "Kardashian",
      "Negocios",
    ],
    "Dwayne Johnson": [
      "Acción",
      "Actor",
      "Roca",
      "Wrestler",
      "Músculos",
      "Sonrisa",
      "Carismático",
    ],
    Zendaya: [
      "Actriz",
      "Disney",
      "Joven",
      "Modeladora",
      "Moda",
      "Talentosa",
      "Spider-Man",
    ],
    Fútbol: ["Pelota", "Gol", "Equipo", "Cancha", "Portero", "Mundo", "Pasión"],
    Basquetbol: ["Aro", "Rebote", "Cancha", "Pelota", "NBA", "Salto", "Cesta"],
    Tenis: [
      "Raqueta",
      "Red",
      "Cancha",
      "Pelota",
      "Saque",
      "Wimbledon",
      "Punto",
    ],
    Natación: [
      "Agua",
      "Piscina",
      "Brazadas",
      "Deporte",
      "Mojado",
      "Velocidad",
      "Olímpico",
    ],
    Voleibol: ["Red", "Pelota", "Salto", "Equipo", "Pase", "Ataque", "Defensa"],
    Golf: [
      "Palo",
      "Hoyo",
      "Verde",
      "Deporte",
      "Tranquilidad",
      "Precisión",
      "Club",
    ],
    Boxeo: [
      "Puños",
      "Ring",
      "Guantes",
      "Nocaut",
      "Rounds",
      "Campeón",
      "Combate",
    ],
    Ciclismo: [
      "Bicicleta",
      "Ruedas",
      "Montaña",
      "Velocidad",
      "Tour",
      "Pedales",
      "Manillar",
    ],
    Atletismo: [
      "Carreras",
      "Saltos",
      "Velocidad",
      "Pista",
      "Olímpico",
      "Resistencia",
      "Oro",
    ],
    Gato: [
      "Felino",
      "Bigotes",
      "Miaus",
      "Doméstico",
      "Arañas",
      "Independiente",
      "Ágil",
    ],
    Perro: ["Ladridos", "Mascota", "Leal", "Canino", "Amigo", "Saliva", "Cola"],
    León: ["Felino", "Melena", "Africa", "Salvaje", "Rey", "Rugido", "Cazador"],
    Elefante: [
      "Trompa",
      "Gris",
      "Enorme",
      "Africa",
      "Memoria",
      "Sabio",
      "Manada",
    ],
    Águila: [
      "Vuelo",
      "Rapaz",
      "Alas",
      "Aguda",
      "Visión",
      "Cazadora",
      "Majestuosa",
    ],
    Delfín: [
      "Marino",
      "Inteligente",
      "Agua",
      "Juguetón",
      "Saltador",
      "Sonrisa",
      "Mamífero",
    ],
    Tigre: [
      "Rayas",
      "Felino",
      "Asia",
      "Feroz",
      "Depredador",
      "Naranja",
      "Peligro",
    ],
    Jirafa: [
      "Cuello",
      "Alto",
      "Manchas",
      "Africa",
      "Hojas",
      "Inusual",
      "Herbívoro",
    ],
    Oso: [
      "Pardo",
      "Fuerte",
      "Oso",
      "Salvaje",
      "Hibernación",
      "Garras",
      "Bosque",
    ],
    México: [
      "América",
      "Tacos",
      "Español",
      "CDMX",
      "Arqueología",
      "Colores",
      "Alebrijes",
    ],
    España: [
      "Europa",
      "Paella",
      "Castellano",
      "Madrid",
      "Flamenco",
      "Torero",
      "Siesta",
    ],
    Japón: [
      "Asia",
      "Sushi",
      "Tokio",
      "Anime",
      "Samurái",
      "Templos",
      "Tecnología",
    ],
    Brasil: [
      "América",
      "Carnaval",
      "Portugués",
      "Rio",
      "Fútbol",
      "Samba",
      "Playa",
    ],
    Francia: [
      "Europa",
      "Torre",
      "Francés",
      "París",
      "Vino",
      "Romántica",
      "Amor",
    ],
    Alemania: [
      "Europa",
      "Cerveza",
      "Berlín",
      "Alemán",
      "Precisión",
      "Ingeniería",
      "Muro",
    ],
    Italia: [
      "Europa",
      "Pizza",
      "Roma",
      "Italiano",
      "Pasta",
      "Bellas Artes",
      "Vespa",
    ],
    "Corea del Sur": [
      "Asia",
      "K-Pop",
      "Seúl",
      "Coreano",
      "Tecnología",
      "Belleza",
      "Dramas",
    ],
    Canadá: [
      "América",
      "Hielo",
      "Ottawa",
      "Inglés",
      "Hockey",
      "Nieve",
      "Madera",
    ],
    "Bad Bunny": [
      "Reggaeton",
      "Artista",
      "Puertorriqueño",
      "Música",
      "Conejo",
      "Trap latino",
      "Oreja",
    ],
    "The Weeknd": [
      "Canadá",
      "Productor",
      "Abel",
      "Música",
      "XO",
      "Viernes",
      "R&B",
    ],
    Shakira: [
      "Colombia",
      "Cantante",
      "Cadera",
      "Latina",
      "Fútbol",
      "Árabe",
      "Gazelle",
    ],
    "J Balvin": [
      "Reggaeton",
      "Colombia",
      "Artista",
      "Música",
      "Verde",
      "Grammy",
      "Latino",
    ],
    "Harry Styles": [
      "Cantante",
      "One Direction",
      "Inglés",
      "Pop",
      "Solo",
      "Guapo",
      "Harry",
    ],
    BTS: [
      "Kpop",
      "Coreanos",
      "Grupo",
      "Fanáticos",
      "ARMY",
      "Coreografía",
      "Bangtan",
    ],
    "Dua Lipa": [
      "Cantante",
      "Pop",
      "Albania",
      "Disco",
      "Levitating",
      "Británica",
      "Voz",
    ],
    Drake: ["Rapero", "Canadá", "Hip-Hop", "OVO", "Toronto", "Tragedia", "6ix"],
    "Ariana Grande": [
      "Cantante",
      "Pop",
      "Famosa",
      "Voz",
      "Cola Larga",
      "Thank U",
      "Whistle Tone",
    ],
    Tacos: [
      "Tortilla",
      "Carne",
      "Salsa",
      "Cebolla",
      "Mexico",
      "Almuerzo",
      "Cilantro",
    ],
    Pizza: [
      "Queso",
      "Tomate",
      "Horno",
      "Italia",
      "Pepperoni",
      "Masa",
      "Deliciosa",
    ],
    Sushi: [
      "Arroz",
      "Pescado",
      "Japón",
      "Algas",
      "Palillos",
      "Wasabi",
      "Enrollado",
    ],
    Hamburguesa: [
      "Pan",
      "Carne",
      "Lechuga",
      "Queso",
      "Americana",
      "Ketchup",
      "Mostaza",
    ],
    Pasta: [
      "Tallarín",
      "Italia",
      "Salsa",
      "Plato",
      "Espagueti",
      "Bolognesa",
      "Noodle",
    ],
    Ceviche: [
      "Pescado",
      "Perú",
      "Limón",
      "Marinada",
      "Fresco",
      "Cítrico",
      "Marisco",
    ],
    Ramen: ["Japón", "Fideos", "Sopa", "Caldo", "Huevo", "Tonkotsu", "Tazón"],
    Paella: [
      "Arroz",
      "España",
      "Sartén",
      "Sabor",
      "Mariscos",
      "Azafrán",
      "Fiesta",
    ],
    Croissant: [
      "Francia",
      "Panificación",
      "Mantequilla",
      "Desayuno",
      "Capas",
      "Hojaldra",
      "Pastelería",
    ],
    Avatar: [
      "Azul",
      "Pandora",
      "Alienígenas",
      "2009",
      "3D",
      "Naturaleza",
      "Agua",
    ],
    Titanic: ["Barco", "Hielo", "Mar", "1997", "Tragedia", "Rose", "Iceberg"],
    Inception: [
      "Sueños",
      "Leonardo",
      "Robo",
      "Mente",
      "Peonza",
      "Compleja",
      "Capas",
    ],
    Matrix: [
      "Código",
      "Realidad",
      "Píldora",
      "Ciber",
      "Verde",
      "Neo",
      "Agentes",
    ],
    "Jurassic Park": [
      "Dinosaurios",
      "Parque",
      "Génética",
      "Aventura",
      "Clásica",
      "Isla",
      "T-Rex",
    ],
    Interestelar: [
      "Espacio",
      "Científica",
      "Agujero Negro",
      "Viaje",
      "Tiempo",
      "Corn",
      "Interstellar",
    ],
    Coco: [
      "Pixar",
      "Música",
      "México",
      "Muertos",
      "Familia",
      "Guitarrista",
      "Colorida",
    ],
    "Harry Potter": [
      "Magia",
      "Hechicero",
      "Hogwarts",
      "Aventura",
      "Varita",
      "Lechuza",
      "Poción",
    ],
    "Top Gun": [
      "Aviones",
      "Militar",
      "Tom Cruise",
      "Acción",
      "Jet",
      "Maverick",
      "Velocidad",
    ],
    "The Legend of Zelda": [
      "Espada",
      "Link",
      "Princesa",
      "Nintendo",
      "Dungeon",
      "Triforce",
      "Hyrule",
    ],
    Minecraft: [
      "Bloques",
      "Construcción",
      "Creativo",
      "Cuadrado",
      "Minería",
      "Crafting",
      "Monstruos",
    ],
    "Elden Ring": [
      "Jefe",
      "Difícil",
      "Anillo",
      "Fromsoftware",
      "Oscuro",
      "Torrent",
      "Gracia",
    ],
    "Super Mario": [
      "Tuberías",
      "Monedas",
      "Champiñón",
      "Saltos",
      "Castillo",
      "Princesa",
      "Goombas",
    ],
    Fortnite: [
      "Batalla Real",
      "Construcción",
      "Armas",
      "Multijugador",
      "Isla",
      "Bailar",
      "Skin",
    ],
    "Call of Duty": [
      "Disparos",
      "Guerra",
      "Mapas",
      "Multiplayer",
      "Sigilo",
      "Ejército",
      "Misión",
    ],
    Pokémon: [
      "Criaturas",
      "Captura",
      "Evolución",
      "Batalla",
      "Entrenador",
      "Pokédex",
      "Pikachu",
    ],
    "Final Fantasy": [
      "RPG",
      "Aventura",
      "Magia",
      "Épica",
      "Fantasía",
      "Personajes",
      "Música",
    ],
    Halo: [
      "Ciencia Ficción",
      "Master Chief",
      "Anillo",
      "Disparos",
      "Aliens",
      "Futurista",
      "Visor",
    ],
  };

  // Initialize game
  useEffect(() => {
    if (!gameStarted && gameState.players.length > 0) {
      // Create shuffled player order
      const playerIndices = Array.from(
        { length: gameState.players.length },
        (_, i) => i,
      );
      const shuffled = shuffleArray(playerIndices);
      setShuffledPlayerIndices(shuffled);

      // Randomly select impostors from original indices
      const selectedIndices = new Set<number>();
      while (selectedIndices.size < gameState.impostors) {
        const randomIndex = Math.floor(
          Math.random() * gameState.players.length,
        );
        selectedIndices.add(randomIndex);
      }
      setImpostorIndices(Array.from(selectedIndices));

      // Select a random category from selected ones
      const randomCategory =
        gameState.categories[
          Math.floor(Math.random() * gameState.categories.length)
        ];

      // Select a random word from the category
      const categoryWords =
        wordsDatabase[randomCategory] || wordsDatabase["Famosos"];
      const randomWord =
        categoryWords[Math.floor(Math.random() * categoryWords.length)];
      setCurrentWord(randomWord);

      // Select a random clue for the word
      const cluesForWord = cluesDatabase[randomWord];
      if (cluesForWord && cluesForWord.length > 0) {
        const randomClue =
          cluesForWord[Math.floor(Math.random() * cluesForWord.length)];
        setCurrentClue(randomClue);
      } else {
        setCurrentClue("Adivina");
      }

      setGameStarted(true);
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    gameState.players,
    gameState.impostors,
    gameState.categories,
    gameStarted,
  ]);

  // Clear timeout when changing players
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentPlayerIndex]);

  // Pan responder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        // If swiped up significantly, reveal
        if (gestureState.dy < -80) {
          revealCurrentPlayer();
        }
        // Reset animation
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      },
    }),
  ).current;

  const revealCurrentPlayer = () => {
    if (!revealed && !revealedPlayers.includes(currentPlayerIndex)) {
      const newRevealedPlayers = [...revealedPlayers, currentPlayerIndex];
      setRevealed(true);
      setRevealedPlayers(newRevealedPlayers);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Auto move to next player after 3 seconds
      timeoutRef.current = setTimeout(() => {
        moveToNextPlayer(newRevealedPlayers);
      }, 3000);
    }
  };

  const moveToNextPlayer = (lastRevealedPlayers?: number[]) => {
    // Clear timeout before moving
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (currentPlayerIndex < gameState.players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setRevealed(false);
    } else {
      // All players revealed, go to game phase
      router.push({
        pathname: "/game-play",
        params: {
          playersJson: JSON.stringify(gameState.players),
          impostorsJson: JSON.stringify(impostorIndices),
          categoriesJson: JSON.stringify(gameState.categories),
          currentWord: currentWord,
        },
      });
    }
  };

  const isCurrentPlayerImpostor = impostorIndices.includes(
    shuffledPlayerIndices[currentPlayerIndex],
  );
  const currentPlayer =
    gameState.players[shuffledPlayerIndices[currentPlayerIndex]];

  const isSmallScreen = width < 380;
  const isMediumScreen = width < 480;

  const dynamicStyles = {
    playerNameFontSize: isSmallScreen ? 24 : isMediumScreen ? 28 : 32,
    cardTitleFontSize: isSmallScreen ? 14 : isMediumScreen ? 16 : 18,
    wordFontSize: isSmallScreen ? 32 : isMediumScreen ? 40 : 48,
    impostorFontSize: isSmallScreen ? 28 : isMediumScreen ? 36 : 44,
  };

  return (
    <View style={styles.container}>
      {/* Player Counter */}
      <View style={styles.counter}>
        <Text style={styles.counterText}>
          Jugador {currentPlayerIndex + 1} / {gameState.players.length}
        </Text>
      </View>

      {/* Player Name */}
      <View style={styles.playerNameContainer}>
        <Text
          style={[
            styles.playerName,
            { fontSize: dynamicStyles.playerNameFontSize },
          ]}
        >
          {currentPlayer}
        </Text>
      </View>

      {/* Swipeable Card */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
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
          {revealed ? "Desliza hacia arriba para ver" : "DESLIZA HACIA ARRIBA"}
        </Text>

        {!revealed ? (
          <View style={styles.cardContent}>
            <Text style={styles.swipeHint}>↑</Text>
          </View>
        ) : (
          <View style={styles.cardContent}>
            {isCurrentPlayerImpostor ? (
              <>
                <Text
                  style={[
                    styles.impostorText,
                    { fontSize: dynamicStyles.impostorFontSize },
                  ]}
                >
                  IMPOSTOR
                </Text>
                {gameState.enableClue && (
                  <Text style={styles.clueText}>Pista: {currentClue}</Text>
                )}
              </>
            ) : (
              <Text
                style={[
                  styles.wordText,
                  { fontSize: dynamicStyles.wordFontSize },
                ]}
              >
                {currentWord}
              </Text>
            )}
          </View>
        )}
      </Animated.View>

      {/* Next Button (only if already revealed) */}
      {revealed && (
        <TouchableOpacity style={styles.nextButton} onPress={moveToNextPlayer}>
          <Text style={styles.nextButtonText}>SIGUIENTE</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingTop: 90,
  },
  counter: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#16213e",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ff006e",
  },
  counterText: {
    color: "#ff006e",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
  },
  playerNameContainer: {
    paddingVertical: 20,
  },
  playerName: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 2,
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
    marginTop: 20,
    marginBottom: 30,
    shadowColor: "#ff006e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
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
  progressInfo: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#16213e",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
  },
  progressText: {
    color: "#888",
    fontSize: 12,
    fontStyle: "italic",
  },
  nextButton: {
    backgroundColor: "#ff006e",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 15,
    shadowColor: "#ff006e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 2,
  },
});
