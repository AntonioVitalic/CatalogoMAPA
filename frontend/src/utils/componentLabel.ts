export const getComponentDisplayLetter = (
  letra: string | null | undefined,
  index: number
): string => {
  if (letra && letra.trim()) {
    const normalizedLetter = letra.trim().toUpperCase();

    if (normalizedLetter !== "A") {
      return normalizedLetter;
    }
  }

  return convertNumberToLetters(index + 2);
};

const convertNumberToLetters = (value: number): string => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let number = value;
  let result = "";

  while (number > 0) {
    const remainder = (number - 1) % alphabet.length;
    result = `${alphabet[remainder]}${result}`;
    number = Math.floor((number - 1) / alphabet.length);
  }

  return result;
};