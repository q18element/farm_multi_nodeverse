export { ROOT_PATH , PROFILES_PATH };

import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_PATH = path.resolve(__dirname, ".././");
const PROFILES_PATH = path.resolve(ROOT_PATH, "./data/profiles");