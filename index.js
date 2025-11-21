const { ethers } = require('ethers');
const fs = require('fs');
const readline = require('readline');

// Enhanced color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m'
};

// Enhanced logging with timestamps (WIB timezone)
const log = {
  timestamp: () => {
    const date = new Date();
    const wibOffset = 7 * 60;
    const localOffset = date.getTimezoneOffset();
    const wibTime = new Date(date.getTime() + (wibOffset + localOffset) * 60 * 1000);
    const year = wibTime.getFullYear();
    const month = String(wibTime.getMonth() + 1).padStart(2, '0');
    const day = String(wibTime.getDate()).padStart(2, '0');
    const hours = String(wibTime.getHours()).padStart(2, '0');
    const minutes = String(wibTime.getMinutes()).padStart(2, '0');
    const seconds = String(wibTime.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  },
  info: (msg) => console.log(`${colors.cyan}[${log.timestamp()}] ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}[${log.timestamp()}] ✓ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}[${log.timestamp()}] ⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}[${log.timestamp()}] ✗ ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bright}${colors.blue}[${log.timestamp()}] ${msg}${colors.reset}`),
  dim: (msg) => console.log(`${colors.dim}[${log.timestamp()}] ${msg}${colors.reset}`)
};

console.clear();
console.log(`${colors.cyan}
███████╗██╗  ██╗ ██████╗ ██╗  ██╗    ██╗   ██╗██████╗ 
██╔════╝██║ ██╔╝██╔═══██╗╚██╗██╔╝    ██║   ██║╚════██╗
█████╗  █████╔╝ ██║   ██║ ╚███╔╝     ██║   ██║ █████╔╝
██╔══╝  ██╔═██╗ ██║   ██║ ██╔██╗     ╚██╗ ██╔╝██╔═══╝ 
███████╗██║  ██╗╚██████╔╝██╔╝ ██╗     ╚████╔╝ ███████╗
╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝      ╚═══╝  ╚══════╝
${colors.gray}@ByDontol - Edited by @Flexoryn - Hoodi Network v2.5 Enhanced${colors.reset}
${colors.blue}══════════════════════════════════════════════════════${colors.reset}
`);

log.info('Starting Enhanced Hoodi Staking Bot...');

// Enhanced utility function
function getRandomAmount(minAmount, maxAmount) {
  const min = parseFloat(minAmount);
  const max = parseFloat(maxAmount);
  if (isNaN(min) || isNaN(max) || min >= max || min <= 0) {
    throw new Error('Invalid amount range');
  }
  const random = Math.random() * (max - min) + min;
  return random.toFixed(6);
}

// Transaction statistics tracker
class TransactionStats {
  constructor() {
    this.totalTxs = 0;
    this.successfulTxs = 0;
    this.failedTxs = 0;
    this.timeoutTxs = 0;
    this.totalGasUsed = 0n;
    this.totalGasCost = 0n;
    this.startTime = Date.now();
  }

  recordSuccess(gasUsed, gasPrice) {
    this.totalTxs++;
    this.successfulTxs++;
    this.totalGasUsed += gasUsed;
    this.totalGasCost += gasUsed * gasPrice;
  }

  recordFailure() {
    this.totalTxs++;
    this.failedTxs++;
  }

  recordTimeout() {
    this.totalTxs++;
    this.timeoutTxs++;
  }

  getStats() {
    const runtime = Math.floor((Date.now() - this.startTime) / 1000);
    return {
      total: this.totalTxs,
      success: this.successfulTxs,
      failed: this.failedTxs,
      timeout: this.timeoutTxs,
      successRate: this.totalTxs > 0 ? ((this.successfulTxs / this.totalTxs) * 100).toFixed(2) : 0,
      totalGasUsed: this.totalGasUsed.toString(),
      totalGasCost: ethers.formatEther(this.totalGasCost),
      runtime: runtime
    };
  }
}

class EkoxCrossRestakingBot {
  constructor(config = {}) {
    try {
      // Enhanced configuration with multiple RPC providers
      this.rpcProviders = [
        'https://ethereum-hoodi-rpc.publicnode.com',
        'https://ethereum-hoodi-rpc.publicnode.com'
      ];
      this.currentRpcIndex = 0;
      this.provider = this.createProvider(this.rpcProviders[this.currentRpcIndex]);

      // Configuration with enhanced defaults for testnet
      this.config = {
        maxRetries: config.maxRetries || 3,
        retryDelay: config.retryDelay || 5,
        gasMultiplier: config.gasMultiplier || 2.0,
        gasPriceGwei: config.gasPriceGwei || '2.5',
        maxGasPrice: config.maxGasPrice || '100',
        balanceCacheTime: config.balanceCacheTime || 10000,
        autoSwitchRpc: config.autoSwitchRpc !== false,
        txTimeout: config.txTimeout || 60,
        rpcTimeout: config.rpcTimeout || 30000,
        maxRpcRetries: config.maxRpcRetries || 5
      };

      this.privateKeys = this.readPrivateKeys();
      if (this.privateKeys.length === 0) throw new Error('No valid private keys found in pk.txt');

      this.wallets = this.privateKeys.map(pk => new ethers.Wallet(pk, this.provider));
      this.walletIndex = 0;
      this.wallet = this.wallets[this.walletIndex];

      log.success(`✅ Loaded ${this.wallets.length} wallet(s)`);
      log.info(`💼 Primary wallet: ${this.wallet.address}`);

      // Contract addresses for HOODI NETWORK
      this.STAKE_CONTRACT = '0x9E2DDb3386D5dCe991A2595E8bc44756F864C6E3';
      this.EXETH_CONTRACT = '0x4d38Bd670764c49Cce1E59EeaEBD05974760aCbD';
      this.WITHDRAW_CONTRACT = '0x1D150609EE9EdcC6143506Ba55A4FAaeDd562Cd9';

      // Enhanced ABIs
      this.ERC20_ABI = [
        'function approve(address spender, uint256 amount) returns (bool)',
        'function balanceOf(address owner) view returns (uint256)',
        'function allowance(address owner, address spender) view returns (uint256)'
      ];

      this.STAKE_ABI = [
        'function depositETH(uint256 nodeOperatorId) payable'
      ];

      this.WITHDRAW_ABI = [
        'function withdraw(uint256 _amount, address _assetOut)'
      ];

      this.CLAIM_ABI = [
        'function getOutstandingWithdrawRequests(address user) view returns (uint256)',
        'function withdrawRequests(address user, uint256 index) view returns (uint256 exETHLocked, uint256 amountToRedeem, uint256 withdrawRequestID, uint256 createdAt, address collateralToken)',
        'function coolDownPeriod() view returns (uint256)',
        'function claim(uint256 withdrawRequestIndex, address user)'
      ];

      this.updateContractsForWallet();

      // Enhanced state management
      this.approvalState = new Map();
      this.pendingWithdrawals = new Map();
      this.lastBalanceCheck = 0;
      this.balanceCache = { eth: 0n, exeth: 0n };
      this.stats = new TransactionStats();
      this.rpcFailCount = 0;

      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      log.success('✅ Bot initialized successfully for Hoodi Network');
    } catch (e) {
      log.error('⚠ Bot initialization failed: ' + e.message);
      process.exit(1);
    }
  }

  createProvider(rpcUrl) {
    return new ethers.JsonRpcProvider(rpcUrl, undefined, {
      staticNetwork: true,
      batchMaxCount: 1
    });
  }

  readPrivateKeys() {
    try {
      if (!fs.existsSync('./pk.txt')) {
        throw new Error('pk.txt not found. Please create pk.txt with private keys (one per line)');
      }
      const raw = fs.readFileSync('./pk.txt', 'utf8');
      const keys = raw
        .split(/\r?\n/)
        .map(k => k.trim())
        .filter(Boolean)
        .filter(k => !k.startsWith('#'))
        .map(k => k.startsWith('0x') ? k : '0x' + k)
        .filter(pk => {
          const ok = /^0x[0-9a-fA-F]{64}$/.test(pk);
          if (!ok) log.warning(`Invalid private key format (skipped): ${pk.substr(0, 10)}...`);
          return ok;
        });

      if (keys.length === 0) {
        throw new Error('No valid private keys found in pk.txt');
      }
      return keys;
    } catch (e) {
      throw new Error(`Failed to read private keys: ${e.message}`);
    }
  }

  async switchRpcProvider() {
    if (!this.config.autoSwitchRpc) return false;
    this.currentRpcIndex = (this.currentRpcIndex + 1) % this.rpcProviders.length;
    const newRpc = this.rpcProviders[this.currentRpcIndex];
    log.warning(`🔄 Switching to backup RPC: ${newRpc}`);
    this.provider = this.createProvider(newRpc);
    this.wallets = this.privateKeys.map(pk => new ethers.Wallet(pk, this.provider));
    this.wallet = this.wallets[this.walletIndex];
    this.updateContractsForWallet();
    this.rpcFailCount = 0;
    return true;
  }

  updateContractsForWallet() {
    this.stakeContract = new ethers.Contract(this.STAKE_CONTRACT, this.STAKE_ABI, this.wallet);
    this.exethErc20 = new ethers.Contract(this.EXETH_CONTRACT, this.ERC20_ABI, this.wallet);
    this.withdrawRouter = new ethers.Contract(this.WITHDRAW_CONTRACT, this.WITHDRAW_ABI, this.wallet);
    this.claimContract = new ethers.Contract(this.WITHDRAW_CONTRACT, this.CLAIM_ABI, this.wallet);
  }

  selectWallet(index) {
    if (index < 0 || index >= this.wallets.length) {
      throw new Error(`Invalid wallet index: ${index}. Valid range: 0-${this.wallets.length - 1}`);
    }
    this.walletIndex = index;
    this.wallet = this.wallets[this.walletIndex];
    this.updateContractsForWallet();
    log.info(`🔄 Switched to wallet #${this.walletIndex + 1}: ${this.wallet.address}`);
    this.lastBalanceCheck = 0;
  }

  getApprovalKey(wallet, token, spender) {
    return `${wallet}_${token}_${spender}`;
  }

  async ask(question) {
    return new Promise((resolve) => {
      this.rl.question(`${colors.yellow}${question}${colors.reset}`, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async waitForTransactionWithRetry(tx, timeoutSeconds = null) {
    const timeout = timeoutSeconds || this.config.txTimeout;
    let retries = 0;

    while (retries < this.config.maxRpcRetries) {
      try {
        const receipt = await this.waitForTransaction(tx, timeout);
        this.rpcFailCount = 0;
        return receipt;
      } catch (e) {
        retries++;
        if (e.code === 'SERVER_ERROR' || e.message.includes('503') ||
          e.message.includes('upstream') || e.message.includes('timeout')) {
          this.rpcFailCount++;
          log.warning(`⚠️ RPC error (attempt ${retries}/${this.config.maxRpcRetries}): ${e.message}`);

          if (this.rpcFailCount >= 3) {
            log.warning('⚠️ Multiple RPC failures detected, switching provider...');
            await this.switchRpcProvider();
            await this.sleep(3);
          } else {
            await this.sleep(5);
          }

          try {
            log.dim('🔍 Attempting manual receipt check...');
            const receipt = await this.provider.getTransactionReceipt(tx.hash);
            if (receipt) {
              if (receipt.status === 1) {
                log.success(`✅ Transaction confirmed (manual check)`);
                this.rpcFailCount = 0;
                return receipt;
              } else {
                log.warning(`⚠️ Transaction failed`);
                return null;
              }
            }
          } catch (checkError) {
            log.dim(`Could not check receipt: ${checkError.message}`);
          }

          if (retries >= this.config.maxRpcRetries) {
            log.error('⚠️ Max RPC retries reached, transaction may still be pending');
            log.info(`🔍 Check manually: https://hoodi.explorer.caldera.xyz/tx/${tx.hash}`);
            return null;
          }
        } else {
          throw e;
        }
      }
    }
    return null;
  }

  async waitForTransaction(tx, timeoutSeconds = null) {
    const timeout = timeoutSeconds || this.config.txTimeout;
    const timeoutMs = timeout * 1000;

    try {
      log.dim(`📤 Tx: ${tx.hash}`);
      log.dim(`⏳ Waiting max ${timeout}s for confirmation...`);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TX_TIMEOUT')), timeoutMs);
      });

      const receipt = await Promise.race([
        tx.wait(1),
        timeoutPromise
      ]);

      if (receipt && receipt.status === 1) {
        log.success(`✅ Confirmed at block ${receipt.blockNumber}, gas: ${receipt.gasUsed}`);
        return receipt;
      } else {
        throw new Error('Transaction reverted');
      }
    } catch (e) {
      if (e.message === 'TX_TIMEOUT') {
        log.warning(`⏰ Transaction timeout after ${timeout}s`);
        log.info(`🔍 Check manually: https://hoodi.explorer.caldera.xyz/tx/${tx.hash}`);
        this.stats.recordTimeout();
        return null;
      }
      throw e;
    }
  }

  async checkBalances(force = false) {
    const now = Date.now();
    if (!force && (now - this.lastBalanceCheck) < this.config.balanceCacheTime) {
      return this.balanceCache;
    }

    log.dim('📊 Checking balances...');
    let retries = 0;

    while (retries < this.config.maxRetries) {
      try {
        const eth = await this.provider.getBalance(this.wallet.address);
        let exeth = 0n;

        try {
          exeth = await this.exethErc20.balanceOf(this.wallet.address);
        } catch (e) {
          log.warning(`⚠️ Could not fetch eXETH balance: ${e.message}`);
        }

        log.info(`💰 ETH   : ${ethers.formatEther(eth)}`);
        log.info(`⚡ eXETH : ${ethers.formatEther(exeth)}`);

        this.balanceCache = { eth, exeth };
        this.lastBalanceCheck = now;
        return this.balanceCache;
      } catch (e) {
        retries++;
        log.error(`⚠️ Balance check failed (attempt ${retries}/${this.config.maxRetries}): ${e.message}`);
        if (retries >= this.config.maxRetries) {
          if (await this.switchRpcProvider()) {
            retries = 0;
            continue;
          }
          throw new Error('Failed to check balances after multiple retries');
        }
        await this.sleep(this.config.retryDelay);
      }
    }
  }

  // NEW: Display all wallet balances
  async displayAllWalletBalances() {
    log.header('\n💼 Saldo Semua Wallet:');
    log.header('═'.repeat(80));
    
    const currentWalletIndex = this.walletIndex;
    
    for (let i = 0; i < this.wallets.length; i++) {
      try {
        this.selectWallet(i);
        
        const eth = await this.provider.getBalance(this.wallet.address);
        let exeth = 0n;
        
        try {
          exeth = await this.exethErc20.balanceOf(this.wallet.address);
        } catch (e) {
          log.warning(`⚠️ Could not fetch eXETH balance for wallet ${i + 1}`);
        }
        
        const ethFormatted = ethers.formatEther(eth);
        const exethFormatted = ethers.formatEther(exeth);
        
        console.log(`${colors.cyan}[Wallet ${i + 1}]${colors.reset} ${this.wallet.address}`);
        console.log(`  ${colors.green}├─ ETH   : ${ethFormatted}${colors.reset}`);
        console.log(`  ${colors.magenta}└─ eXETH : ${exethFormatted}${colors.reset}\n`);
        
      } catch (e) {
        log.error(`⚠️ Failed to fetch balance for wallet ${i + 1}: ${e.message}`);
      }
    }
    
    log.header('═'.repeat(80));
    
    // Restore original wallet
    this.selectWallet(currentWalletIndex);
  }

  async sleep(seconds) {
    if (seconds > 0) {
      log.dim(`⏱️ Waiting ${seconds}s...`);
    }
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  async getDynamicGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      let gasPrice = feeData.gasPrice || ethers.parseUnits(this.config.gasPriceGwei, 'gwei');
      gasPrice = (gasPrice * BigInt(Math.floor(this.config.gasMultiplier * 100))) / 100n;

      const minGas = ethers.parseUnits('1.5', 'gwei');
      if (gasPrice < minGas) {
        gasPrice = minGas;
      }

      const maxGas = ethers.parseUnits(this.config.maxGasPrice, 'gwei');
      if (gasPrice > maxGas) {
        log.warning(`⚠️ Gas price capped at ${this.config.maxGasPrice} gwei`);
        gasPrice = maxGas;
      }

      log.dim(`⛽ Using gas price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
      return gasPrice;
    } catch (e) {
      log.warning(`⚠️ Could not fetch gas price, using default: ${e.message}`);
      return ethers.parseUnits(this.config.gasPriceGwei, 'gwei');
    }
  }

  async ensureExethApprovalForWithdraw(amount) {
    const approvalKey = this.getApprovalKey(
      this.wallet.address,
      this.EXETH_CONTRACT,
      this.WITHDRAW_CONTRACT
    );

    if (this.approvalState.get(approvalKey)) return;

    let retries = 0;
    while (retries < this.config.maxRetries) {
      try {
        const currentAllowance = await this.exethErc20.allowance(
          this.wallet.address,
          this.WITHDRAW_CONTRACT
        );

        if (currentAllowance >= amount) {
          this.approvalState.set(approvalKey, true);
          log.success('✅ eXETH already approved for withdrawal');
          return;
        }

        log.info(`🔓 Approving eXETH for withdraw contract...`);
        const maxApproval = ethers.parseEther('1000000');
        const gasPrice = await this.getDynamicGasPrice();

        const tx = await this.exethErc20.approve(this.WITHDRAW_CONTRACT, maxApproval, {
          gasLimit: 100000,
          gasPrice: gasPrice
        });

        const receipt = await this.waitForTransactionWithRetry(tx);
        if (receipt && receipt.status === 1) {
          log.success(`✅ eXETH approved successfully`);
          this.approvalState.set(approvalKey, true);
          this.stats.recordSuccess(receipt.gasUsed, gasPrice);
          return;
        } else {
          throw new Error('Approval transaction failed or timeout');
        }
      } catch (e) {
        retries++;
        log.error(`⚠️ eXETH approval failed (attempt ${retries}/${this.config.maxRetries}): ${e.message}`);
        if (retries >= this.config.maxRetries) {
          this.stats.recordFailure();
          throw new Error('Failed to approve eXETH after multiple retries');
        }
        await this.sleep(this.config.retryDelay);
      }
    }
  }

  /* ============= CORE ACTION METHODS ============= */

  async wrapEthToWeth(amountEth) {
    log.warning('⚠️ Wrap function not needed on Hoodi - use stake directly');
    return null;
  }

  async unwrapWethToEth(amountWeth) {
    log.warning('⚠️ Unwrap function not needed on Hoodi');
    return null;
  }

  async restakeWethToExeth(amountEth) {
    const amount = ethers.parseEther(String(amountEth));
    const { eth } = await this.checkBalances();
    const gasReserve = ethers.parseEther('0.01');
    const requiredEth = amount + gasReserve;

    if (eth < requiredEth) {
      log.warning(`⚠️ Insufficient ETH. Required: ${ethers.formatEther(requiredEth)}, Available: ${ethers.formatEther(eth)}`);
      return null;
    }

    log.info(`🔗 Staking ${amountEth} ETH → eXETH on Hoodi...`);

    let retries = 0;
    while (retries < this.config.maxRetries) {
      try {
        const gasPrice = await this.getDynamicGasPrice();
        const nodeOperatorId = 0;

        const tx = await this.stakeContract.depositETH(nodeOperatorId, {
          value: amount,
          gasLimit: 650000,
          gasPrice: gasPrice
        });

        const receipt = await this.waitForTransactionWithRetry(tx);
        if (receipt && receipt.status === 1) {
          this.stats.recordSuccess(receipt.gasUsed, gasPrice);
          this.lastBalanceCheck = 0;
          return receipt;
        } else if (receipt === null) {
          throw new Error('Transaction timeout');
        } else {
          throw new Error('Transaction failed');
        }
      } catch (e) {
        retries++;
        log.warning(`⚠️ Stake attempt ${retries}/${this.config.maxRetries} failed: ${e.message}`);
        if (retries >= this.config.maxRetries) {
          this.stats.recordFailure();
          log.error('⚠️ All stake methods exhausted');
          return null;
        }
        await this.sleep(this.config.retryDelay);
      }
    }
  }

  async withdrawExethToWeth(amountEth, trackPending = false) {
    const amount = ethers.parseEther(String(amountEth));
    const { exeth } = await this.checkBalances();

    if (exeth < amount) {
      log.warning(`⚠️ Insufficient eXETH. Required: ${amountEth}, Available: ${ethers.formatEther(exeth)}`);
      return null;
    }

    await this.ensureExethApprovalForWithdraw(amount);
    log.info(`🔗 Withdrawing ${amountEth} eXETH → ETH on Hoodi...`);

    let estimatedIndex = null;
    if (trackPending) {
      try {
        const pendingSet = this.pendingWithdrawals.get(this.wallet.address) || new Set();
        estimatedIndex = pendingSet.size;
        log.dim(`🔍 Estimated withdrawal index: ${estimatedIndex}`);
      } catch (e) {
        log.warning(`⚠️ Could not estimate withdrawal index: ${e.message}`);
      }
    }

    let retries = 0;
    while (retries < this.config.maxRetries) {
      try {
        const assetOut = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
        const gasPrice = await this.getDynamicGasPrice();

        const withdrawInterface = new ethers.Interface(this.WITHDRAW_ABI);
        const txData = withdrawInterface.encodeFunctionData('withdraw', [amount, assetOut]);

        const tx = await this.wallet.sendTransaction({
          to: this.WITHDRAW_CONTRACT,
          data: txData,
          value: 0n,
          gasLimit: 650000,
          gasPrice: gasPrice
        });

        const receipt = await this.waitForTransactionWithRetry(tx);
        if (receipt && receipt.status === 1) {
          this.stats.recordSuccess(receipt.gasUsed, gasPrice);

          if (trackPending && estimatedIndex !== null) {
            const pendingSet = this.pendingWithdrawals.get(this.wallet.address) || new Set();
            pendingSet.add(estimatedIndex);
            this.pendingWithdrawals.set(this.wallet.address, pendingSet);
            log.dim(`📌 Tracked withdrawal request index ${estimatedIndex}`);
          }

          this.lastBalanceCheck = 0;
          return receipt;
        } else if (receipt === null) {
          throw new Error('Transaction timeout');
        } else {
          throw new Error('Transaction failed');
        }
      } catch (e) {
        retries++;
        log.warning(`⚠️ Withdrawal attempt ${retries}/${this.config.maxRetries} failed: ${e.message}`);
        if (retries >= this.config.maxRetries) {
          this.stats.recordFailure();
          log.error('⚠️ All withdrawal methods exhausted');
          return null;
        }
        await this.sleep(this.config.retryDelay);
      }
    }
  }

  async claim(index) {
    const idx = BigInt(index);
    log.info(`🎁 Claiming withdrawal request #${idx} for ${this.wallet.address}...`);

    let retries = 0;
    while (retries < this.config.maxRetries) {
      try {
        const claimInterface = new ethers.Interface(this.CLAIM_ABI);
        const txData = claimInterface.encodeFunctionData('claim', [idx, this.wallet.address]);
        const gasPrice = await this.getDynamicGasPrice();

        log.dim(`🔍 Claim data length: ${txData.length} bytes`);

        const tx = await this.wallet.sendTransaction({
          to: this.WITHDRAW_CONTRACT,
          data: txData,
          value: 0n,
          gasLimit: 650000,
          gasPrice: gasPrice
        });

        const receipt = await this.waitForTransactionWithRetry(tx);
        if (receipt && receipt.status === 1) {
          this.stats.recordSuccess(receipt.gasUsed, gasPrice);
          this.lastBalanceCheck = 0;
          return receipt;
        } else if (receipt === null) {
          throw new Error('Transaction timeout');
        } else {
          throw new Error('Claim transaction failed');
        }
      } catch (e) {
        retries++;
        if (e.message.includes('no withdrawal request') ||
          e.message.includes('invalid index') ||
          e.message.includes('already claimed')) {
          log.warning(`⚠️ No valid withdrawal request at index ${idx}`);
          return null;
        }

        log.error(`⚠️ Claim attempt ${retries}/${this.config.maxRetries} failed: ${e.message}`);
        if (retries >= this.config.maxRetries) {
          this.stats.recordFailure();
          return null;
        }
        await this.sleep(this.config.retryDelay);
      }
    }
  }

  async claimAllPendingWithdrawals() {
    const pendingSet = this.pendingWithdrawals.get(this.wallet.address) || new Set();
    if (pendingSet.size === 0) {
      log.dim('🔍 No pending withdrawals to claim');
      return { success: 0, failed: 0, totalGas: 0n };
    }

    log.info(`🎯 Processing ${pendingSet.size} pending withdrawal(s)...`);

    let claimSuccess = 0;
    let claimFailed = 0;
    let totalClaimGas = 0n;
    const pendingArray = Array.from(pendingSet).sort((a, b) => a - b);

    for (const index of pendingArray) {
      try {
        log.dim(`--- Attempting to claim withdrawal #${index} ---`);
        await this.sleep(2);

        const receipt = await this.claim(index);
        if (receipt) {
          totalClaimGas += receipt.gasUsed;
          claimSuccess++;
          pendingSet.delete(index);
          log.success(`✅ Claimed and removed index ${index} from pending list`);
        } else {
          claimFailed++;
          pendingSet.delete(index);
        }
      } catch (e) {
        claimFailed++;
        log.error(`⚠️ Failed to claim withdrawal #${index}: ${e.message}`);
      }
    }

    this.pendingWithdrawals.set(this.wallet.address, pendingSet);

    log.header('========================================');
    log.header('🎁 AUTO-CLAIM SUMMARY');
    log.header('========================================');
    log.success(`✅ Claims Successful: ${claimSuccess}`);
    if (claimFailed > 0) log.error(`⚠️ Claims Failed: ${claimFailed}`);
    log.info(`⛽ Total Claim Gas: ${totalClaimGas.toString()} units`);

    if (pendingSet.size > 0) {
      log.warning(`⚠️ ${pendingSet.size} withdrawal(s) still pending`);
    } else {
      log.success(`🎉 All pending withdrawals claimed!`);
    }

    return { success: claimSuccess, failed: claimFailed, totalGas: totalClaimGas };
  }

  saveProgress() {
    try {
      const progress = {
        timestamp: new Date().toISOString(),
        stats: this.stats.getStats(),
        pendingWithdrawals: Object.fromEntries(
          Array.from(this.pendingWithdrawals.entries()).map(
            ([key, value]) => [key, Array.from(value)]
          )
        )
      };

      fs.writeFileSync('./progress.json', JSON.stringify(progress, null, 2));
      log.success('💾 Progress saved to progress.json');
    } catch (e) {
      log.warning(`⚠️ Could not save progress: ${e.message}`);
    }
  }

  loadProgress() {
    try {
      if (fs.existsSync('./progress.json')) {
        const data = fs.readFileSync('./progress.json', 'utf8');
        const progress = JSON.parse(data);

        if (progress.pendingWithdrawals) {
          for (const [wallet, indexes] of Object.entries(progress.pendingWithdrawals)) {
            this.pendingWithdrawals.set(wallet, new Set(indexes));
          }
          log.success('📂 Progress loaded from progress.json');
        }
      }
    } catch (e) {
      log.warning(`⚠️ Could not load progress: ${e.message}`);
    }
  }

  close() {
    this.saveProgress();
    this.rl.close();
  }
}

/* ============= HELPER FUNCTIONS ============= */

async function runFeature(bot, feature, params) {
  let result = null;
  let currentAmount = params.amount;

  if (params.useRandomAmount && params.minAmount && params.maxAmount) {
    currentAmount = getRandomAmount(params.minAmount, params.maxAmount);
    log.info(`🎲 Random amount: ${currentAmount} ETH`);
  }

  try {
    switch (feature) {
      case '1':
        result = await bot.wrapEthToWeth(currentAmount);
        break;
      case '2':
        result = await bot.unwrapWethToEth(currentAmount);
        break;
      case '3':
        result = await bot.restakeWethToExeth(currentAmount);
        break;
      case '4':
        result = await bot.withdrawExethToWeth(currentAmount, false);
        break;
      case '5':
        result = await bot.claim(params.claimIndex);
        break;
      case '6':
        for (let cycle = 1; cycle <= params.cycles; cycle++) {
          log.header(`\n===== Cross Trading Cycle ${cycle}/${params.cycles} =====`);

          let cycleAmount = currentAmount;
          if (params.useRandomAmount) {
            cycleAmount = getRandomAmount(params.minAmount, params.maxAmount);
            log.info(`🎲 Cycle ${cycle} amount: ${cycleAmount} ETH`);
          }

          await bot.restakeWethToExeth(cycleAmount);
          if (params.delay && cycle < params.cycles) await bot.sleep(Math.min(params.delay, 10));

          await bot.withdrawExethToWeth(cycleAmount, true);
          if (cycle < params.cycles && params.delay) await bot.sleep(params.delay);
        }

        if (params.claimDelay > 0) {
          await bot.sleep(params.claimDelay);
          return await bot.claimAllPendingWithdrawals();
        }
        return { success: 0, failed: 0, totalGas: 0n };

      case '7':
        for (let cycle = 1; cycle <= params.cycles; cycle++) {
          log.header(`\n===== Reverse Cross Trading Cycle ${cycle}/${params.cycles} =====`);

          let cycleAmount = currentAmount;
          if (params.useRandomAmount) {
            cycleAmount = getRandomAmount(params.minAmount, params.maxAmount);
            log.info(`🎲 Cycle ${cycle} amount: ${cycleAmount} ETH`);
          }

          await bot.withdrawExethToWeth(cycleAmount, true);
          if (params.delay && cycle < params.cycles) await bot.sleep(Math.min(params.delay, 10));

          await bot.restakeWethToExeth(cycleAmount);
          if (cycle < params.cycles && params.delay) await bot.sleep(params.delay);
        }

        if (params.claimDelay > 0) {
          await bot.sleep(params.claimDelay);
          return await bot.claimAllPendingWithdrawals();
        }
        return { success: 0, failed: 0, totalGas: 0n };

      default:
        throw new Error(`Unknown feature: ${feature}`);
    }
  } catch (e) {
    log.error(`⚠️ Feature ${feature} execution error: ${e.message}`);
    throw e;
  }

  return result;
}

async function shouldSkipFeature(bot, feature, params) {
  try {
    const { eth, exeth } = await bot.checkBalances();
    let requiredAmount;

    if (params.useRandomAmount && params.minAmount) {
      requiredAmount = ethers.parseEther(String(params.minAmount));
    } else {
      requiredAmount = ethers.parseEther(String(params.amount || '0'));
    }

    const gasReserve = ethers.parseEther('0.01');

    switch (feature) {
      case '1':
      case '2':
        return false;
      case '3':
        return eth < (requiredAmount + gasReserve);
      case '4':
        return exeth < requiredAmount;
      case '5':
        return false;
      case '6':
        return eth < (requiredAmount + gasReserve);
      case '7':
        return exeth < requiredAmount;
      default:
        return false;
    }
  } catch (e) {
    log.warning(`⚠️ Could not check balance requirements: ${e.message}`);
    return false;
  }
}

async function runAllFeaturesForWallet(bot, walletIdx, params) {
  bot.selectWallet(walletIdx);
  await bot.checkBalances(true);

  let walletSuccess = 0;
  let walletFailed = 0;

  for (let featureNum = 3; featureNum <= 7; featureNum++) {
    log.header(`\n--- Wallet #${walletIdx + 1} - Feature ${featureNum} ---`);

    try {
      const skip = await shouldSkipFeature(bot, String(featureNum), params);
      if (skip) {
        log.warning(`⚠️ Skipping feature ${featureNum} - insufficient balance`);
        continue;
      }

      const result = await runFeature(bot, String(featureNum), params);
      if (result !== null && result !== undefined) {
        walletSuccess++;
      } else {
        walletFailed++;
      }
    } catch (e) {
      walletFailed++;
      log.error(`⚠️ Feature ${featureNum} failed: ${e.message}`);
    }

    await bot.sleep(2);
  }

  log.header(`\n--- Wallet #${walletIdx + 1} Summary: ✅ ${walletSuccess} | ❌ ${walletFailed} ---`);
  return { success: walletSuccess, failed: walletFailed };
}

async function runSingleFeatureForWallet(bot, walletIdx, feature, params) {
  bot.selectWallet(walletIdx);
  await bot.checkBalances(true);

  try {
    const skip = await shouldSkipFeature(bot, feature, params);
    if (skip) {
      log.warning(`⚠️ Skipping feature ${feature} - insufficient balance`);
      return { success: 0, failed: 1 };
    }

    const result = await runFeature(bot, feature, params);
    return result !== null ? { success: 1, failed: 0 } : { success: 0, failed: 1 };
  } catch (e) {
    log.error(`⚠️ Feature execution failed: ${e.message}`);
    return { success: 0, failed: 1 };
  }
}

/* ============= MAIN FUNCTION ============= */

async function main() {
  let bot;
  try {
    log.info('🤖 Initializing Enhanced Hoodi Staking Bot...');

    bot = new EkoxCrossRestakingBot();
    bot.loadProgress();

    await bot.checkBalances(true);

    // ✨ FITUR BARU: TAMPILKAN SALDO SEMUA WALLET
    await bot.displayAllWalletBalances();

    log.header('\n📋 Available Operations:');
    log.info('1. [N/A] Wrap ETH → WETH (not used on Hoodi)');
    log.info('2. [N/A] Unwrap WETH → ETH (not used on Hoodi)');
    log.info('3. Stake ETH → eXETH');
    log.info('4. Withdraw eXETH → ETH');
    log.info('5. Claim pending withdrawal');
    log.info('6. Cross trading (ETH→eXETH, eXETH→ETH cycles)');
    log.info('7. Reverse cross trading (eXETH→ETH, ETH→eXETH cycles)');
    log.info('8. Run ALL features (3-7) for each wallet');

    const choice = await bot.ask('\n🔄 Choose operation (3-8, skip 1-2): ');

    if (!['3', '4', '5', '6', '7', '8'].includes(choice)) {
      throw new Error('Invalid choice - use 3-8 only');
    }

    let params = {
      amount: '0',
      cycles: 1,
      delay: 30,
      claimDelay: 60,
      claimIndex: 0n,
      iterations: 1,
      useRandomAmount: false,
      minAmount: null,
      maxAmount: null
    };

    if (['3', '4', '6', '7', '8'].includes(choice)) {
      const useRandom = (await bot.ask('🎲 Use random amount range? (y/N): ')).toLowerCase();

      if (useRandom === 'y' || useRandom === 'yes') {
        params.useRandomAmount = true;
        params.minAmount = await bot.ask('💰 Minimum amount (ETH): ');
        params.maxAmount = await bot.ask('💰 Maximum amount (ETH): ');

        const min = parseFloat(params.minAmount);
        const max = parseFloat(params.maxAmount);

        if (isNaN(min) || isNaN(max) || min <= 0 || max <= 0 || min >= max) {
          throw new Error('Invalid amount range');
        }
        log.success(`✅ Amount range: ${params.minAmount} - ${params.maxAmount} ETH`);
      } else {
        params.amount = await bot.ask('💰 Amount (ETH): ');
        const amt = parseFloat(params.amount);
        if (isNaN(amt) || amt <= 0) {
          throw new Error('Invalid amount');
        }
      }

      if (['3', '4', '6', '7', '8'].includes(choice)) {
        const cyclesInput = await bot.ask('🔢 Number of cycles (default 1): ');
        params.cycles = cyclesInput ? parseInt(cyclesInput, 10) : 1;
        if (!Number.isFinite(params.cycles) || params.cycles <= 0) {
          throw new Error('Invalid cycles');
        }

        const delayInput = await bot.ask('⏱️ Delay between trades (sec, default 30): ');
        params.delay = delayInput ? parseInt(delayInput, 10) : 30;
        if (!Number.isFinite(params.delay) || params.delay < 0) {
          throw new Error('Invalid delay');
        }
      }

      if (['6', '7', '8'].includes(choice)) {
        const claimInput = await bot.ask('🎁 Delay before auto-claim (sec, default 60): ');
        params.claimDelay = claimInput ? parseInt(claimInput, 10) : 60;
        if (!Number.isFinite(params.claimDelay) || params.claimDelay < 0) {
          throw new Error('Invalid claim delay');
        }

        const iterInput = await bot.ask('🔄 Number of iterations (default 1): ');
        params.iterations = iterInput ? parseInt(iterInput, 10) : 1;
        if (!Number.isFinite(params.iterations) || params.iterations <= 0) {
          throw new Error('Invalid iterations');
        }
      }
    } else if (choice === '5') {
      const idxInput = await bot.ask('📌 Withdrawal index to claim (default 0): ');
      params.claimIndex = BigInt(idxInput || '0');

      const iterInput = await bot.ask('🔄 Number of iterations (default 1): ');
      params.iterations = iterInput ? parseInt(iterInput, 10) : 1;
    }

    log.header('\n🧾 Configuration Summary:');
    log.info(` • Operation: ${choice}`);
    log.info(` • Network: Hoodi (Chain ID: 560048)`);
    log.info(` • Wallets: ${bot.wallets.length}`);

    if (params.useRandomAmount) {
      log.info(` • Amount: ${params.minAmount} - ${params.maxAmount} ETH (random)`);
    } else if (params.amount !== '0') {
      log.info(` • Amount: ${params.amount} ETH`);
    }

    if (params.cycles > 1) log.info(` • Cycles: ${params.cycles}`);
    if (params.iterations > 1) log.info(` • Iterations: ${params.iterations}`);
    if (params.delay) log.info(` • Trade Delay: ${params.delay}s`);
    if (params.claimDelay && ['6', '7', '8'].includes(choice)) {
      log.info(` • Claim Delay: ${params.claimDelay}s`);
    }
    if (choice === '5') log.info(` • Claim Index: ${params.claimIndex}`);
    log.info(` • Transaction Timeout: ${bot.config.txTimeout}s`);

    const confirm = (await bot.ask('\n✅ Proceed with execution? (y/N): ')).toLowerCase();
    if (confirm !== 'y' && confirm !== 'yes') {
      log.warning('⚠️ Operation cancelled');
      return;
    }

    log.header(`\n🚀 Starting execution...`);
    log.header(`📊 ${params.iterations} iteration(s) × ${bot.wallets.length} wallet(s) × ${params.cycles} cycle(s)`);

    for (let iteration = 1; iteration <= params.iterations; iteration++) {
      log.header(`\n${'='.repeat(60)}`);
      log.header(`🔄 ITERATION ${iteration}/${params.iterations}`);
      log.header(`${'='.repeat(60)}`);

      if (choice === '8') {
        for (let cycle = 1; cycle <= params.cycles; cycle++) {
          log.header(`\n📍 CYCLE ${cycle}/${params.cycles}`);

          for (let walletIdx = 0; walletIdx < bot.wallets.length; walletIdx++) {
            log.header(`\n💼 Wallet ${walletIdx + 1}/${bot.wallets.length}`);
            await runAllFeaturesForWallet(bot, walletIdx, params);

            if (walletIdx < bot.wallets.length - 1) {
              await bot.sleep(3);
            }
          }

          if (cycle < params.cycles) {
            log.header(`\n⏳ Cycle ${cycle} complete. Pausing before next cycle...`);
            await bot.sleep(params.delay);
          }
        }
      } else {
        if (params.cycles > 1 && ['6', '7'].includes(choice)) {
          for (let cycle = 1; cycle <= params.cycles; cycle++) {
            log.header(`\n📍 CYCLE ${cycle}/${params.cycles}`);

            for (let walletIdx = 0; walletIdx < bot.wallets.length; walletIdx++) {
              log.header(`\n💼 Wallet ${walletIdx + 1}/${bot.wallets.length}`);
              await runSingleFeatureForWallet(bot, walletIdx, choice, params);

              if (walletIdx < bot.wallets.length - 1) {
                await bot.sleep(3);
              }
            }

            if (cycle < params.cycles) {
              await bot.sleep(params.delay);
            }
          }
        } else {
          for (let walletIdx = 0; walletIdx < bot.wallets.length; walletIdx++) {
            log.header(`\n💼 Wallet ${walletIdx + 1}/${bot.wallets.length}`);
            await runSingleFeatureForWallet(bot, walletIdx, choice, params);

            if (walletIdx < bot.wallets.length - 1) {
              await bot.sleep(3);
            }
          }
        }
      }

      if (iteration < params.iterations) {
        log.header(`\n⏳ Iteration ${iteration} complete. Pausing before next iteration...`);
        await bot.sleep(params.delay * 2);
      }
    }

    const stats = bot.stats.getStats();
    log.header('\n' + '='.repeat(60));
    log.header('📊 FINAL EXECUTION SUMMARY');
    log.header('='.repeat(60));
    log.success(`✅ Successful Transactions: ${stats.success}`);
    if (stats.failed > 0) log.error(`❌ Failed Transactions: ${stats.failed}`);
    if (stats.timeout > 0) log.warning(`⏰ Timeout Transactions: ${stats.timeout}`);
    log.info(`📈 Success Rate: ${stats.successRate}%`);
    log.info(`⛽ Total Gas Used: ${stats.totalGasUsed} units`);
    log.info(`💸 Estimated Gas Cost: ${stats.totalGasCost} ETH`);
    log.info(`⏱️ Total Runtime: ${stats.runtime}s`);

    log.header('\n🔍 Final Balance Check:');
    await bot.checkBalances(true);

    let totalPending = 0;
    for (const [wallet, pending] of bot.pendingWithdrawals.entries()) {
      totalPending += pending.size;
    }

    if (totalPending > 0) {
      log.warning(`\n⚠️ Note: ${totalPending} withdrawal(s) still pending across all wallets`);
      log.info('💡 Run option 5 (Claim) to claim pending withdrawals');
    }

    log.success('\n🎉 Execution completed successfully!');
  } catch (e) {
    log.error(`\n💥 Execution failed: ${e.message}`);
    if (e.stack) log.dim(e.stack);
  } finally {
    if (bot) {
      bot.close();
    }
    process.exit(0);
  }
}

/* ============= ERROR HANDLERS ============= */

process.on('uncaughtException', (error) => {
  log.error('💥 Uncaught Exception: ' + error.message);
  if (error.stack) log.dim(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error('💥 Unhandled Rejection: ' + (reason?.message || String(reason)));

  if (reason && typeof reason === 'object' && 'code' in reason) {
    if (reason.code === 'SERVER_ERROR' || reason.code === 'TIMEOUT') {
      log.warning('⚠️ RPC connection issue detected, bot may continue or restart');
      return;
    }
  }
  process.exit(1);
});

process.on('SIGINT', () => {
  log.info('\n👋 Bot stopped by user (CTRL+C)');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log.info('\n👋 Bot terminated');
  process.exit(0);
});

/* ============= START BOT ============= */

main().catch((error) => {
  log.error('💥 Fatal error: ' + error.message);
  if (error.stack) log.dim(error.stack);
  process.exit(1);
});
