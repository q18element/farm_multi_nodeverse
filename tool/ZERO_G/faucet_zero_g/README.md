# Faucet Zero G

Tool này dùng để tự động faucet AOGI testnet token ở https://faucet.0g.ai

---

## Installation
- See [Project README.md](../../../README.md)


## Setup
- Open tool/ZERO_G/faucet_zero_g folder

1. **Configure Wallet Addresses:**
   - Open `address.txt` and enter your wallet addresses, one per line.

2. **Configure Proxies:**
   - Open `proxies.txt` and enter your proxy details, one per line.

---

## Usage

1. Navigate to the project directory:
    ```bash
    cd tool/ZERO_G/faucet_zero_g
    ```

2. Run the script:
    ```bash
    node main.js
    ```

---

## Optional

- To rerun the wallets that have already been processed, delete the `temp` folder:
    ```bash
    rm -rf temp
    ```

---

## Troubleshooting

- Ensure Node.js is correctly installed by checking the version:
    ```bash
    node -v
    ```
- Confirm all required dependencies are installed with:
    ```bash
    npm install
    ```
- If issues persist, check for error logs or contact support.

---

## License

This project is licensed under the MIT License.

---

## Disclaimer

This tool is intended for educational purposes only. Use responsibly and at your own risk.
