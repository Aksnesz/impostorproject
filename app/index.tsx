import { useRouter } from "expo-router";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export default function Index() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const handlePlay = () => {
    router.push("/game-setup");
  };

  // Responsive values
  const isSmallScreen = width < 380;
  const isMediumScreen = width < 480;
  const dynamicStyles = {
    titleFontSize: isSmallScreen ? 48 : isMediumScreen ? 60 : 72,
    buttonFontSize: isSmallScreen ? 18 : isMediumScreen ? 20 : 24,
    buttonPadding: isSmallScreen ? 12 : isMediumScreen ? 15 : 18,
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontSize: dynamicStyles.titleFontSize }]}>
        IMPOSTOR
      </Text>
      <TouchableOpacity
        style={[
          styles.button,
          { paddingVertical: dynamicStyles.buttonPadding },
        ]}
        onPress={handlePlay}
      >
        <Text
          style={[
            styles.buttonText,
            { fontSize: dynamicStyles.buttonFontSize },
          ]}
        >
          JUGAR
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
  },
  title: {
    fontWeight: "bold",
    color: "#ff006e",
    marginBottom: 60,
    letterSpacing: 4,
  },
  button: {
    paddingHorizontal: 50,
    backgroundColor: "#ff006e",
    borderRadius: 15,
    shadowColor: "#ff006e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  buttonText: {
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 2,
  },
});
