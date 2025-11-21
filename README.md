\# Hoodi Network Staking Bot



Automated staking and cross-trading bot for Hoodi Network (Chain ID: 560048) with multi-wallet support and enhanced transaction management.



\## Features



\- \*\*Multi-Wallet Support\*\* - Manage multiple wallets from a single file

\- \*\*ETH Staking\*\* - Stake ETH to receive eXETH tokens

\- \*\*Withdrawal System\*\* - Withdraw eXETH back to ETH with automated claim tracking

\- \*\*Cross Trading\*\* - Automated ETH ↔ eXETH trading cycles

\- \*\*Random Amount Range\*\* - Randomize transaction amounts within specified range

\- \*\*Auto-Claim\*\* - Automatic claiming of pending withdrawals after cooldown

\- \*\*Transaction Statistics\*\* - Track success rate, gas usage, and costs

\- \*\*RPC Failover\*\* - Automatic switching to backup RPC on connection issues

\- \*\*Progress Tracking\*\* - Save and resume pending operations



\## Installation



```bash

\# Clone repository

git clone https://github.com/Jauhar40/Ekox-Testnet-V2.git

cd hoodi-staking-bot



\# Install dependencies

npm install

```



\## Configuration



1\. Create `pk.txt` file in root directory

2\. Add your private keys (one per line):

```

0x1234567890abcdef...

0xabcdef1234567890...

\# Lines starting with # are ignored

```



⚠️ \*\*Security Warning\*\*: Never commit `pk.txt` to version control. Add it to `.gitignore`.



\## Usage



```bash

node index.js

```



\### Available Operations



1\. \*\*View All Wallet Balances\*\* - Displays ETH and eXETH balance for all wallets

2\. \*\*Stake ETH → eXETH\*\* (Option 3) - Stake ETH to receive eXETH

3\. \*\*Withdraw eXETH → ETH\*\* (Option 4) - Initiate withdrawal request

4\. \*\*Claim Withdrawal\*\* (Option 5) - Claim pending withdrawals after cooldown

5\. \*\*Cross Trading\*\* (Option 6) - Automated ETH→eXETH→ETH cycles

6\. \*\*Reverse Cross Trading\*\* (Option 7) - Automated eXETH→ETH→eXETH cycles

7\. \*\*Run All Features\*\* (Option 8) - Execute all operations for each wallet



\### Example Workflow



```bash

\# Start bot

node index.js



\# Choose operation (e.g., 6 for cross trading)

Choose operation: 6



\# Configure parameters

Use random amount? y

Minimum amount: 0.001

Maximum amount: 0.005

Number of cycles: 5

Delay between trades: 30

Auto-claim delay: 60

Iterations: 1



\# Confirm and execute

Proceed? y

```



\## Configuration Options



Modify in constructor for advanced settings:



```javascript

{

&nbsp; maxRetries: 3,           // Transaction retry attempts

&nbsp; retryDelay: 5,           // Delay between retries (seconds)

&nbsp; gasMultiplier: 2.0,      // Gas price multiplier

&nbsp; txTimeout: 60,           // Transaction timeout (seconds)

&nbsp; autoSwitchRpc: true      // Enable RPC failover

}

```



\## Contract Addresses (Hoodi Network)



\- \*\*Stake Contract\*\*: `0x9E2DDb3386D5dCe991A2595E8bc44756F864C6E3`

\- \*\*eXETH Token\*\*: `0x4d38Bd670764c49Cce1E59EeaEBD05974760aCbD`

\- \*\*Withdraw/Claim\*\*: `0x1D150609EE9EdcC6143506Ba55A4FAaeDd562Cd9`



\## Features Detail



\### Random Amount Range

Randomize transaction amounts to avoid pattern detection:

\- Set min/max range

\- Each transaction uses random value within range

\- Useful for multiple cycles



\### Auto-Claim System

\- Tracks pending withdrawals automatically

\- Claims after specified delay

\- Shows summary with gas costs



\### Progress Saving

\- Saves pending withdrawals to `progress.json`

\- Resume interrupted operations

\- Prevents duplicate claims



\## Requirements



\- Node.js v16+

\- ethers.js v6

\- ETH for gas fees on Hoodi Network



\## Network Info



\- \*\*Network\*\*: Hoodi Network

\- \*\*Chain ID\*\*: 560048

\- \*\*RPC\*\*: https://ethereum-hoodi-rpc.publicnode.com

\- \*\*Explorer\*\*: https://hoodi.explorer.caldera.xyz



\## Troubleshooting



\*\*Transaction Timeout\*\*

\- Increase `txTimeout` in config

\- Check RPC connection

\- Verify network status



\*\*Insufficient Balance\*\*

\- Ensure enough ETH for gas (reserve ~0.01 ETH)

\- Check eXETH balance for withdrawals



\*\*RPC Connection Issues\*\*

\- Bot auto-switches to backup RPC

\- Manual restart if persistent



\## Disclaimer



⚠️ Use at your own risk. This bot interacts with smart contracts on blockchain. Always:

\- Test with small amounts first

\- Keep private keys secure

\- Monitor transactions

\- Understand gas costs



\## Credits



\- Original: @ByDontol

\- Enhanced: @Flexoryn

\- Version: 2.5



\## License



MIT License - Use freely with attribution

"# Ekox-Testnet-V2-Hoodi-" 
"# Ekox-Testnet-V2-Hoodi" 
