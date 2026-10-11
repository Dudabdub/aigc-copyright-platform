import React, { useState } from 'react';
import { uploadImage, registerCopyright } from '../services/api';

function ImageUpload({ wallet, agreementSigned, onRegistered }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('');
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFile = (f) => {
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setUploadResult(null);
        setError(null);
    };

    const handleUpload = async () => {
        if (!file) return;
        if (!agreementSigned) return alert('请先签署原创承诺书');
        if (!wallet.account) return alert('请先连接钱包');

        setLoading(true);
        setError(null);

        try {
            setStep('正在上传图片并生成盲水印...');
            const uploadRes = await uploadImage(file, wallet.account);
            setUploadResult(uploadRes);

            setStep('正在将版权信息写入区块链...');
            const regRes = await registerCopyright({
                imageHash: uploadRes.imageHash,
                watermarkedHash: uploadRes.watermarkedHash,
                fingerprint: uploadRes.fingerprint,
                imageCid: uploadRes.imageCid,
                watermarkedCid: uploadRes.watermarkedCid,
                metadataCid: uploadRes.metadataCid,
                ownerAddress: wallet.account,
                watermarkPayload: uploadRes.watermarkPayload,
            });

            setStep('版权存证完成！');
            onRegistered({
                ...regRes,
                ...uploadRes,
                ownerAddress: wallet.account,
                createdAt: Math.floor(Date.now() / 1000),
            });
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h3 className="card-title">📤 第二步：上传图片进行版权存证</h3>

            <div className="upload-area">
                <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => handleFile(e.target.files[0])}
                    id="file-input"
                    style={{ display: 'none' }}
                />
                <label htmlFor="file-input" className="upload-label">
                    {preview ? (
                        <img src={preview} alt="预览" className="preview-img" />
                    ) : (
                        <div className="upload-placeholder">
                            <div className="upload-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                            </div>
                            <p className="text-secondary" style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>点击或拖拽图片到这里</p>
                            <p className="text-muted">支持 PNG / JPG / WebP，最大 20MB</p>
                        </div>
                    )}
                </label>
            </div>

            {file && (
                <p className="text-secondary" style={{ marginTop: '12px' }}>
                    已选择：{file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
            )}

            {step && <p className="text-secondary" style={{ marginTop: '12px' }}>{step}</p>}

            {uploadResult && (
                <div className="result-box">
                    <h4>链下哈希信息</h4>
                    <p><span className="text-muted">原图 SHA-256：</span><span className="code-block">{uploadResult.imageHash}</span></p>
                    <p><span className="text-muted">水印图 SHA-256：</span><span className="code-block">{uploadResult.watermarkedHash}</span></p>
                    <p><span className="text-muted">IPFS CID（原图）：</span><span className="code-block">{uploadResult.imageCid}</span></p>
                    <p><span className="text-muted">IPFS CID（水印图）：</span><span className="code-block">{uploadResult.watermarkedCid}</span></p>
                </div>
            )}

            {error && <p className="alert alert-error" style={{ marginTop: '12px' }}>{error}</p>}

            <button
                className="btn btn-primary btn-block"
                onClick={handleUpload}
                disabled={!file || loading || !agreementSigned}
                style={{ marginTop: '16px' }}
            >
                {loading ? '处理中...' : '上传并存证'}
            </button>
        </div>
    );
}

export default ImageUpload;