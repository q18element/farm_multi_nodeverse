export { seedphraseOrPrivateKeyToEthAddress };

import { ethers } from "ethers";

function seedphraseOrPrivateKeyToEthAddress(seedphrase: string) {
  if (ethers.isHexString(seedphrase)) {
    return ethers.computeAddress(seedphrase);
  } else {
    return ethers.Wallet.fromPhrase(seedphrase).address;
  }
}
