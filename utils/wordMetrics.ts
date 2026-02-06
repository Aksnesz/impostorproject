/**
 * Calcula métricas de características de palabras para la red neuronal
 */

export interface WordMetrics {
  word: string;
  length: number;
  vowels: number;
  consonants: number;
  spaces: number;
  rejected: number; // 0 o 1 para entrenamiento
  timestamp: number;
}

/**
 * Calcula características de una palabra
 */
export const calculateWordMetrics = (word: string): number[] => {
  const vowels = (word.match(/[aeiouáéíóuAEIOUÁÉÍÓU]/g) || []).length;
  const consonants = (
    word.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || []
  ).length;
  const spaces = (word.match(/\s/g) || []).length;
  const length = word.length;

  return [length, vowels, consonants, spaces];
};

/**
 * Crea objeto WordMetrics completo
 */
export const createWordMetrics = (
  word: string,
  rejected: boolean = false,
): WordMetrics => {
  const vowels = (word.match(/[aeiouáéíóuAEIOUÁÉÍÓU]/g) || []).length;
  const consonants = (
    word.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || []
  ).length;
  const spaces = (word.match(/\s/g) || []).length;

  return {
    word,
    length: word.length,
    vowels,
    consonants,
    spaces,
    rejected: rejected ? 1 : 0,
    timestamp: Date.now(),
  };
};
