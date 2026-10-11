import { useState } from 'react';
import { Check, CheckCircle2, ChevronRight, FileCheck2, Fingerprint, LoaderCircle, LockKeyhole, PenLine, ShieldCheck, UploadCloud } from 'lucide-react';
import { keccak256, toUtf8Bytes } from 'ethers';
import ImagePicker from '../components/ImagePicker.jsx';
import { registerCopyright, signAgreement, uploadImage } from '../services/api.js';
import { getErrorMessage, shortHash } from '../utils/format.js';

const AGREEMENT_TEXT = `原创承诺书\n\n本人声明，本人通过本平台存证的图片作品系本人独立创作完成，或本人已获得合法授权。本人保证该作品不侵犯任何第三方的知识产权或其他合法权益。\n\n本人理解并同意，本承诺书的文本哈希值和数字签名将作为作品存证流程的组成部分。本平台的技术存证不替代法定版权登记，也不保证争议中的证据必然被采信。如有虚假陈述，本人愿意依法承担相应责任。\n\n请在确认内容后使用钱包签名。签名用于证明签署意愿，不会授权平台转移钱包资产。`;

function bytes32(value) {
  if (typeof value !== 'string' || !/^0x[\da-fA-F]+$/.test(value)) return value;
  const hex = value.slice(2);
  if (hex.length > 64) throw new Error('指纹长度超过 bytes32。');
  return `0x${hex.padStart(64, '0')}`;
}

export default function RegisterPage({ wallet, onToast, onRegistered }) {
  const [agreed, setAgreed] = useState(false);
  const [signed, setSigned] = useState(false);
  const [agreementResult, setAgreementResult] = useState(null);
  const [file, setFile] = useState(null);
  const [busyStep, setBusyStep] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [registerResult, setRegisterResult] = useState(null);
  const [error, setError] = useState('');

  const handleSign = async () => {
    if (!wallet.account || !wallet.signer) return onToast('请先连接钱包。', 'error');
    if (!agreed) return onToast('请阅读并勾选原创承诺书。', 'error');
    setBusy(true); setBusyStep('正在请求钱包签名…'); setError('');
    try {
      const agreementHash = keccak256(toUtf8Bytes(AGREEMENT_TEXT));
      // 用 signMessage 显示完整签署文本；后端记录相同文本的 keccak256 哈希。
      const signature = await wallet.signer.signMessage(AGREEMENT_TEXT);
      const result = await signAgreement(wallet.account, AGREEMENT_TEXT, signature);
      setAgreementResult({ ...result, agreementHash });
      setSigned(true);
      onToast('原创承诺书签署请求已完成。', 'success');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally { setBusy(false); setBusyStep(''); }
  };

  const handleRegister = async () => {
    if (!wallet.account) return onToast('请先连接钱包。', 'error');
    if (!signed) return onToast('请先签署原创承诺书。', 'error');
    if (!file) return onToast('请先选择需要存证的图片。', 'error');
    setBusy(true); setError(''); setRegisterResult(null); setUploadResult(null);
    try {
      setBusyStep('01 / 03 · 计算哈希并生成水印');
      const upload = await uploadImage(file, wallet.account);
      setUploadResult(upload);
      setBusyStep('02 / 03 · 图片与元数据上传完成');
      const payload = {
        imageHash: upload.imageHash,
        watermarkedHash: upload.watermarkedHash,
        fingerprint: bytes32(upload.fingerprint),
        imageCid: upload.imageCid,
        watermarkedCid: upload.watermarkedCid,
        metadataCid: upload.metadataCid,
        ownerAddress: wallet.account,
        watermarkPayload: upload.watermarkPayload,
      };
      setBusyStep('03 / 03 · 正在提交版权存证');
      const result = await registerCopyright(payload);
      const complete = { ...result, ...upload, ownerAddress: wallet.account, createdAt: Math.floor(Date.now() / 1000) };
      setRegisterResult(complete);
      onRegistered?.(complete);
      onToast('图片存证流程已完成。', 'success');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally { setBusy(false); setBusyStep(''); }
  };

  return (
    <div className="page-enter">
      <div className="page-title-row"><div><div className="section-kicker">CREATE A PROOF</div><h1>原创图片存证</h1><p>签署创作承诺，生成水印与内容指纹，登记可验证的存证记录。</p></div><div className="page-title-icon"><Fingerprint size={27} /></div></div>
      {!wallet.account && <div className="inline-alert alert-info"><LockKeyhole size={18} /><div><strong>先连接创作者钱包</strong><span>签署与作品登记均会绑定当前钱包地址。</span></div></div>}
      <div className="steps-track"><div className={`step-node ${signed ? 'step-done' : 'step-current'}`}><span>{signed ? <Check size={15} /> : '01'}</span><div><strong>签署承诺</strong><small>确认原创声明</small></div></div><div className={`step-line ${signed ? 'line-done' : ''}`} /><div className={`step-node ${signed && !registerResult ? 'step-current' : registerResult ? 'step-done' : ''}`}><span>{registerResult ? <Check size={15} /> : '02'}</span><div><strong>上传作品</strong><small>水印与哈希</small></div></div><div className={`step-line ${registerResult ? 'line-done' : ''}`} /><div className={`step-node ${registerResult ? 'step-done' : ''}`}><span>{registerResult ? <Check size={15} /> : '03'}</span><div><strong>完成存证</strong><small>生成证书记录</small></div></div></div>

      <section className="content-card agreement-card">
        <div className="card-title-row"><div className="card-title-icon lavender"><PenLine size={20} /></div><div><h2>第一步 · 原创承诺书</h2><p>请确认声明内容，再通过钱包签名。</p></div>{signed && <span className="badge badge-success card-title-status"><CheckCircle2 size={14} /> 已签署</span>}</div>
        <div className="agreement-paper"><div className="paper-header"><span>墨证 · 原创承诺书</span><span>MOZHENG / AGREEMENT</span></div>{AGREEMENT_TEXT.split('\n').map((line, idx) => line ? <p key={idx}>{line}</p> : <div key={idx} className="paper-spacer" />)}<div className="paper-footer"><span>协议摘要哈希</span><code>{shortHash(keccak256(toUtf8Bytes(AGREEMENT_TEXT)), 15, 10)}</code></div></div>
        {!signed ? <><label className="check-row"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /><span>我已阅读并理解上述承诺书，确认声明内容真实，并同意使用当前钱包签名。</span></label><button className="button button-primary" onClick={handleSign} disabled={busy || !wallet.account || !agreed}>{busy ? <LoaderCircle className="spin" size={17} /> : <PenLine size={17} />}{busy ? busyStep : '使用钱包签署承诺书'}</button></> : <div className="signed-info"><CheckCircle2 size={19} /><div><strong>承诺书签署完成</strong><span>{agreementResult?.txHash ? `交易哈希：${shortHash(agreementResult.txHash)}` : `协议哈希：${shortHash(agreementResult?.agreementHash)}`}</span></div></div>}
      </section>

      <section className={`content-card ${!signed ? 'card-muted' : ''}`}>
        <div className="card-title-row"><div className="card-title-icon mint"><UploadCloud size={20} /></div><div><h2>第二步 · 上传作品文件</h2><p>系统会计算文件哈希、生成水印并上传 IPFS。</p></div></div>
        <ImagePicker file={file} onChange={(next) => { setFile(next); setUploadResult(null); setRegisterResult(null); setError(''); }} title="将原创图片拖到这里" description="也可以点击下方按钮，从设备中选择图片" />
        {uploadResult && <div className="data-preview"><div className="data-preview-title"><CheckCircle2 size={16} /> 图片处理完成</div><div className="data-row"><span>原图 SHA-256</span><code>{shortHash(uploadResult.imageHash, 14, 9)}</code></div><div className="data-row"><span>水印图 SHA-256</span><code>{shortHash(uploadResult.watermarkedHash, 14, 9)}</code></div><div className="data-row"><span>原图 IPFS CID</span><code>{shortHash(uploadResult.imageCid, 14, 9)}</code></div><div className="data-row"><span>水印图 IPFS CID</span><code>{shortHash(uploadResult.watermarkedCid, 14, 9)}</code></div></div>}
        {error && <div className="inline-alert alert-error"><ShieldCheck size={18} /><div><strong>操作未完成</strong><span>{error}</span></div></div>}
        <div className="register-actions"><div className="small-note"><ShieldCheck size={15} /> 钱包地址将作为作品登记的所有者信息。</div><button className="button button-primary" onClick={handleRegister} disabled={busy || !signed || !file || !wallet.account}>{busy ? <LoaderCircle className="spin" size={17} /> : <ChevronRight size={17} />}{busy ? busyStep : '上传并登记版权'}</button></div>
        {registerResult && <div className="success-panel"><div className="success-icon"><CheckCircle2 size={22} /></div><div className="success-copy"><strong>存证流程完成</strong><span>记录编号：{registerResult.copyrightId || '已返回存证结果'}</span><span>交易哈希：{shortHash(registerResult.txHash)}</span>{registerResult.tianpingCertId && <span>天平链存证编号：{registerResult.tianpingCertId}</span>}<button className="text-button" onClick={() => onRegistered?.(registerResult)}>查看证书记录 <ChevronRight size={15} /></button></div></div>}
        {!signed && <div className="locked-hint"><LockKeyhole size={14} /> 请先完成第一步签署承诺书，再进行作品登记。</div>}
      </section>
      <div className="legal-note"><ShieldCheck size={16} /><span>说明：本前端不会展示钱包私钥。签署的承诺内容仅作为技术记录之一，不等同于专业法律意见或法定版权登记。</span></div>
    </div>
  );
}
