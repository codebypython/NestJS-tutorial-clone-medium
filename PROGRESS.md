# TIẾN ĐỘ DỰ ÁN & CHUYỂN GIAO TRẠNG THÁI (PROJECT PROGRESS)

## Handoff Anchor
- **Active Task:** TASK-02 (Pull Request 2 - Database Migration, Auth Engine, Review Remediation)
- **Current State:** VERIFIED_PASS
- **Active Environment:** Node.js v22.19.0 / NestJS 10.x / MySQL2 / ioredis
- **Target Files:**
  - `src/config/configuration.ts`
  - `src/modules/auth/auth.module.ts`
  - `src/modules/auth/strategies/jwt.strategy.ts`
  - `src/modules/auth/guards/jwt-auth.guard.ts`
  - `src/modules/auth/auth.controller.ts`
  - `src/modules/auth/auth.service.ts`
  - `src/modules/auth/auth.service.spec.ts`
  - `src/modules/redis/redis.service.ts`
  - `src/modules/users/users.service.ts`
  - `src/modules/users/users.service.spec.ts`
  - `src/app.module.ts`
  - `.env.test`
  - `test/auth.e2e-spec.ts`
  - `test/app.e2e-spec.ts`
- **Last Verification:**
  - `npm test`: 4/4 suites passed, 30/30 unit tests passed (exit code: 0)
  - `npm run build`: Nest build successfully compiled (exit code: 0)
  - `npm run lint`: SunLint passed with 0 errors across 37 files (exit code: 0)
  - `git push origin feature/pull-02-auth-migrate-db`: Commit `7ade8eb` pushed cleanly
- **Next Immediate Action:** Chờ Mentor `huongnt-2545` duyệt và merge PR2; sau đó khởi tạo nhánh `feature/pull-03-user-profile-attachments` cho PR3.
- **Blockers / Risks:** None.

---

## Bảng Theo Dõi Nhiệm Vụ (Default-FAIL Contract)

| Task ID | Nhiệm Vụ | Trạng Thái | Lệnh Kiểm Thử Thực Tế | Exit Code | Bằng Chứng / Output Digest | Thời Điểm |
| :--- | :--- | :---: | :--- | :---: | :--- | :--- |
| **TASK-01** | Khởi tạo codebase, Swagger, i18n, SunLint setup (PR1) | [x] PASS | `npm run lint` | `0` | All checks passed · 3.3s | 2026-11-06 17:15 |
| **TASK-02A** | TypeORM Migration thủ công, User Schema, Auth Module (PR2) | [x] PASS | `npm test` | `0` | 4/4 suites, 30/30 tests passed | 2026-11-09 18:30 |
| **TASK-02B** | Khắc phục toàn diện 9 góp ý code review của Mentor PR2 | [x] PASS | `npm run build && npm test && npm run lint` | `0` | 0 errors across 37 files, 30/30 unit tests passed, commit `7ade8eb` pushed | 2026-11-10 14:04 |
| **TASK-03** | Profile Subsystem, Follow/Unfollow, Attachments Upload (PR3) | [ ] FAIL | Chưa chạy | - | Chờ merge PR2 | - |

---

## Nhật Ký Chi Tiết Từng Lượt Chuyển Giao (Handoff Log)
- **[2026-11-10 14:04] [Agent: Antigravity IDE]**:
  - Đã truy cập GitHub PR #2, tổng hợp chi tiết 9 nhận xét của Mentor `huongnt-2545`.
  - Phẫu thuật mã nguồn sửa đổi triệt để 9 lỗi:
    1. Bỏ secret fallback, dùng `getOrThrow`, cấu hình `ConfigurationException`.
    2. Xóa sạch comment giả lập brute-force / rate limit.
    3. Xóa code session thừa và interface trong kiến trúc JWT.
    4. Phân loại lỗi DB: chỉ lỗi trùng lặp trả 422, lỗi hệ thống khác ném `InternalServerErrorException` (500) kèm log chi tiết.
    5. Ngăn chặn Timing Attack bằng `TIMING_SAFE_DUMMY_DIGEST`.
    6. Bắt buộc truyền `token: string` trong `buildUserResponse`.
    7. Xóa phương thức thừa trong `RedisService`.
    8. Dùng `this.userRepository.create({...})` truyền object.
    9. Thiết lập `.env.test`, cô lập môi trường và dọn dẹp dữ liệu ở `afterAll`.
  - Ghi nhận vĩnh viễn Kỷ luật thiết kế vào `D:\Working-kit\harness\30-role-worker-karpathy.md` (Nguyên tắc 5).
