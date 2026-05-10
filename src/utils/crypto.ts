const SALT = "dictionary_salt_123";

export const encryptKey = (key: string): string => {
  try {
    return btoa(encodeURIComponent(key + SALT));
  } catch (e) {
    console.error("Encryption error", e);
    return "";
  }
};

export const decryptKey = (encrypted: string): string => {
  try {
    const decoded = atob(encrypted);
    return decodeURIComponent(decoded).replace(SALT, "");
  } catch (e) {
    console.error("Decryption error", e);
    return "";
  }
};
