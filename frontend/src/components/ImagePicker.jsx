import { useEffect, useId, useState } from 'react';
import { FileImage, ImagePlus, RotateCcw, UploadCloud } from 'lucide-react';
import { formatBytes } from '../utils/format';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 20 * 1024 * 1024;

export default function ImagePicker({ file, onChange, title = '上传图片', description = '拖拽文件到此处，或点击选择文件', compact = false }) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState('');
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectFile = (candidate) => {
    if (!candidate) return;
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setLocalError('仅支持 PNG、JPG 或 WebP 图片。');
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setLocalError('图片不能超过 20 MB。');
      return;
    }
    setLocalError('');
    onChange(candidate);
  };

  return (
    <div className={`picker-wrap ${compact ? 'picker-compact' : ''}`}>
      <input id={inputId} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ''; }} />
      <label
        htmlFor={inputId}
        className={`image-picker ${dragging ? 'is-dragging' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files?.[0]); }}
      >
        {preview ? <img className="image-preview" src={preview} alt="待处理图片预览" /> : (
          <div className="picker-placeholder">
            <div className="picker-icon"><ImagePlus size={compact ? 22 : 27} /></div>
            <strong>{title}</strong><span>{description}</span>
            <span className="picker-limit">PNG / JPG / WebP · 最大 20 MB</span>
            <span className="button button-light picker-select"><UploadCloud size={15} /> 选择图片</span>
          </div>
        )}
      </label>
      {file && <div className="selected-file"><FileImage size={17} /><div className="selected-file-meta"><strong>{file.name}</strong><span>{formatBytes(file.size)}</span></div><button className="icon-button" onClick={() => onChange(null)} type="button" aria-label="移除图片"><RotateCcw size={16} /></button></div>}
      {localError && <div className="field-error">{localError}</div>}
    </div>
  );
}
