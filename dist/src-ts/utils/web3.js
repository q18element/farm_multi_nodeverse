export { seedphraseOrPrivateKeyToEthAddress };
import { ethers } from "ethers";
function seedphraseOrPrivateKeyToEthAddress(seedphrase) {
    if (ethers.isHexString(seedphrase)) {
        return ethers.computeAddress(seedphrase);
    }
    else {
        return ethers.Wallet.fromPhrase(seedphrase).address;
    }
}
