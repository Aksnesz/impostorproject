# 📊 SISTEMA DE RECHAZO DE PALABRAS CON RED NEURONAL

## ✅ IMPLEMENTACIÓN COMPLETADA

### 1. ARQUITECTURA FIREBASE

```
rooms/{roomCode}/gameState/
  ├── wordRejections: { [playerId]: true }  ← Tracking de rechazos
  ├── rejectionCount: number                ← Contador de rechazos
  └── currentWord: string
```

### 2. FLUJO DE FUNCIONAMIENTO

**Fase 1: Juego Normal**

```
┌─────────────────────────────────────┐
│   Jugadores ven la palabra          │
│   y discuten (7 minutos)            │
│                                     │
│   Botón: "❌ No me gustó la palabra" │
└─────────────────────────────────────┘
           ↓
```

**Fase 2: Contador de Rechazos**

```
┌──────────────────────────────────────┐
│  Si alguien rechaza:                 │
│  1. Se registra en Firebase          │
│  2. Se añade a datos de entrenamiento│
│  3. Se comprueba %                   │
│                                      │
│  Rechazos: 3/4 (75%)                │
└──────────────────────────────────────┘
           ↓
```

**Fase 3: Activación Red Neuronal**

```
┌──────────────────────────────────────┐
│  SI 75% o más rechazaron:            │
│                                      │
│  1. 🧠 ENTRENAR MODELO              │
│     - Con 2+ ejemplos acumulados     │
│     - Silenciosamente                │
│     - 10 épocas                      │
│                                      │
│  2. Resetear todo                    │
│  3. VOLVER A LOBBY                   │
└──────────────────────────────────────┘
           ↓
```

**Fase 4: Vuelta a Lobby**

```
┌──────────────────────────────────────┐
│  Todos redirigidos a /room           │
│                                      │
│  El HOST puede:                      │
│  • Cambiar categorías                │
│  • Cambiar número de impostores      │
│  • Intentar de nuevo                 │
│                                      │
│  El MODELO ya aprendió que esa       │
│  palabra NO era buena                │
└──────────────────────────────────────┘
```

---

## 📁 ARCHIVOS CREADOS/MODIFICADOS

### 1. `utils/wordMetrics.ts` ✨ NUEVO

- Calcula features de palabras: [length, vowels, consonants, spaces]
- Interfaz `WordMetrics` para almacenar datos

### 2. `utils/aiHelpers.ts` ✨ NUEVO

- Red neuronal Tensorflow.js con 3 capas
- Entrada: [length, vowels, consonants, spaces]
- Salida: Probabilidad de rechazo (0-1)
- **Entrena cada 2 palabras rechazadas**
- Métodos:
  - `addTrainingExample(word, rejected)` - Agregar dato
  - `trainIfNeeded()` - Entrenar si hay 2+ ejemplos
  - `predictRejection(word)` - Predicción (para debug)
  - `getModelStats()` - Estadísticas

### 3. `types/game.ts` ✏️ MODIFICADO

- Agregados campos a `Room.gameState`:
  ```typescript
  wordRejections?: { [playerId: string]: boolean };
  rejectionCount?: number;
  ```

### 4. `app/game-play.tsx` ✏️ MODIFICADO

- Nuevo estado: `[hasRejected, setHasRejected]`
- Nuevo botón: "❌ No me gustó la palabra"
- Función `handleRejectWord()`:
  1. Registra rechazo en Firebase
  2. Agrega a datos de entrenamiento
  3. Cuenta porcentaje
  4. Si 75%: Entrena + Vuelve a lobby
- Hook para resetear estado al cambiar palabra

### 5. `app/room.tsx` ✏️ MODIFICADO

- Inicializa `wordRejections: {}` cuando empieza juego
- Resetea cuando vuelve a lobby

---

## 🧠 RED NEURONAL - DETALLES TÉCNICOS

### Arquitectura

```
Entrada (4 features)
    ↓
Dense(8 units, relu)
    ↓
Dropout(0.2)
    ↓
Dense(4 units, relu)
    ↓
Dense(1 unit, sigmoid) ← Output: 0-1
```

### Entrenamiento

- **Optimizer**: Adam (lr=0.01)
- **Loss**: Binary Cross Entropy
- **Epochs**: 10
- **Batch Size**: 2
- **Trigger**: Cada 2 palabras rechazadas

### Datos Que Aprende

```
"Cristiano Ronaldo"
├── length: 18
├── vowels: 5
├── consonants: 13
├── spaces: 1
└── rejected: 1 ← Etiqueta

"Avatar"
├── length: 6
├── vowels: 2
├── consonants: 4
├── spaces: 0
└── rejected: 0
```

---

## 📋 EJEMPLO DE EJECUCIÓN

### Partida 1:

```
1. Palabra: "Elon Musk"
   → 3/4 rechazan (75%)
   → Entrenar modelo
   → Volver a lobby

2. Palabra: "Messi"
   → 2/4 rechazan (50%)
   → Continuar jugando

3. Palabra: "Beyoncé"
   → 3/4 rechazan (75%)
   → Entrenar modelo (ahora con 2 ejemplos)
   → Volver a lobby

Modelo aprendió:
"Elon Musk" (18 chars) → BAD ❌
"Beyoncé" (7 chars) → BAD ❌
"Messi" (5 chars) → GOOD ✓
```

---

## 🔍 LOGS EN CONSOLA

Verás en la consola del desarrollador:

```
[ML] Juan rechazó la palabra: Elon Musk
[ML] Agregado: "Elon Musk" (rejected: true). Total: 1
[ML] Rechazos: 1/4 (25%)

[ML] Pedro rechazó la palabra: Elon Musk
[ML] Agregado: "Elon Musk" (rejected: true). Total: 2
[ML] Rechazos: 2/4 (50%)

[ML] María rechazó la palabra: Elon Musk
[ML] Rechazos: 3/4 (75%)

[ML] Carlos rechazó la palabra: Elon Musk
[ML] Rechazos: 4/4 (100%)
[ML] Entrenando con 4 ejemplos...
[ML] Modelo entrenado con éxito. Ejemplos totales: 4
[ML] Volviendo a lobby para seleccionar nuevas categorías...
```

---

## 🚀 CARACTERÍSTICAS

✅ **Silencioso**: El usuario NO ve el modelo entrenando
✅ **Automático**: Se entrena solo cada 2 palabras  
✅ **Feedback**: Los botones son visibles y responden
✅ **Persistencia**: Datos se guardan en Firebase
✅ **Escalable**: Se puede mejorar la arquitectura ML fácilmente
✅ **Sin dependencias extras**: Solo TensorFlow.js

---

## 🔄 PRÓXIMAS MEJORAS OPCIONALES

1. **Guardar modelo en Firebase**
   - Persistencia entre sesiones
   - Compartir aprendizaje entre usuarios

2. **Más características de palabra**
   - Dificultad estimada
   - Frecuencia de uso
   - Ambigüedad lingüística

3. **Predicción de rechazo**
   - Mostrar probabilidad al host (debug)
   - Suggerir palabras alternativas

4. **Análisis de patrones**
   - ¿Qué tipo de palabras rechaza cada jugador?
   - Perfiles de preferencia personal

5. **Transfer Learning**
   - Entrenar con todas las palabras rechazadas globalmente
   - Base de datos compartida entre salas

---

## 📊 ESTADÍSTICAS DEL SISTEMA

Puedes ver las stats en consola con:

```typescript
console.log(getModelStats());

// Output:
{
  modelExists: true,
  trainingExamples: 4,
  rejections: 3,
  acceptances: 1
}
```

---

## ✨ RESUMEN

El sistema es **completamente silencioso**, entrena **automáticamente cada 2 palabras**, y cuando alcanza el **75% de rechazo, devuelve a los jugadores al lobby** para que intenten de nuevo.

La red neuronal aprende **qué características de palabras** son problemáticas y puede predecir palabras malas en el futuro.
