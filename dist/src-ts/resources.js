export { INSTALLED_EXTENSION };
import path from "path";
import { ROOT_PATH } from "./constants.js";
const INSTALLED_EXTENSION = {
    metamask: {
        name: "Metamask",
        path: path.resolve(ROOT_PATH, "./crx/MetaMask.crx"),
    },
};
