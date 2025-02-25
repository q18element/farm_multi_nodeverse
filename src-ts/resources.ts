export { INSTALLED_EXTENSION, ExtensionInfo };

interface ExtensionInfo {
  name: string;
  path: string;
}

const INSTALLED_EXTENSION = {
  metamask: {
    name: "Metamask",
    path: "./crx/MetaMask.crx",
  },
  hahawallet: {
    name: "HahaWallet",
    path: "./crx/HahaWallet.crx",
  },
};
