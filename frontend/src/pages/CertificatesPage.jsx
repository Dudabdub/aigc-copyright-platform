import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, BadgeCheck, Copy, FileImage, LoaderCircle, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { getReportUrl, listCopyrights } from '../services/api.js';
import { getErrorMessage, formatDate, normalizeCopyright, shortAddress, shortHash } from '../utils/format.js';

export default function CertificatesPage({ wallet, initialRecord, onToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    if (!wallet.account) { setItems(initialRecord ? [normalizeCopyright(initialRecord)] : []); return; }
    setLoading(true); setError('');
    try {
      const result = await listCopyrights(wallet.account);
      const rows = (result.data || []).map(normalizeCopyright);
      const merged = initialRecord ? [normalizeCopyright(initialRecord), ...rows] : rows;
      const unique = new Map();
      merged.forEach((item) => unique.set(item.copyrightId || item.imageHash, item));
      setItems([...unique.values()].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)));
    } catch (e) {
      setError(getErrorMessage(e));
      setItems(initialRecord ? [normalizeCopyright(initialRecord)] : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.account, initialRecord]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => [item.copyrightId, item.imageHash, item.ownerAddress, item.txHash, item.tianpingCertId].some((v) => String(v || '').toLowerCase().includes(term)));
  }, [items, query]);

  const copy = async (value) => {
    if (!value) return;
    try { await navigator.clipboard.writeText(value); onToast('已复制到剪贴板。', 'success'); }
    catch { onToast('复制失败，请手动选择文本。', 'error'); }
  };

  return <div className="page-enter">
    <div className="page-title-row"><div><div className="section-kicker">YOUR PROVENANCE</div><h1>我的存证证书</h1><p>集中管理你的作品登记信息、交易标识及取证报告。</p></div><div className="page-title-icon page-icon-green"><BadgeCheck size={27} /></div></div>
    {!wallet.account && <div className="inline-alert alert-info"><ShieldCheck size={18} /><div><strong>尚未连接钱包</strong><span>当前仅显示本次会话中创建的记录。连接登记时使用的钱包后，可以查询后端记录。</span></div></div>}
    {error && <div className="inline-alert alert-error"><ShieldCheck size={18} /><div><strong>记录加载未完成</strong><span>{error}</span></div></div>}
    <div className="certificate-toolbar"><div className="certificate-count"><strong>{items.length.toString().padStart(2, '0')}</strong><span>条存证记录</span></div><div className="certificate-tools"><label className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索编号、哈希或钱包地址" /></label><button className="button button-light" onClick={load} disabled={loading}>{loading ? <LoaderCircle size={16} className="spin" /> : <RefreshCw size={16} />} 刷新</button></div></div>
    {loading && items.length === 0 ? <div className="loading-block"><LoaderCircle className="spin" size={24} />正在加载存证记录…</div> : filtered.length === 0 ? <div className="empty-state certificates-empty"><div className="empty-symbol"><FileImage size={24} /></div><strong>{query ? '没有匹配的记录' : '还没有存证证书'}</strong><span>{query ? '请尝试其他编号、哈希或钱包地址。' : '完成原创图片存证后，证书会自动出现在这里。'}</span></div> : <div className="certificate-grid">{filtered.map((item, index) => <article className="certificate-card" key={item.copyrightId || item.imageHash || index}><div className="certificate-card-top"><div className="certificate-symbol"><FileImage size={21} /></div><span className="badge badge-success"><i /> 已登记</span></div><div className="certificate-name">{item.copyrightId || `作品存证 #${filtered.length - index}`}</div><div className="certificate-date">登记于 {formatDate(item.createdAt)}</div><div className="certificate-divider" /><div className="certificate-field"><span>原图 SHA-256</span><div><code title={item.imageHash}>{shortHash(item.imageHash, 16, 8)}</code><button className="tiny-icon-button" onClick={() => copy(item.imageHash)} title="复制哈希"><Copy size={14} /></button></div></div><div className="certificate-field"><span>版权所有者</span><div><code title={item.ownerAddress}>{shortAddress(item.ownerAddress)}</code><button className="tiny-icon-button" onClick={() => copy(item.ownerAddress)} title="复制地址"><Copy size={14} /></button></div></div><div className="certificate-field"><span>链上交易</span><div><code title={item.txHash}>{shortHash(item.txHash, 15, 7)}</code>{item.txHash && <button className="tiny-icon-button" onClick={() => copy(item.txHash)} title="复制交易哈希"><Copy size={14} /></button>}</div></div>{item.tianpingCertId && <div className="certificate-field"><span>天平链存证编号</span><div><code>{item.tianpingCertId}</code></div></div>}<div className="certificate-card-actions"><a className="button button-light" href={getReportUrl(item.copyrightId)} target="_blank" rel="noreferrer"><ArrowDownToLine size={16} /> 取证报告</a><button className="button button-outline" onClick={() => copy(JSON.stringify(item, null, 2))}><Copy size={15} /> 复制详情</button></div>{item.imageCid && <a className="cid-link" href={`https://ipfs.io/ipfs/${encodeURIComponent(item.imageCid)}`} target="_blank" rel="noreferrer">查看 IPFS 内容 <ArrowUpRight size={13} /></a>}</article>)}</div>}
    <div className="legal-note"><ShieldCheck size={16} /><span>列表内容以业务后端返回为准。只有在官方天平链接口成功返回并经核验时，才应将编号标注为真实天平链存证编号。</span></div>
  </div>;
}
