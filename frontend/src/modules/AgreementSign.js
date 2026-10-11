import React, { useState } from 'react';
import { keccak256, toUtf8Bytes } from 'ethers';
import { signAgreement } from '../services/api';

const AGREEMENT_TEXT = `原创承诺书

本人声明，本人通过本平台存证的图片作品系本人独立创作完成，或本人已获得合法授权。本人保证该作品不侵犯任何第三方的知识产权或其他合法权益。

本人理解并同意，本承诺书的哈希值和数字签名将记录在区块链上，作为版权存证的组成部分。如有虚假陈述，本人愿意承担相应的法律责任。

本承诺书自签署之日起生效。`;

function AgreementSign({ wallet, signed, onSigned }) {
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [txHash, setTxHash] = useState(null);

    const handleSign = async () => {
        if (!wallet.signer || !wallet.account) return alert('请先连接钱包');
        setLoading(true);
        try {
            const agreementHash = keccak256(toUtf8Bytes(AGREEMENT_TEXT));
            const signature = await wallet.signer.signMessage(AGREEMENT_TEXT);
            const result = await signAgreement(wallet.account, AGREEMENT_TEXT, signature);
            setTxHash(result.txHash);
            onSigned();
        } catch (err) {
            alert('签署失败: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (signed) {
        return (
            <div className="card alert-success">
                <h3 className="card-title">✅ 原创承诺书已签署</h3>
                {txHash && (
                    <p className="text-muted">
                        交易哈希：<span className="code-block">{txHash}</span>
                    </p>
                )}
                <p className="text-secondary" style={{ marginTop: '8px' }}>
                    您可以继续上传图片进行版权存证。
                </p>
            </div>
        );
    }

    return (
        <div className="card">
            <h3 className="card-title">📋 第一步：签署原创承诺书</h3>

            <div className={`agreement-box ${expanded ? 'expanded' : ''}`}>
                {AGREEMENT_TEXT.split('\n').map((line, i) => (
                    <p key={i}>{line || '\u00A0'}</p>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
                <button
                    className="btn btn-primary"
                    onClick={handleSign}
                    disabled={loading || !wallet.account}
                >
                    {loading ? '签署中...' : '签名并签署'}
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? '收起协议' : '展开完整协议'}
                </button>
            </div>

            {!wallet.account && (
                <p className="text-muted" style={{ marginTop: '12px' }}>
                    请先连接钱包后再签署
                </p>
            )}
        </div>
    );
}

export default AgreementSign;