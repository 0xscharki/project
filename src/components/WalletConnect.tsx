import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { Wallet, LogOut, AlertCircle, CheckCircle2 } from 'lucide-react';

const WalletConnect: React.FC = () => {
  const { 
    account, 
    isConnected, 
    isConnecting, 
    connectWallet, 
    disconnectWallet, 
    isSonicNetwork, 
    chainId 
  } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="flex items-center gap-3">
      {/* Network status indicator */}
      {isConnected && (
        <div className="items-center hidden gap-1 md:flex">
          {isSonicNetwork ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 size={16} />
              <span className="text-xs font-medium">Sonic Network</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-500" title="Please switch to Sonic Network">
              <AlertCircle size={16} />
              <span className="text-xs font-medium">Wrong Network</span>
            </div>
          )}
        </div>
      )}
      
      {isConnected && account ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{formatAddress(account)}</span>
          <button
            onClick={disconnectWallet}
            className="flex items-center gap-1 px-3 py-1 text-sm text-white transition-colors bg-red-500 rounded-md hover:bg-red-600"
          >
            <LogOut size={16} />
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-70"
        >
          <Wallet size={18} />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
