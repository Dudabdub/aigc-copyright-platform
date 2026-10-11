import { CheckCircle2, ChevronDown, Wallet } from 'lucide-react';
import { shortAddress } from '../utils/format';

export default function WalletButton({ wallet }) {
  if (!wallet.account) {
    return (
      <button className="button button-dark wallet-button" onClick={wallet.connect} disabled={wallet.connecting}>
        <Wallet size={17} /> {wallet.connecting ? '连接中…' : '连接钱包'}
      </button>
    );
  }
  return (
    <div className="wallet-status" title={wallet.account}>
      <span className="wallet-live"><CheckCircle2 size={16} /></span>
      <span className="wallet-address">{shortAddress(wallet.account)}</span>
      <span className="chain-pill">{wallet.chainId === 31337 ? 'Hardhat' : `Chain ${wallet.chainId}`}</span>
      <ChevronDown size={14} className="muted-icon" />
    </div>
  );
}
