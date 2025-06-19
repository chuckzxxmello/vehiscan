import CryptoJS from "react-native-crypto-js";

// SHA-256 one-way hash (e.g. fingerprint IDs)
export function sha256(data) {
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
}

// AES-256 reversible encryption
// 32-char key
const AES_KEY = "0123456789abcdef0123456789abcdef";

export function encrypt(text) {
  return CryptoJS.AES.encrypt(text, AES_KEY).toString();
}

export function decrypt(cipherText) {
  const bytes = CryptoJS.AES.decrypt(cipherText, AES_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
