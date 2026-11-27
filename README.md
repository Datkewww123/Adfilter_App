# AdFilter Mobile (`v0.1.1`)

![Version](https://img.shields.io/badge/version-0.1.1-blue)

Ứng dụng chặn quảng cáo đa nền tảng **Android & iOS** xây dựng bằng **TypeScript + React Native** (kèm Native `VpnService` trên Android và `Content Blocker` / `Safari Web Extension` trên iOS).

## Trạng thái dự án
- **Phiên bản hiện tại:** `0.1.1` (Hoàn thành Phase 1 — Core Rule Engine & Mobile Compiler)

## Lệnh phát triển
```bash
pnpm install
pnpm verify          # Chạy tsc --noEmit + vitest trên toàn monorepo
pnpm compile:mobile  # Xuất rule cho Android (blocklist.txt) và iOS (blocker-*.json)
```