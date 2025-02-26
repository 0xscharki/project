import React from 'react';
import { Toaster } from 'react-hot-toast';
import ContractInteraction from './components/ContractInteraction';
import { Coins, Info, Twitter } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between max-w-4xl px-4 py-4 mx-auto">
          <div className="flex items-center gap-2">
            <Coins size={24} className="text-purple-600" />
            <h1 className="text-xl font-bold text-gray-800">HOG-OS Liquidity Management</h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl px-4 py-8 mx-auto">
        <div className="mb-8">
          <h2 className="mb-2 text-2xl font-bold text-gray-800">Claim Fees and Unpair V2 Stable LP</h2>
          <p className="text-gray-600">
            Connect your wallet to claim fees and remove liquidity from your V2 Stable HOG-OS LP tokens.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <ContractInteraction />
          
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-full bg-blue-50">
                <Info size={24} className="text-blue-500" />
              </div>
              <div>
                <h2 className="mb-2 text-xl font-semibold">How It Works</h2>
                <p className="mb-3 text-gray-700">
                  This tool helps you claim fees and unpair your V2 Stable HOG-OS LP tokens in just a few simple steps:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="inline-block mr-2">1.</span>
                    <span>Click <strong>Claim Fees</strong> to collect any accumulated swap fees</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block mr-2">2.</span>
                    <span>Click <strong>Approve LP Tokens</strong> to authorize the router contract</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block mr-2">3.</span>
                    <span>Click <strong>Remove Liquidity</strong> to convert your LP tokens back to HOG and OS</span>
                  </li>
                </ul>
                <p className="mt-3 text-sm text-blue-700">
                  Make sure you're connected to the Sonic Network before proceeding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-6 mt-12 text-gray-300 bg-gray-800">
      <a 
              href="https://x.com/thesharketh" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-full hover:bg-blue-700"
            >
              <Twitter size={16} />
              Follow @thesharketh on X
            </a>

        <div className="max-w-4xl px-4 mx-auto text-center">

          <p className="mb-3 text-sm">
            This dApp allows you to claim fees and unpair your V2 Stable HOG-OS LP tokens.
            Always verify contract addresses before approving or sending transactions.
          </p>
          
        </div>
      </footer>
    </div>
  );
}

export default App;
