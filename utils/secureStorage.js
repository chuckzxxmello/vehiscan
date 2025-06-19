import * as SecureStore from "expo-secure-store";

/** Store a string securely */
export async function storeSecurely(key, value) {
  return SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY,
  });
}

/** Retrieve a stored string (or null) */
export async function getSecurely(key) {
  return SecureStore.getItemAsync(key);
}

/** Delete a secure key */
export async function deleteSecurely(key) {
  return SecureStore.deleteItemAsync(key);
}
