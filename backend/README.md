# Backend integration point

把现有 Node.js + Express 后端实现迁移到这里，目录建议参见 `../docs/PROJECT_STRUCTURE.md`。本交付重点是完整前端源码，不包含二次复制的后端实现。

前端所需的 API 路径及数据字段见 `../docs/API_CONTRACT.md`。本地启动后端默认监听 `3001` 端口。

安全要求：真实密钥通过部署环境注入；不要提交 `.env`、上传图片、SQLite 数据文件、IPFS 凭据或生产私钥。
