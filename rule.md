# QUY TẮC LÀM VIỆC (BẮT BUỘC)

> File này phải được đọc ĐẦU TIÊN trước khi thực hiện bất kỳ hành động nào.
> Áp dụng cho dự án **AdFilter Mobile** (Android + iOS), kế thừa từ `rule.md` của dự án AD Block (extension) và bổ sung các quy tắc cho mobile & AI tự cập nhật.

## Quy tắc 1 — Đọc rule.md và history.md đầu tiên
Mỗi lần làm bất cứ việc gì (đọc code, phân tích, sửa code, chạy lệnh, push...),
AI **phải đọc theo thứ tự sau trước tiên**:
1. Đọc file `rule.md` này để nắm quy tắc.
2. Đọc file `history.md` để biết đang ở đâu, rồi tiếp tục cuộc trò chuyện.

Sau mỗi khi hoàn thành một section/ngày, AI **phải cập nhật `history.md`**
(trạng thái hiện tại + nhật ký tiến độ). Nếu chưa có `history.md`, AI đề xuất tạo và chờ đồng ý (Quy tắc 3).

## Quy tắc 2 — Chủ động nhắc push & Hỏi ý kiến trước khi chạy lệnh push
- Mỗi khi hoàn thành xong một ngày/section và đã commit thành công, AI **phải chủ động nhắc nhở người dùng push** code lên GitHub để sao lưu an toàn.
- AI **không được tự ý chạy lệnh `git push` trong nền** mà phải hỏi ý kiến / để người dùng tự gõ lệnh hoặc đồng ý cho AI chạy.

## Quy tắc 3 — Không sửa code khi chưa được đồng ý
AI **không được phép sửa code** nếu chưa hỏi và được người dùng đồng ý.

Khi phát hiện lỗi/sai sót, AI phải:
1. **Nêu ra lỗi** người dùng đang mắc phải (vị trí, nguyên nhân).
2. **Hướng dẫn cách sửa** cụ thể.
3. **Chờ người dùng đồng ý** rồi mới được sửa code.

> Tuyệt đối không tự ý chỉnh sửa, xóa, tạo file, hay chạy lệnh thay đổi hệ thống
> khi chưa có sự đồng ý rõ ràng từ người dùng.

## Quy tắc 4 — Tự động cung cấp Title & Description khi mở Pull Request (PR)
- Vào ngày cuối tuần hoặc mỗi khi đến bước mở Pull Request để merge code vào `main`, AI **bắt buộc phải chủ động soạn sẵn và cung cấp cả hai thông tin**:
  1. **Tiêu đề PR (Title):** Ngắn gọn, chuẩn Conventional Commits (ví dụ: `feat: ... (Week X)`).
  2. **Nội dung mô tả (Description):** Định dạng Markdown chuyên nghiệp, có checklist tóm tắt toàn bộ tính năng và bài test đã hoàn thành trong tuần để người dùng chỉ cần copy-paste vào GitHub.

## Quy tắc 5 — Tuyệt đối không bao giờ push trực tiếp lên nhánh `main`
- **Luôn luôn không được push trực tiếp lên nhánh `main`** trong bất kỳ trường hợp nào.
- Mọi tính năng, sửa lỗi (bug fix) hay cập nhật mới **bắt buộc phải được thực hiện trên một nhánh (branch) riêng biệt** (ví dụ: `feat/...`, `fix/...`, `ai/...`).
- Toàn bộ thay đổi phải được đưa vào `main` thông qua quy trình: **Đẩy nhánh riêng lên GitHub -> Mở Pull Request (PR) -> Kiểm tra CI -> Merge vào `main`**.

## Quy tắc 6 — Mỗi bản fix / cập nhật bắt buộc phải nâng lên 1 version mới
- Cứ mỗi đợt sửa lỗi (`fix`) hoặc cập nhật tính năng trên nhánh mới (sau khi nhánh trước đã merge vào `main`), AI **bắt buộc phải tự động nâng số hiệu phiên bản lên 1 version mới** (ví dụ: `1.0.5` -> `1.0.6`...).
- Khi nâng version, AI phải đồng bộ đầy đủ ở tất cả các vị trí:
  1. `package.json` (`"version"`) của core/extension
  2. `apps/mobile/package.json` (`"version"`) — nguồn version chính của app React Native
  3. Android: `versionName` + tăng `versionCode` trong `apps/mobile/android/app/build.gradle`
  4. iOS: `MARKETING_VERSION` + tăng `CURRENT_PROJECT_VERSION` trong `apps/mobile/ios/` (App và mọi extension target phải trùng nhau)
  4. `src/manifest.json` (`"version"`) của extension
  5. `CHANGELOG.md` (thêm mục `## [x.y.z] - YYYY-MM-DD`)
  6. `README.md` (tiêu đề, badge version, tên file gói phát hành và mục trạng thái dự án)
  7. Chạy `pnpm package` và build release Android (`.aab`/`.apk`) / iOS (archive) để xuất gói mới nhất.
- Riêng bản cập nhật **rule pack** (chỉ đổi luật, không đổi code) tăng số `rulesVersion` và ghi vào CHANGELOG.

## Quy tắc 7 — AI tự cập nhật code/luật khi YouTube, Chrome, Android, iOS thay đổi
- AI (Sentinel / agent) **chỉ được đề xuất**, tuyệt đối **không tự merge, không tự phát hành, không tự push `main`**. Mọi đề xuất phải đi qua: nhánh `ai/...` -> PR -> CI xanh -> **người dùng duyệt** -> merge.
- Mọi thay đổi do AI đề xuất phải qua cổng an toàn trước khi mở PR:
  1. Biên dịch được (`compileRuntimeFilters()` / build mobile) và `pnpm verify:all` xanh.
  2. Không nằm trong **danh sách cấm cứng**: `#movie_player`, `video`, `body`, `html`, rule chung không gắn domain, và domain thanh toán/ngân hàng/đăng nhập (allowlist cứng).
  3. Chạy `eval` đạt ngưỡng `precision >= 0.9`, `recall >= 0.9`, không làm giảm điểm so với baseline.
  4. Có test đi kèm cho mỗi thay đổi và mô tả nguyên nhân (DOM/API nào đã đổi).
- Giới hạn tần suất & chi phí: tối đa 1 PR AI mỗi domain/ngày; ghi lại prompt/phản hồi (không chứa dữ liệu người dùng) vào log CI. Khóa API chỉ nằm trong GitHub Secrets / `.env` không commit.
- Khi AI không chắc chắn hoặc thay đổi chạm vào code lõi (VPN, Network Extension, thanh toán), phải dừng và hỏi người dùng.

## Quy tắc 8 — Quyền riêng tư & tuân thủ cửa hàng (Play Store / App Store)
- **Không thu thập dữ liệu duyệt web/DNS của người dùng ra khỏi thiết bị.** Mọi thống kê xử lý cục bộ; telemetry/crash chỉ khi người dùng **chủ động bật (opt-in)** và ẩn danh.
- **Không MITM / không cài chứng chỉ root** để giải mã HTTPS.
- Mọi thay đổi về quyền (permission), `VpnService`, Network Extension, entitlement phải cập nhật `PRIVACY.md`, Data Safety (Google) và App Privacy Labels (Apple) **trong cùng PR**.
- Không quảng bá/ghi mô tả vượt quá khả năng thực tế (ví dụ "chặn mọi quảng cáo trong mọi app"). Nội dung store phải khớp tính năng thật.
- Không commit khóa ký (`*.jks`, `*.p12`, `*.mobileprovision`), `.env`, token, API key. Kiểm tra bằng secret scanning trước khi push.

## Quy tắc 9 — Chất lượng & cổng kiểm thử bắt buộc
- **Ngôn ngữ chính: TypeScript (`strict`) + React Native (bare).** Không thêm file `.js` mới trong `apps/mobile` và `packages/` (trừ file cấu hình bắt buộc); native chỉ dùng Kotlin/Swift cho `VpnService`, Content Blocker, Safari Web Extension, DNS Settings.
- Trước mỗi commit hoàn thành ngày/section: chạy test liên quan; trước PR phải xanh: `pnpm verify:all` + `pnpm -F mobile tsc --noEmit` + `pnpm -F mobile lint` + `pnpm -F mobile test` (jest) + Android (`./gradlew test lint` trong `apps/mobile/android`) + iOS (`xcodebuild test`).
- Mỗi lỗi sửa xong phải có test hồi quy (regression) đi kèm.
- Phải kiểm tra không chặn nhầm trang quan trọng (ngân hàng, thanh toán, đăng nhập) trước khi phát hành bản rule/app mới.
- Phát hành lên store theo **staged rollout** (10% -> 50% -> 100%), có kế hoạch rollback; không phát hành vào thứ Sáu hoặc cuối tuần trừ khi sửa lỗi khẩn.

## Quy tắc 10 — Giao tiếp & tài liệu
- Trả lời bằng **tiếng Việt**, ngắn gọn, nêu rõ file/vị trí bị ảnh hưởng.
- Mỗi quyết định kiến trúc quan trọng ghi vào `docs/decisions/NNNN-ten-quyet-dinh.md` (sau khi người dùng đồng ý tạo).
- Mỗi cuối ngày AI tóm tắt: đã làm gì, test nào đã chạy, việc ngày mai.
