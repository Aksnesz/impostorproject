/**
 * Red Neuronal para aprender qué palabras no gustan
 * Entrena cada 2 palabras rechazadas
 */

import * as tf from "@tensorflow/tfjs";
import { calculateWordMetrics } from "./wordMetrics";

export interface TrainingData {
  features: number[][]; // [length, vowels, consonants, spaces]
  labels: number[]; // 0 o 1 (aceptada o rechazada)
}

let model: tf.Sequential | null = null;
let trainingData: TrainingData = { features: [], labels: [] };

/**
 * Crear o cargar modelo
 */
export const initializeModel = (): tf.Sequential => {
  if (model) return model;

  model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [4], // [length, vowels, consonants, spaces]
        units: 8,
        activation: "relu",
        kernelInitializer: "glorotUniform",
      }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({
        units: 4,
        activation: "relu",
      }),
      tf.layers.dense({
        units: 1,
        activation: "sigmoid", // Output: 0-1 (rechazada sí/no)
      }),
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  });

  console.log("[ML] Modelo inicializado");
  return model;
};

/**
 * Agregar datos de entrenamiento
 */
export const addTrainingExample = (word: string, rejected: boolean): void => {
  const features = calculateWordMetrics(word);

  trainingData.features.push(features);
  trainingData.labels.push(rejected ? 1 : 0);

  console.log(
    `[ML] Agregado: "${word}" (rejected: ${rejected}). Total: ${trainingData.features.length}`,
  );
};

/**
 * Entrenar cada 2 palabras
 */
export const trainIfNeeded = async (): Promise<boolean> => {
  // Necesitamos al menos 2 ejemplos y múltiplos de 2
  if (
    trainingData.features.length < 2 ||
    trainingData.features.length % 2 !== 0
  ) {
    return false;
  }

  console.log(
    `[ML] Entrenando con ${trainingData.features.length} ejemplos...`,
  );

  if (!model) {
    initializeModel();
  }

  try {
    const xs = tf.tensor2d(trainingData.features);
    const ys = tf.tensor2d(trainingData.labels, [
      trainingData.labels.length,
      1,
    ]);

    await model!.fit(xs, ys, {
      epochs: 10,
      batchSize: 2,
      verbose: 0, // Silencioso
      shuffle: true,
    });

    xs.dispose();
    ys.dispose();

    console.log(
      `[ML] Modelo entrenado con éxito. Ejemplos totales: ${trainingData.features.length}`,
    );
    return true;
  } catch (error) {
    console.error("[ML] Error al entrenar:", error);
    return false;
  }
};

/**
 * Predecir probabilidad de rechazo (no se usa para UI, solo para debug)
 */
export const predictRejection = (word: string): number | null => {
  if (!model) return null;

  try {
    const features = tf.tensor2d([calculateWordMetrics(word)]);
    const prediction = model.predict(features) as tf.Tensor;
    const result = prediction.dataSync()[0];

    features.dispose();
    prediction.dispose();

    return result;
  } catch (error) {
    console.error("[ML] Error al predecir:", error);
    return null;
  }
};

/**
 * Obtener estadísticas del modelo (para debug)
 */
export const getModelStats = () => {
  return {
    modelExists: model !== null,
    trainingExamples: trainingData.features.length,
    rejections: trainingData.labels.filter((l) => l === 1).length,
    acceptances: trainingData.labels.filter((l) => l === 0).length,
  };
};

/**
 * Resetear modelo (si es necesario)
 */
export const resetModel = (): void => {
  if (model) {
    model.dispose();
    model = null;
  }
  trainingData = { features: [], labels: [] };
  console.log("[ML] Modelo reseteado");
};
