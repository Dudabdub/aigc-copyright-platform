import { useState } from 'react';
import { AlertTriangle, BadgeCheck, CheckCircle2, CircleHelp, Fingerprint, LoaderCircle, ScanSearch, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import ImagePicker from '../components/ImagePicker.jsx';
import { detectAI, verifyCopyright, verifySimilar } from '../services/api.js';
import { getErrorMessage, shortHash, formatDate } from '../utils/format.js';

function ResultCard({ title, icon: Icon, status, children }) {
  return <section className={`result-card result-${status || 'neutral'}`}><div className="result-card-head"><div className="result-card-icon"><Icon size={19} /></div><h3>{title}</h3>{status === 'good' ? <span className="badge badge-success">已完成</span> : status === 'warn' ? <span className="badge badge-warning">需关注</span> : <span className="badge badge-neutral">分析结果</span>}</div><div className="result-card-body">{children}</div></section>;
}

export default function DetectPage({ onToast }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleDetect = async () => {
    if (!file) return onToast('请先选择待检测图片。', 'error');
    setBusy(true); setError(''); setResults(null);
    const tasks = await Promise.allSettled([verifyCopyright(file), detectAI(file), verifySimilar(file)]);
    setResults({ copyright: tasks[0], ai: tasks[1], similar: tasks[2] });
    const failures = tasks.filter((task) => task.status === 'rejected').length;
    if (failures === 3) setError('所有检测接口均未成功。请确认后端、IPFS 及其依赖服务正常运行。');
    else if (failures) setError(`${failures} 项检测未能完成，其余结果已展示。`);
    setBusy(false);
  };

  const copyright = results?.copyright?.status === 'fulfilled' ? results.copyright.value : null;
  const ai = results?.ai?.status === 'fulfilled' ? results.ai.value : null;
  const similar = results?.similar?.status === 'fulfilled' ? results.similar.value : null;
  const aiDetection = ai?.detection;
  const foundSimilar = (similar?.similar || []).length > 0;

  return <div className="page-enter">
    <div className="page-title-row"><div><div className="section-kicker">VERIFY & ANALYZE</div><h1>作品版权检测</h1><p>一次提交并行检查版权记录、内容凭证和相似作品线索。</p></div><div className="page-title-icon page-icon-blue"><ScanSearch size={27} /></div></div>
    <div className="detect-layout">
      <section className="content-card detect-upload-card"><div className="card-title-row"><div className="card-title-icon blue"><ScanSearch size={20} /></div><div><h2>选择待检测图片</h2><p>建议使用原始文件，以便获得准确的哈希匹配结果。</p></div></div><ImagePicker file={file} onChange={(next) => { setFile(next); setResults(null); setError(''); }} title="上传待验证图片" description="拖拽图片到此处，或从本地选择" /><div className="detection-checks"><div><ShieldCheck size={17} /><span><strong>版权验证</strong><small>原图哈希与登记记录匹配</small></span></div><div><Sparkles size={17} /><span><strong>AI 内容初筛</strong><small>C2PA 与文件元数据线索</small></span></div><div><Fingerprint size={17} /><span><strong>相似图片检索</strong><small>感知哈希近似匹配</small></span></div></div><button className="button button-primary button-wide" onClick={handleDetect} disabled={!file || busy}>{busy ? <><LoaderCircle size={17} className="spin" /> 正在并行检测…</> : <><ScanSearch size={17} /> 开始综合检测</>}</button><p className="form-footnote">AI 结果属于启发式初筛，不能单独证明图片由 AI 生成或构成侵权。</p></section>
      <div className="result-column"><div className="result-column-title"><div><span className="section-kicker">ANALYSIS REPORT</span><h2>检测结果</h2></div>{results && <span className="badge badge-neutral">本次检测</span>}</div>
        {!results && <div className="empty-state results-empty"><div className="empty-symbol"><CircleHelp size={24} /></div><strong>等待检测任务</strong><span>选择图片并开始检测后，三类分析结果将在此处呈现。</span><div className="empty-lines"><i /><i /><i /></div></div>}
        {error && <div className="inline-alert alert-info"><AlertTriangle size={18} /><div><strong>检测提示</strong><span>{error}</span></div></div>}
        {results && <>
          <ResultCard title="版权存证验证" icon={copyright?.valid ? BadgeCheck : ShieldAlert} status={copyright?.valid ? 'good' : 'warn'}>
            {copyright ? <><div className={`result-callout ${copyright.valid ? 'callout-good' : 'callout-warn'}`}><span className="callout-icon">{copyright.valid ? <CheckCircle2 size={19} /> : <AlertTriangle size={19} />}</span><div><strong>{copyright.valid ? '找到版权存证记录' : '未找到匹配的版权存证'}</strong><span>{copyright.source === 'chain' ? '返回来源：链上验证接口' : copyright.source === 'database' ? '返回来源：业务数据库记录' : '当前系统未返回有效记录'}</span></div></div>{copyright.valid && <><div className="result-kv"><span>作品编号</span><code>{copyright.copyrightId || '—'}</code></div><div className="result-kv"><span>版权所有者</span><code>{copyright.owner || '—'}</code></div><div className="result-kv"><span>存证时间</span><span>{formatDate(copyright.timestamp)}</span></div>{copyright.tianpingCertId && <div className="result-kv"><span>天平链编号</span><code>{copyright.tianpingCertId}</code></div>}</>}{copyright.watermark?.valid && <div className="watermark-found"><Fingerprint size={16} /> 检测到水印：{copyright.watermark.text}</div>}</> : <div className="failure-note">版权验证接口未成功：{getErrorMessage(results.copyright.reason)}</div>}
          </ResultCard>
          <ResultCard title="AI 生成线索初筛" icon={Sparkles} status={aiDetection?.isAIGenerated ? 'warn' : 'neutral'}>
            {ai ? <><div className={`ai-score ${aiDetection?.isAIGenerated ? 'score-warn' : 'score-neutral'}`}><div><span>初筛置信度</span><strong>{((aiDetection?.confidence || 0) * 100).toFixed(1)}<small>%</small></strong></div><div className="score-meter"><span style={{ width: `${Math.min(100, Math.max(0, (aiDetection?.confidence || 0) * 100))}%` }} /></div><p>{aiDetection?.isAIGenerated ? '发现可能与 AI 生成相关的线索' : '当前启发式规则未判定为疑似 AI 生成'}</p></div><div className="result-kv"><span>C2PA 凭证</span><span>{aiDetection?.c2paData ? '检测到清单' : '未检测到清单'}</span></div><div className="result-kv"><span>元数据评分</span><span>{Number(aiDetection?.metadataScore || 0).toFixed(2)}</span></div>{ai.chainTxHash && <div className="result-kv"><span>检测记录交易</span><code>{shortHash(ai.chainTxHash)}</code></div>}<p className="form-footnote">没有 C2PA 清单不代表一定是人类创作；元数据也可能被移除或伪造。</p></> : <div className="failure-note">AI 检测接口未成功：{getErrorMessage(results.ai.reason)}</div>}
          </ResultCard>
          <ResultCard title="相似作品检索" icon={Fingerprint} status={foundSimilar ? 'warn' : 'neutral'}>
            {similar ? <>{foundSimilar ? <div className="similar-summary"><strong>发现 {similar.similarCount ?? similar.similar.length} 条相似线索</strong><span>请结合原图、创作过程及授权信息人工复核。</span></div> : <div className="result-callout callout-good"><span className="callout-icon"><CheckCircle2 size={18} /></span><div><strong>当前数据库中未发现高相似记录</strong><span>这不等于全网不存在相似作品。</span></div></div>}<div className="result-kv"><span>本图指纹</span><code>{shortHash(similar.fingerprint, 14, 8)}</code></div>{(similar.similar || []).map((item, idx) => <div className="similar-row" key={item.copyright_id || idx}><div><strong>{item.copyright_id || '相似作品'}</strong><span>{item.owner_address || '未记录所有者'}</span></div><div className="similar-score"><strong>{((item.similarity || 0) * 100).toFixed(1)}%</strong><span>相似度</span></div></div>)}</> : <div className="failure-note">相似图片接口未成功：{getErrorMessage(results.similar.reason)}</div>}
          </ResultCard>
        </>}
      </div>
    </div>
    <div className="legal-note"><ShieldCheck size={16} /><span>检测结果是技术线索，不自动构成侵权判断。证据留存、授权情况与法律结论需结合具体事实综合评估。</span></div>
  </div>;
}
