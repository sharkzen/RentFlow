export const isValidText = (text: string, minLength = 1, maxLength = 100) => {
  return text.trim().length >= minLength && text.trim().length <= maxLength;
};
