import { ethers } from 'ethers';

// LP Token contract ABI with balanceOf and approve functions
export const lpTokenAbi = [
  // Read functions
  "function balanceOf(address account) external view returns (uint256)",
  // Write functions
  "function approve(address spender, uint256 amount) external returns (bool)",
  // Fee claiming function
  "function claimFees() external returns (uint256 claimed0, uint256 claimed1)"
];

// Router V2 contract ABI
export const routerV2Abi = [
  // Read functions
  "function quoteRemoveLiquidity(address tokenA, address tokenB, bool stable, uint256 liquidity) external view returns (uint256 amountA, uint256 amountB)",
  // Write functions
  "function removeLiquidity(address tokenA, address tokenB, bool stable, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB)"
];

// Token addresses
export const HOG = "0xB3804bF38bD170ef65b4De8536d19a8e3600C0A9";
export const GHOG = "0x0e899dA2aD0817ed850ce68f7f489688E4D42D9D";
export const OS = "0xb1e25689D55734FD3ffFc939c4C3Eb52DFf8A794";

// LP Token addresses
export const HOG_OS_LP = "0x784DD93F3c42DCbF88D45E6ad6D3CC20dA169a60";
export const GHOG_OS_LP = "0xD1CB1622a50506F0fDdf329CB857a0935C7FbbF9";
export const ROUTER_V2_CONTRACT = "0xF5F7231073b3B41c04BA655e1a7438b1a7b29c27";

// Get contract instances
export const getLpTokenContract = (lpAddress: string, provider: ethers.Provider, signer?: ethers.Signer) => {
  return new ethers.Contract(
    lpAddress,
    lpTokenAbi,
    signer || provider
  );
};

export const getRouterV2Contract = (provider: ethers.Provider, signer?: ethers.Signer) => {
  return new ethers.Contract(
    ROUTER_V2_CONTRACT,
    routerV2Abi,
    signer || provider
  );
};

// Helper function to calculate slippage (10%)
export const calculateMinAmount = (amount: ethers.BigNumberish): string => {
  const amountStr = amount.toString();
  // Remove the last digit (approximately 10% slippage)
  return amountStr.slice(0, -1);
};

// Helper function to get current timestamp + minutes
export const getDeadlineTimestamp = (minutesFromNow: number = 10): number => {
  return Math.floor(Date.now() / 1000) + minutesFromNow * 60;
};
