const KEY = "tokens";

export const saveTokens = (tokens) => localStorage.setItem(KEY, JSON.stringify(tokens));
export const getTokens = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
};
export const clearTokens = () => localStorage.removeItem(KEY);
