import Dexie from "dexie";

export const db = new Dexie("textDatabase");
db.version(1).stores({
  textValues: "++id, text, classification", // Primary key and indexed props
});
