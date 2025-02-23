export { INSTALLED_EXTENSION, ExtensionInfo };

import path from "path";
import { ROOT_PATH } from "./constants.js";

interface ExtensionInfo {
  name: string;
  path: string;
}

const INSTALLED_EXTENSION = {
  metamask: {
    name: "Metamask",
    path: path.resolve(ROOT_PATH, "./crx/MetaMask.crx"),
  },
};
