export { ROOT_PATH, PROFILES_PATH, DATABASE_PATH };
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_PATH = path.resolve(__dirname, ".././");
const PROFILES_PATH = path.resolve(ROOT_PATH, "./data/profiles");
const DATABASE_PATH = path.resolve(ROOT_PATH, "./data/profile_data.db");
fs.mkdirSync(path.resolve(__dirname, "./data"), { recursive: true });
fs.mkdirSync(PROFILES_PATH, { recursive: true });
