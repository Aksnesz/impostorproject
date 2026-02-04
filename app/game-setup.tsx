import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

export default function GameSetup() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [players, setPlayers] = useState<string[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [impostors, setImpostors] = useState(1);
  const [enableClue, setEnableClue] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const categories = [
    "Famosos",
    "Deportes",
    "Películas",
    "Comida",
    "Animales",
    "Países",
    "Músicos",
    "Videojuegos",
  ];

  // Responsive values
  const isSmallScreen = width < 380;
  const isMediumScreen = width < 480;
  const dynamicStyles = {
    paddingHorizontal: isSmallScreen ? 12 : isMediumScreen ? 15 : 20,
    sectionMarginBottom: isSmallScreen ? 20 : 30,
    titleFontSize: isSmallScreen ? 16 : isMediumScreen ? 18 : 20,
    inputFontSize: isSmallScreen ? 14 : 16,
    addButtonSize: isSmallScreen ? 40 : 50,
    categoryMinWidth: isSmallScreen ? "48%" : "45%",
  };

  const addPlayer = () => {
    if (playerName.trim()) {
      setPlayers([...players, playerName.trim()]);
      setPlayerName("");
    }
  };

  const removePlayer = (index: number) => {
    const newPlayers = players.filter((_, i) => i !== index);
    setPlayers(newPlayers);
    // Si quedan 5 o menos jugadores y está seleccionado 2 impostores, cambiar a 1
    if (newPlayers.length <= 5 && impostors === 2) {
      setImpostors(1);
    }
  };

  const handleCategorySelect = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const canContinue = players.length >= 3 && selectedCategories.length > 0;

  return (
    <ScrollView
      style={[
        styles.container,
        { paddingHorizontal: dynamicStyles.paddingHorizontal },
      ]}
    >
      {/* Agregar Jugadores */}
      <View
        style={[
          styles.section,
          { marginBottom: dynamicStyles.sectionMarginBottom },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            { fontSize: dynamicStyles.titleFontSize },
          ]}
        >
          Jugadores
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { fontSize: dynamicStyles.inputFontSize }]}
            placeholder="Nombre del jugador"
            placeholderTextColor="#999"
            value={playerName}
            onChangeText={setPlayerName}
            onSubmitEditing={addPlayer}
          />
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                width: dynamicStyles.addButtonSize,
                height: dynamicStyles.addButtonSize,
              },
            ]}
            onPress={addPlayer}
          >
            <Text
              style={[
                styles.addButtonText,
                { fontSize: dynamicStyles.addButtonSize * 0.6 },
              ]}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.playersList}>
          {players.map((player, index) => (
            <View key={index} style={styles.playerItem}>
              <Text style={styles.playerName}>{player}</Text>
              <TouchableOpacity
                onPress={() => removePlayer(index)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {players.length > 0 && (
          <Text style={styles.playerCount}>
            {players.length} jugador{players.length !== 1 ? "es" : ""} agregado
            {players.length !== 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {/* Impostores */}
      <View
        style={[
          styles.section,
          { marginBottom: dynamicStyles.sectionMarginBottom },
        ]}
      >
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
                  {isDisabled}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Categoría */}
      <View
        style={[
          styles.section,
          { marginBottom: dynamicStyles.sectionMarginBottom },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            { fontSize: dynamicStyles.titleFontSize },
          ]}
        >
          Categorías
        </Text>

        <View style={styles.categoriesList}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryOption,
                { minWidth: dynamicStyles.categoryMinWidth },
                selectedCategories.includes(category) &&
                  styles.categoryOptionActive,
              ]}
              onPress={() => handleCategorySelect(category)}
            >
              <Text
                style={[
                  styles.categoryOptionText,
                  { fontSize: isSmallScreen ? 12 : 14 },
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

        {selectedCategories.length > 0 && (
          <Text style={styles.selectedCategoriesText}>
            {selectedCategories.length} categoría
            {selectedCategories.length !== 1 ? "s" : ""} seleccionada
            {selectedCategories.length !== 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {/* Pista */}
      <View
        style={[
          styles.section,
          { marginBottom: dynamicStyles.sectionMarginBottom },
        ]}
      >
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

      {/* Botón Continuar */}
      <TouchableOpacity
        style={[styles.continueButton, !canContinue && styles.buttonDisabled]}
        onPress={() => {
          if (canContinue) {
            router.push({
              pathname: "/game",
              params: {
                playersJson: JSON.stringify(players),
                impostors: impostors.toString(),
                enableClue: enableClue.toString(),
                categoriesJson: JSON.stringify(selectedCategories),
              },
            });
          }
        }}
        disabled={!canContinue}
      >
        <Text
          style={[
            styles.continueButtonText,
            { fontSize: isSmallScreen ? 14 : isMediumScreen ? 16 : 18 },
          ]}
        >
          {canContinue
            ? "CONTINUAR"
            : `CONTINUAR`}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    paddingTop: 50,
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
  inputContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    backgroundColor: "#16213e",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ff006e",
  },
  addButton: {
    backgroundColor: "#ff006e",
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  playersList: {
    gap: 8,
  },
  playerItem: {
    backgroundColor: "#16213e",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#ff006e",
  },
  playerName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  removeButton: {
    padding: 5,
  },
  removeButtonText: {
    color: "#ff006e",
    fontSize: 18,
    fontWeight: "bold",
  },
  playerCount: {
    color: "#888",
    fontSize: 12,
    marginTop: 10,
    fontStyle: "italic",
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
    fontSize: 20,
  },
  categoryButton: {
    backgroundColor: "#16213e",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ff006e",
  },
  categoryButtonText: {
    color: "#ff006e",
    fontSize: 16,
    fontWeight: "600",
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
  selectedCategoriesText: {
    color: "#888",
    fontSize: 12,
    marginTop: 10,
    fontStyle: "italic",
  },
  clueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  clueDescription: {
    color: "#888",
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 10,
  },
  continueButton: {
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
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 2,
  },
});
