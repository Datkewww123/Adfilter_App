# Changelog

Mọi thay đổi đáng chú ý của dự án **AdFilter Mobile** được ghi nhận tại đây.

## [0.1.0] - 2026-11-27

### Added
- Khởi tạo monorepo `pnpm` với TypeScript `strict` (`@adfilter/core`).
- Bộ khớp tên miền (`DomainSet`), loại trừ YouTube và danh sách bảo vệ cứng ngân hàng/thanh toán/SSO (`PROTECTED_DOMAINS`).
- Bộ phân tích luật lọc chuẩn ABP/uBO (`parseFilterLines`), khóa danh sách cấm selector nguy hiểm (`#movie_player`, `video`, `body`, `html`) và hàm `stripAdFields`.
- Máy trạng thái phát hiện & phân loại quảng cáo có debounce (`stepDetector`, `classifyAd`).
- Bộ biên dịch `compile:mobile` xuất danh sách chặn DNS cho Android (`blocklist.txt`) và JSON `WKContentRuleList` cho iOS (`blocker-*.json`).
- Luồng CI GitHub Actions `verify.yml`.