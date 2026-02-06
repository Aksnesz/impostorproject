## 🧠 Sistema ML de Rechazo de Palabras

### 📋 Descripción General

El sistema aprende automáticamente cuáles son las palabras que **NO gustan** a los jugadores durante las partidas. Cuando un 75% o más de los jugadores rechaza una palabra, el sistema:

1. **Registra características** de esa palabra (longitud, vocales, consonantes, espacios)
2. **Entrena la red neuronal** con estos datos (cada 2 palabras rechazadas)
3. **Cambia la palabra** automáticamente por una nueva
4. **Todo es silencioso** - sin mostrar predicciones, solo recolectando datos

---

### 🎯 Flujo de Funcionamiento

#### 1️⃣ **Durante el Juego** (game-play.tsx)

```
Usuario ve botón "❌ No me gustó la palabra"
        ↓
Presiona botón
        ↓
Se registra en Firebase: gameState/wordRejections
        ↓
addTrainingExample() → Agrega datos a la red neuronal
        ↓
Se cuenta el porcentaje de rechazos
```

#### 2️⃣ **Si 75% o más rechaza**

```
Calcula nuevas métricas de palabra
        ↓
trainIfNeeded() → Si hay ≥2 palabras, entrena el modelo
        ↓
Selecciona palabra nueva de la categoría
        ↓
Resetea los rechazos
        ↓
Continúa el juego
```

#### 3️⃣ **Entrenamiento** (cada 2 palabras)

```
Red neuronal (aiHelpers.ts):
- Input: [length, vowels, consonants, spaces]
- Output: probabilidad de rechazo (0-1)
- 2 capas ocultas con Dropout para evitar sobreajuste
```

---

### 📁 Archivos Nuevos/Modificados

#### **Nuevos:**

- `utils/wordMetrics.ts` - Calcula características de palabras
- `utils/aiHelpers.ts` - Red neuronal TensorFlow.js

#### **Modificados:**

- `app/game-play.tsx` - Agrega botón de rechazo + lógica
- `app/room.tsx` - Inicializa wordRejections en gameState
- `types/game.ts` - Nuevos campos en Room para Firebase

---

### 🧠 Red Neuronal - Detalles

```typescript
Arquitectura:
Input Layer: 4 neuronas [length, vowels, consonants, spaces]
    ↓
Hidden Layer 1: 8 neuronas + ReLU activation
    ↓
Dropout: 20% para regularización
    ↓
Hidden Layer 2: 4 neuronas + ReLU activation
    ↓
Output Layer: 1 neurona + Sigmoid (0-1)

Función de Pérdida: Binary Crossentropy
Optimizador: Adam (lr=0.01)
Épocas: 10 por entrenamiento
```

---

### 📊 Firebase Structure

```json
rooms/{roomCode}/gameState/
{
  "phase": "playing",
  "currentWord": "Cristiano Ronaldo",
  "timeLeft": 250,
  "wordRejections": {
    "player_1_abc": true,
    "player_2_def": true,
    "player_3_ghi": true
  },
  "rejectionCount": 3
}
```

---

### 🔍 Cómo Ver que Está Funcionando

#### **En Console/Logs:**

```
[ML] Cristiano Ronaldo rechazó la palabra: Taylor Swift
[ML] Rechazos: 3/4 (75%)
[ML] 75% rechazó. Cambiando palabra...
[ML] Entrenando con 2 ejemplos...
[ML] Modelo entrenado con éxito. Ejemplos totales: 2
[ML] Nueva palabra: Beyoncé
```

#### **Variables de Debug:** (en aiHelpers.ts)

```typescript
getModelStats() = {
  modelExists: true,
  trainingExamples: 4,
  rejections: 2,
  acceptances: 2,
};
```

---

### ⚙️ Configuración Posible

Puedes ajustar:

1. **Porcentaje de rechazo** (línea ~110 en game-play.tsx):

   ```typescript
   if (rejectionPercentage >= 75) // Cambiar 75 por otro valor
   ```

2. **Frecuencia de entrenamiento** (línea ~28 en aiHelpers.ts):

   ```typescript
   if (trainingData.features.length < 2 || trainingData.features.length % 2 !== 0)
   // Cambiar 2 por 3, 5, etc.
   ```

3. **Estructura de la red neuronal** (línea ~20 en aiHelpers.ts):
   ```typescript
   units: 8, // Aumentar para más complejidad
   ```

---

### 🚀 Mejoras Futuras

1. **Persistencia de modelo** - Guardar en AsyncStorage/Firebase
2. **Múltiples categorías** - Entrenar modelo por categoría
3. **Predicciones para sugerir** - Evitar palabras rechazadas antes
4. **Dashboard de estadísticas** - Ver qué palabras se rechazan más
5. **Historial completo** - Base de datos de palabras + rechazos

---

### ✅ Verificación Rápida

Para verificar que todo funciona:

1. Crear partida con 3+ jugadores
2. Llegar a fase "DISCUTAN"
3. 3+ jugadores presionan "❌ No me gustó la palabra"
4. Verificar en Console que aparece "[ML]" logs
5. Palabra se cambia automáticamente si 75% rechaza

---

### 📌 Notas Importantes

- **Silencioso**: No muestra predicciones ni debug al usuario
- **Local**: El modelo se entrena en el dispositivo (no en servidor)
- **Eficiente**: Arquitectura simple, entrenamiento rápido (<100ms)
- **Escalable**: Puedes agregar más características de palabras luego
