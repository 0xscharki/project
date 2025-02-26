import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { 
  getLpTokenContract, 
  getRouterV2Contract, 
  getDeadlineTimestamp,
  LP_TOKEN_CONTRACT,
  ROUTER_V2_CONTRACT,
  TOKEN_A,
  TOKEN_B
} from '../utils/contracts';
import toast from 'react-hot-toast';
import { Settings, Loader2, Info } from 'lucide-react';

// Available slippage options
const SLIPPAGE_OPTIONS = [0.5, 1, 2, 5, 10];

const ContractInteraction: React.FC = () => {
  // Wallet state
  const { signer, provider, account, isConnected, connectWallet } = useWallet();
  
  // Data states
  const [lpBalance, setLpBalance] = useState<string>('');
  const [estimatedAmounts, setEstimatedAmounts] = useState<{amountA: string, amountB: string} | null>(null);
  const [minAmounts, setMinAmounts] = useState<{amountAMin: string, amountBMin: string} | null>(null);
  const [deadline, setDeadline] = useState<number>(0);
  
  // UI states
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Slippage configuration
  const [slippage, setSlippage] = useState<number>(10); // Default 10% slippage
  const [customSlippage, setCustomSlippage] = useState<string>(''); // For custom slippage input
  const [showCustomSlippage, setShowCustomSlippage] = useState<boolean>(false);

  // Loading states
  const [isClaimingFees, setIsClaimingFees] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isProcessingLiquidity, setIsProcessingLiquidity] = useState<boolean>(false);

  // Check LP balance when account changes
  useEffect(() => {
    if (account && provider && isConnected) {
      checkLpBalance();
    }
  }, [account, provider, isConnected]);

  // Set deadline when needed
  useEffect(() => {
    setDeadline(getDeadlineTimestamp(10)); // 10 minutes from now
  }, []);

  // Check LP balance
  const checkLpBalance = async () => {
    if (!provider || !account) return;

    try {
      const lpTokenContract = getLpTokenContract(provider);
      const balance = await lpTokenContract.balanceOf(account);
      
      setLpBalance(balance.toString());
      
      // If we have a balance, get estimated amounts
      if (balance.toString() !== '0') {
        fetchEstimatedAmounts(balance.toString());
      }
    } catch (error) {
      console.error('Error checking LP balance:', error);
    }
  };

  // Fetch estimated amounts
  const fetchEstimatedAmounts = async (balance: string) => {
    if (!provider) return;

    try {
      const routerContract = getRouterV2Contract(provider);
      
      const estimate = await routerContract.quoteRemoveLiquidity(
        TOKEN_A,
        TOKEN_B,
        true, // stable
        balance
      );
      
      const amountA = estimate[0].toString();
      const amountB = estimate[1].toString();
      
      setEstimatedAmounts({ amountA, amountB });
      
      // Calculate min amounts with slippage
      const amountAMin = calculateAmountWithSlippage(amountA, slippage);
      const amountBMin = calculateAmountWithSlippage(amountB, slippage);
      
      setMinAmounts({ amountAMin, amountBMin });
    } catch (error) {
      console.error('Error fetching estimated amounts:', error);
    }
  };

  // Calculate amount with slippage
  const calculateAmountWithSlippage = (amount: string, slippagePercent: number): string => {
    // Convert to native BigInt for precise math (ethers v6 style)
    const amountBigInt = BigInt(amount);
    
    // Calculate minimum amount with slippage
    // Formula: amount - (amount * slippage / 100)
    const slippageFactor = BigInt(Math.floor(slippagePercent * 100)); // Convert percent to basis points
    const slippageAmount = (amountBigInt * slippageFactor) / BigInt(10000);
    const minAmount = amountBigInt - slippageAmount;
    
    return minAmount.toString();
  };

  // Claim fees
  const handleClaimFees = async () => {
    if (!provider || !signer) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsClaimingFees(true);
      const lpTokenContract = getLpTokenContract(provider, signer);
      
      const tx = await lpTokenContract.claimFees();
      toast.loading('Claiming fees...', { id: 'claim-fees' });
      
      await tx.wait();
      toast.success('Fees claimed successfully!', { id: 'claim-fees' });
      
      // Refresh LP balance
      checkLpBalance();
    } catch (error) {
      console.error('Error claiming fees:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to claim fees',
        { id: 'claim-fees' }
      );
    } finally {
      setIsClaimingFees(false);
    }
  };

  // Approve LP tokens
  const handleApprove = async () => {
    if (!provider || !signer || !lpBalance) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsApproving(true);
      const lpTokenContract = getLpTokenContract(provider, signer);
      
      const tx = await lpTokenContract.approve(ROUTER_V2_CONTRACT, lpBalance);
      toast.loading('Approving LP tokens...', { id: 'approve' });
      
      await tx.wait();
      toast.success('Approval successful!', { id: 'approve' });
      
    } catch (error) {
      console.error('Error approving:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to approve LP tokens',
        { id: 'approve' }
      );
    } finally {
      setIsApproving(false);
    }
  };

  // Remove liquidity
  const handleRemoveLiquidity = async () => {
    if (!provider || !signer || !account || !lpBalance || !minAmounts) {
      toast.error('Please connect your wallet and have LP tokens to remove');
      return;
    }

    try {
      setIsProcessingLiquidity(true);
      const routerContract = getRouterV2Contract(provider, signer);
      
      // Need to refresh deadline to ensure it's in the future
      const currentDeadline = getDeadlineTimestamp(10);
      
      const tx = await routerContract.removeLiquidity(
        TOKEN_A,
        TOKEN_B,
        true, // stable
        lpBalance,
        minAmounts.amountAMin,
        minAmounts.amountBMin,
        account, // to (your wallet address)
        currentDeadline
      );
      
      toast.loading('Removing liquidity...', { id: 'remove-liquidity' });
      await tx.wait();
      
      toast.success('Liquidity removed successfully!', { id: 'remove-liquidity' });
      
      // Reset amounts and check balance again
      setLpBalance('');
      setEstimatedAmounts(null);
      setMinAmounts(null);
      setTimeout(() => checkLpBalance(), 2000);
      
    } catch (error) {
      console.error('Error removing liquidity:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove liquidity',
        { id: 'remove-liquidity' }
      );
    } finally {
      setIsProcessingLiquidity(false);
    }
  };

  // Handle slippage option change
  const handleSlippageChange = (value: number) => {
    setSlippage(value);
    setShowCustomSlippage(false);
    
    // Update min amounts if we have estimates
    if (estimatedAmounts) {
      const amountAMin = calculateAmountWithSlippage(estimatedAmounts.amountA, value);
      const amountBMin = calculateAmountWithSlippage(estimatedAmounts.amountB, value);
      setMinAmounts({ amountAMin, amountBMin });
    }
  };

  // Handle custom slippage input
  const handleCustomSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCustomSlippage(value);
      
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 0 && numValue <= 100) {
        setSlippage(numValue);
        
        // Update min amounts if we have estimates
        if (estimatedAmounts) {
          const amountAMin = calculateAmountWithSlippage(estimatedAmounts.amountA, numValue);
          const amountBMin = calculateAmountWithSlippage(estimatedAmounts.amountB, numValue);
          setMinAmounts({ amountAMin, amountBMin });
        }
      }
    }
  };

  // Format number for display
  const formatNumber = (value: string) => {
    try {
      const num = BigInt(value);
      // For very large numbers, show scientific notation
      if (num > BigInt(1000000000000000)) {
        return (Number(num) / 1e18).toFixed(6);
      }
      return num.toString();
    } catch (e) {
      return value;
    }
  };

  // Debug log to see wallet state
  useEffect(() => {
    console.log("ContractInteraction component wallet state:");
    console.log("Account:", account);
    console.log("IsConnected flag:", isConnected);
    console.log("Provider:", provider ? "Available" : "Not available");
    console.log("Signer:", signer ? "Available" : "Not available");
  }, [account, isConnected, provider, signer]);

  // For debugging - force component to render
  const [forceRender, setForceRender] = useState<number>(0);
  
  // Always show the main UI - don't gate on wallet connection
  // We'll disable buttons as needed instead
  const walletReady = Boolean(account && isConnected);

  return (
    <div className="max-w-md p-6 mx-auto bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Claim Fees & Unpair V2</h2>
        
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center justify-center w-8 h-8 text-gray-600 transition-colors rounded-md hover:bg-gray-100"
        >
          <Settings size={18} />
        </button>
      </div>
      
      {/* LP Information */}
      <div className="p-4 mb-6 border border-gray-200 rounded-lg bg-gray-50">
        {!walletReady ? (
          <div className="py-2 text-center">
            <p className="text-sm text-gray-500">Wallet connection required to view LP balance</p>
            <button
              onClick={connectWallet}
              className="px-4 py-1 mt-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Your LP Balance:</span>
              <span className="font-medium">{lpBalance ? formatNumber(lpBalance) : '0'}</span>
            </div>
            
            {estimatedAmounts && (
              <>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Expected HOG:</span>
                  <span>{formatNumber(estimatedAmounts.amountA)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Expected OS:</span>
                  <span>{formatNumber(estimatedAmounts.amountB)}</span>
                </div>
              </>
            )}
          </>
        )}
      </div>
      
      {/* Slippage Settings */}
      {showSettings && (
        <div className="p-4 mb-6 border border-gray-200 rounded-lg">
          <h3 className="mb-2 text-sm font-medium text-gray-700">Slippage Tolerance</h3>
          
          <div className="flex flex-wrap gap-2 mb-2">
            {SLIPPAGE_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => handleSlippageChange(option)}
                className={`px-3 py-1 text-sm rounded-md ${
                  slippage === option && !showCustomSlippage
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {option}%
              </button>
            ))}
            <button
              onClick={() => setShowCustomSlippage(!showCustomSlippage)}
              className={`px-3 py-1 text-sm rounded-md ${
                showCustomSlippage
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Custom
            </button>
          </div>
          
          {showCustomSlippage && (
            <div className="flex items-center mt-2">
              <input
                type="text"
                value={customSlippage}
                onChange={handleCustomSlippageChange}
                placeholder="0.0"
                className="px-3 py-1 border border-gray-300 rounded-md max-w-[100px] text-right"
              />
              <span className="ml-1 text-sm text-gray-600">%</span>
            </div>
          )}
          
          <div className="mt-2 text-xs text-gray-500">
            Transaction will revert if price changes by more than {slippage}%
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex flex-col gap-4">
        {/* Claim Fees Button */}
        <button
          onClick={handleClaimFees}
          disabled={isClaimingFees || !walletReady}
          className="flex items-center justify-center w-full gap-2 px-4 py-3 text-white transition-colors bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-70"
        >
          {!walletReady ? (
            "Connect Wallet to Claim"
          ) : isClaimingFees ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Claiming Fees...
            </>
          ) : (
            <>Claim Fees</>
          )}
        </button>
        
        {/* Approve Button - only show if we have LP balance */}
        {lpBalance && lpBalance !== '0' && (
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className="flex items-center justify-center w-full gap-2 px-4 py-3 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-70"
          >
            {isApproving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Approving...
              </>
            ) : (
              <>Approve LP Tokens</>
            )}
          </button>
        )}
        
        {/* Remove Liquidity Button - only show if we have LP balance */}
        {lpBalance && lpBalance !== '0' && (
          <button
            onClick={handleRemoveLiquidity}
            disabled={isProcessingLiquidity}
            className="flex items-center justify-center w-full gap-2 px-4 py-3 text-white transition-colors bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-70"
          >
            {isProcessingLiquidity ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Removing Liquidity...
              </>
            ) : (
              <>Remove Liquidity</>
            )}
          </button>
        )}
      </div>
      
      {/* Contract Information */}
      <div className="pt-4 mt-6 border-t border-gray-100">
        <h3 className="flex items-center gap-1 mb-2 text-sm font-medium text-gray-700">
          <Info size={14} />
          Contract Information
        </h3>
        <div className="grid grid-cols-1 gap-1">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">LP Token Contract:</span>
            <span className="font-mono text-xs break-all">{LP_TOKEN_CONTRACT}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Router V2 Contract:</span>
            <span className="font-mono text-xs break-all">{ROUTER_V2_CONTRACT}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractInteraction;
