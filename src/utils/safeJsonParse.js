export function safeJsonParse(jsonString, fallback) {
  if (jsonString == null || jsonString === '') return fallback;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Erreur lors du parsing JSON:', error, 'Chaîne:', jsonString);
    return fallback;
  }
}

export function safeJsonStringify(value, fallback = '[]') {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('Erreur lors du stringify JSON:', error, 'Valeur:', value);
    return fallback;
  }
}
