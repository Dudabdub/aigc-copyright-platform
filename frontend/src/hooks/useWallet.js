import { useCallback, useEffect, useState } from 'react';
import { BrowserProvider } from 'ethers';

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState('');

  const refreshWallet = useCallback(async (requestAccess = false) => {
    if (!window.ethereum) {
      setWalletError('未检测到 EVM 钱包，请安装 MetaMask 或兼容钱包。');
      return null;
    }
    setConnecting(true);
    setWalletError('');
    try {
      const accounts = await window.ethereum.request({
        method: requestAccess ? 'eth_requestAccounts' : 'eth_accounts',
      });
      if (!accounts?.length) {
        setAccount(null);
        setSigner(null);
        setProvider(new BrowserProvider(window.ethereum));
        const network = await new BrowserProvider(window.ethereum).getNetwork();
        setChainId(Number(network.chainId));
        return null;
      }
      const browserProvider = new BrowserProvider(window.ethereum);
      const nextSigner = await browserProvider.getSigner(accounts[0]);
      const network = await browserProvider.getNetwork();
      setProvider(browserProvider);
      setSigner(nextSigner);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      return accounts[0];
    } catch (error) {
      setWalletError(error?.code === 4001 ? '你取消了钱包连接请求。' : (error.message || '连接钱包失败。'));
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const connect = useCallback(() => refreshWallet(true), [refreshWallet]);

  useEffect(() => {
    if (!window.ethereum) return undefined;
    refreshWallet(false);
    const onAccountsChanged = (accounts) => {
      if (!accounts?.length) {
        setAccount(null);
        setSigner(null);
      } else {
        refreshWallet(false);
      }
    };
    const onChainChanged = () => refreshWallet(false);
    window.ethereum.on?.('accountsChanged', onAccountsChanged);
    window.ethereum.on?.('chainChanged', onChainChanged);
    return () => {
      window.ethereum.removeListener?.('accountsChanged', onAccountsChanged);
      window.ethereum.removeListener?.('chainChanged', onChainChanged);
    };
  }, [refreshWallet]);

  return { account, chainId, provider, signer, connecting, walletError, connect };
}
