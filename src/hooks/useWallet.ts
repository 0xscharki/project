import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

// Sonic Network configuration
export const SONIC_CHAIN_ID = 146; // Sonic Chain ID
export const SONIC_HEX_CHAIN_ID = "0x92"; // Hex representation of the chain ID (146 in hex)

interface WalletState {
  provider: ethers.Provider | null;
  signer: ethers.Signer | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  isSonicNetwork: boolean;
}

const initialState: WalletState = {
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  isSonicNetwork: false
};

// Sonic Network parameters
const sonicNetworkParams = {
  chainId: SONIC_HEX_CHAIN_ID,
  chainName: 'Sonic Network',
  nativeCurrency: {
    name: 'Sonic',
    symbol: 'S',
    decimals: 18
  },
  rpcUrls: ['https://rpc.soniclabs.com'],
  blockExplorerUrls: ['https://sonicscan.org/']
};

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>(initialState);

  const resetWalletState = () => {
    setWalletState(initialState);
  };

  // Function to switch to Sonic Network
  const switchToSonicNetwork = useCallback(async () => {
    if (!window.ethereum) return false;
    
    try {
      // Try to switch to the Sonic network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SONIC_HEX_CHAIN_ID }]
      });
      return true;
    } catch (switchError: any) {
      // If the network is not added to the wallet, add it
      if (switchError.code === 4902 || switchError.message.includes('Unrecognized chain')) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [sonicNetworkParams]
          });
          return true;
        } catch (addError) {
          console.error("Error adding Sonic network to wallet:", addError);
          toast.error("Could not add Sonic network to your wallet");
          return false;
        }
      } else {
        console.error("Error switching to Sonic network:", switchError);
        toast.error("Could not switch to Sonic network");
        return false;
      }
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setWalletState(prev => ({
        ...prev,
        error: "No wallet detected. Please install Rabbit Wallet or another web3 wallet."
      }));
      toast.error("No wallet detected. Please install Rabbit Wallet or another web3 wallet.");
      return;
    }

    try {
      setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      
      // Get network information
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);
      const isSonicNetwork = chainId === SONIC_CHAIN_ID;
      
      // If not on Sonic network, try to switch
      if (!isSonicNetwork) {
        toast.loading("Switching to Sonic network...", { id: "network-switch" });
        const switchSuccess = await switchToSonicNetwork();
        
        if (!switchSuccess) {
          toast.error("Please switch to Sonic network manually in your wallet", { id: "network-switch" });
          setWalletState(prev => ({
            ...prev,
            isConnecting: false,
            error: "Please switch to Sonic network to continue"
          }));
          return;
        } else {
          toast.success("Successfully switched to Sonic network", { id: "network-switch" });
          // Get updated chain ID after switch
          const updatedChainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
          const updatedChainId = parseInt(updatedChainIdHex, 16);
          const updatedIsSonicNetwork = updatedChainId === SONIC_CHAIN_ID;
          
          if (!updatedIsSonicNetwork) {
            setWalletState(prev => ({
              ...prev,
              isConnecting: false,
              error: "Failed to switch to Sonic network"
            }));
            return;
          }
        }
      }
      
      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      setWalletState({
        provider,
        signer,
        account,
        chainId,
        isConnected: true,
        isConnecting: false,
        error: null,
        isSonicNetwork: true
      });
      
      toast.success("Wallet connected to Sonic network!");
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error(error instanceof Error ? error.message : "Failed to connect wallet");
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : "Failed to connect wallet"
      }));
    }
  }, [switchToSonicNetwork]);

  const disconnectWallet = useCallback(() => {
    resetWalletState();
  }, []);

  // Handle account and chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        resetWalletState();
      } else if (walletState.account !== accounts[0]) {
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      // Reload when chain changes
      window.location.reload();
    };

    const ethereum = window.ethereum; // Store reference to avoid TypeScript errors
    
    // Add event listeners
    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      // Remove event listeners
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [connectWallet, walletState.account]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
  };
};

// Add Ethereum to the window object type
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, listener: (...args: any[]) => void) => void;
      removeListener: (event: string, listener: (...args: any[]) => void) => void;
      isRabbit?: boolean;
    };
  }
}
