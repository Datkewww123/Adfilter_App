# Lịch sử phát triển AdFilter Mobile

## Trạng thái hiện tại
- **Phase:** Hoàn thành Phase 1 (`v0.1.0`) — sẵn sàng chuyển sang Phase 2 (React Native App + Android `VpnService`)
- **Nhánh đang làm việc:** `feat/phase1-core`

## Nhật ký tiến độ
- **Phase 1 - Ngày 1:** Khởi tạo monorepo `pnpm`, cấu hình TypeScript `strict`.
- **Phase 1 - Ngày 2:** Hoàn thành `domainMatcher.ts`, `DomainSet` và allowlist cứng `whitelist.ts`.
- **Phase 1 - Ngày 3:** Hoàn thành `ruleParser.ts` và `adFields.ts`.
- **Phase 1 - Ngày 4:** Hoàn thành state machine `classifier.ts` (debounce + phân loại QC).
- **Phase 1 - Ngày 5:** Hoàn thành bộ biên dịch `compile:mobile` cho Android DNS & iOS Content Blocker.
- **Phase 1 - Ngày 6:** Thiết lập CI `.github/workflows/verify.yml`, `CHANGELOG.md` và `README.md` (`v0.1.0`).
- **Phase 1 - Ngày 7:** Nghiệm thu toàn bộ test & mở PR Phase 1.

## Việc tiếp theo
- Phase 2: Khởi tạo `apps/mobile` (React Native TypeScript) và module Kotlin `AdVpnService` lọc DNS cục bộ trên Android.