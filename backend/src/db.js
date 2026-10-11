// backend/src/db.js
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// 确保数据目录存在
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');

// ==================== 建表 ====================
db.exec(`
  -- 版权存证表
  CREATE TABLE IF NOT EXISTS copyrights (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    copyright_id    TEXT UNIQUE NOT NULL,          -- 业务ID（UUID）
    image_hash      TEXT NOT NULL,                 -- 原图 SHA-256
    watermarked_hash TEXT NOT NULL,                -- 水印图 SHA-256
    fingerprint     TEXT NOT NULL,                 -- 感知哈希指纹
    image_cid       TEXT NOT NULL,                 -- 原图 IPFS CID
    watermarked_cid TEXT NOT NULL,                 -- 水印图 IPFS CID
    metadata_cid    TEXT,                          -- 元数据 IPFS CID
    owner_address   TEXT NOT NULL,                 -- 版权所有者钱包地址
    tx_hash         TEXT,                          -- 链上交易哈希
    tianping_cert_id TEXT,                         -- 天平链存证编号
    watermark_payload TEXT,                        -- 嵌入的水印文本
    created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
    status          TEXT NOT NULL DEFAULT 'registered'  -- registered / revoked
  );

  -- 原创承诺书签署记录表
  CREATE TABLE IF NOT EXISTS agreements (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_address TEXT NOT NULL,
    agreement_hash  TEXT NOT NULL,                 -- 承诺书文本哈希
    signature       TEXT NOT NULL,                 -- 钱包签名
    tx_hash         TEXT,                          -- 链上交易哈希
    signed_at       INTEGER NOT NULL DEFAULT (unixepoch())
  );

  -- AI 检测记录表
  CREATE TABLE IF NOT EXISTS detections (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    copyright_id    TEXT,                          -- 关联的版权ID（可为空）
    image_hash      TEXT NOT NULL,                 -- 被检测图片哈希
    is_aigenerated  INTEGER NOT NULL DEFAULT 0,    -- 0/1
    confidence      REAL NOT NULL DEFAULT 0,       -- 0-1
    c2pa_detected   INTEGER NOT NULL DEFAULT 0,    -- 是否检测到 C2PA
    c2pa_data       TEXT,                          -- C2PA 原始 JSON
    detection_detail TEXT,                         -- 详细结果 JSON
    tx_hash         TEXT,                          -- 链上记录交易哈希
    created_at      INTEGER NOT NULL DEFAULT (unixepoch())
  );

  -- 索引
  CREATE INDEX IF NOT EXISTS idx_copyrights_image_hash ON copyrights(image_hash);
  CREATE INDEX IF NOT EXISTS idx_copyrights_owner ON copyrights(owner_address);
  CREATE INDEX IF NOT EXISTS idx_detections_image_hash ON detections(image_hash);
`);

module.exports = db;