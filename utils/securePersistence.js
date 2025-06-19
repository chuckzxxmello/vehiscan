import {
  storeSecurely,
  getSecurely,
  deleteSecurely,
} from "./secureStorage";

export const securePersistence = {
  get: (key) => getSecurely(key),
  set: (key, value) => storeSecurely(key, value),
  remove: (key) => deleteSecurely(key),
};
