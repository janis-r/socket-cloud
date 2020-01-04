
export const isArrayOfStrings = (entry: unknown): entry is Array<string> => Array.isArray(entry) && !entry.some(v => typeof v !== "string");
