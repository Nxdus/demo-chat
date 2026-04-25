export const CLIENT_IDENTIFIER_STORAGE_KEY = "demo-chat-client-identifier";

function createClientIdentifier() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  const randomValues = new Uint32Array(4);
  crypto.getRandomValues(randomValues);

  return Array.from(randomValues, (value) => value.toString(16)).join("-");
}

export function getClientIdentifier() {
  const existingIdentifier = window.localStorage.getItem(
    CLIENT_IDENTIFIER_STORAGE_KEY,
  );

  if (existingIdentifier) {
    return existingIdentifier;
  }

  const nextIdentifier = createClientIdentifier();
  window.localStorage.setItem(CLIENT_IDENTIFIER_STORAGE_KEY, nextIdentifier);

  return nextIdentifier;
}
