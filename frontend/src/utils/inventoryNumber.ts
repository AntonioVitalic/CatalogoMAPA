import { ComponenteItem } from "@/types";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

const getLastComponentLetter = (count: number): string | null => {
  if (count <= 0) {
    return null;
  }

  let remaining = count;
  let result = "";

  while (remaining > 0) {
    remaining -= 1;
    result = `${ALPHABET[remaining % ALPHABET.length]}${result}`;
    remaining = Math.floor(remaining / ALPHABET.length);
  }

  return result;
};

export const formatInventoryNumberWithComponents = (
  inventoryNumber?: string,
  componentes?: ComponenteItem[]
): string => {
  if (!inventoryNumber) {
    return "";
  }

  const componentCount = componentes?.length ?? 0;

  if (componentCount === 0) {
    return inventoryNumber;
  }

  if (componentCount === 1) {
    return `${inventoryNumber}a`;
  }

  const lastLetter = getLastComponentLetter(componentCount);

  if (!lastLetter) {
    return inventoryNumber;
  }

  return `${inventoryNumber}a${lastLetter}`;
};