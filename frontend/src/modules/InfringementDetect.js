import React, { useState } from 'react';
import { verifyCopyright, detectAI, verifySimilar } from '../services/api';

function InfringementDetect() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [aiResult, setAiResult] = useState(null);
    const [similarResult, setSimilarResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFile = (f) => {
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setResult(null);
        setAiResult(null);
        setSimilarResult(null);
        setError(null);
    };

    const handleDetect = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);

        try {
            const [verifyRes, aiRes, similarRes] = await Promise.allSettled([
                verifyCopyright(file),
                detectAI(file),
                verifySimilar(file),
            ]);

            if (verifyRes.status === 'fulfilled') setResult(verifyRes.value);
            else setError('版权验证失败: ' + verifyRes.reason?.message);

            if (aiRes.status === 'fulfilled') setAiResult(aiRes.value);
            if (similarRes.status === 'fulfilled') setSimilarResult(similarRes.value);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h3 className="card-title">🔍 侵权检测</h3>
            <p className="text-secondary">上传图片进行版权验证、AI 生成检测和相似图片检索</p>

            <div className="upload-area" style={{ marginTop: '16px' }}>
                <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => handleFile(e.target.files[0])}
                    id="detect-file-input"
                    style={{ display: 'none' }}
                />
                <label htmlFor="detect-file-input" className="upload-label">
                    {preview ? (
                        <img src={preview} alt="预览" className="preview-img" />
                    ) : (
                        <div className="upload-placeholder">
                            <span className="upload-icon">+</span>
                            <p className="text-secondary">点击或拖拽待检测图片</p>
                        </div>
                    )}
                </label>
            </div>

            <button
                className="btn btn-primary btn-block"
                onClick={handleDetect}
                disabled={!file || loading}
                style={{ marginTop: '16px' }}
            >
                {loading ? '检测中...' : '开始检测'}
            </button>

            {error && <p className="alert alert-error" style={{ marginTop: '12px' }}>{error}</p>}

            {result && (
                <div className={`alert ${result.valid ? 'alert-success' : 'alert-warning'}`} style={{ marginTop: '16px' }}>
                    <p style={{ fontWeight: 600 }}>{result.valid ? '✅ 该图片已注册版权' : '⚠️ 未找到版权存证记录'}</p>
                    {result.valid && (
                        <div style={{ marginTop: '8px', fontSize: '13px' }}>
                            <p><span className="text-muted">版权所有者：</span><span className="code-block">{result.owner}</span></p>
                            <p><span className="text-muted">存证编号：</span>{result.copyrightId || '—'}</p>
                        </div>
                    )}
                </div>
            )}

            {aiResult && (
                <div className={`alert ${aiResult.detection?.isAIGenerated ? 'alert-warning' : 'alert-success'}`} style={{ marginTop: '12px' }}>
                    <p style={{ fontWeight: 600 }}>
                        {aiResult.detection?.isAIGenerated ? '⚠️ 疑似 AI 生成' : '✅ 未检测到 AI 生成特征'}
                    </p>
                    <p className="text-muted" style={{ fontSize: '13px' }}>
                        置信度：{((aiResult.detection?.confidence || 0) * 100).toFixed(1)}%
                        {aiResult.detection?.c2paData && ' · 检测到 C2PA 清单'}
                    </p>
                </div>
            )}

            {similarResult && similarResult.similarCount > 0 && (
                <div className="alert alert-warning" style={{ marginTop: '12px' }}>
                    <p style={{ fontWeight: 600 }}>⚠️ 发现 {similarResult.similarCount} 张相似图片</p>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '13px' }}>
                        {similarResult.similar.slice(0, 5).map((s, i) => (
                            <li key={i}>
                                相似度：{(s.similarity * 100).toFixed(1)}% · 证书编号：<span className="code-block">{s.copyright_id}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default InfringementDetect;