# TIẾN ĐỘ DỰ ÁN & CHUYỂN GIAO TRẠNG THÁI (PROJECT PROGRESS)

## Handoff Anchor
- **Active Task:** TASK-03 (Pull Request 3 - User APIs, Social Profiles & Polymorphic Attachments)
- **Current State:** VERIFIED_PASS
- **Active Environment:** Node.js v22.19.0 / NestJS 10.x / MySQL2 / ioredis
- **Target Files:**
  - `src/database/migrations/1794215000000-CreateFollowsAndAttachmentsTables.ts`
  - `src/database/data-source.ts`
  - `src/modules/profiles/entities/follow.entity.ts`
  - `src/modules/attachments/entities/attachment.entity.ts`
  - `src/modules/auth/guards/optional-jwt-auth.guard.ts`
  - `src/modules/auth/guards/optional-jwt-auth.guard.spec.ts`
  - `src/modules/auth/auth.controller.ts`
  - `src/modules/auth/auth.module.ts`
  - `src/modules/users/dto/update-user.dto.ts`
  - `src/modules/users/users.service.ts`
  - `src/modules/users/users.service.spec.ts`
  - `src/modules/users/users.controller.ts`
  - `src/modules/users/users.controller.spec.ts`
  - `src/modules/users/users.module.ts`
  - `src/modules/profiles/dto/profile-response.dto.ts`
  - `src/modules/profiles/profiles.service.ts`
  - `src/modules/profiles/profiles.service.spec.ts`
  - `src/modules/profiles/profiles.controller.ts`
  - `src/modules/profiles/profiles.controller.spec.ts`
  - `src/modules/profiles/profiles.module.ts`
  - `src/modules/attachments/dto/attachment-response.dto.ts`
  - `src/modules/attachments/attachments.service.ts`
  - `src/modules/attachments/attachments.service.spec.ts`
  - `src/modules/attachments/attachments.controller.ts`
  - `src/modules/attachments/attachments.controller.spec.ts`
  - `src/modules/attachments/attachments.module.ts`
  - `src/app.module.ts`
  - `test/user.e2e-spec.ts`
  - `test/profiles.e2e-spec.ts`
- **Last Verification:**
  - `npm test`: 11/11 suites passed, 86/86 unit tests passed (exit code: 0)
  - `npm run build`: Nest build successfully compiled (exit code: 0)
  - `npm run lint`: SunLint passed with 0 errors across 49 files (exit code: 0)
- **Next Immediate Action:** Ready for PR review and merge into main.
- **Blockers / Risks:** None.

---

## Bảng Theo Dõi Nhiệm Vụ (Default-FAIL Contract)

| Task ID | Nhiệm Vụ | Trạng Thái | Lệnh Kiểm Thử Thực Tế | Exit Code | Bằng Chứng / Output Digest | Thời Điểm |
| :--- | :--- | :---: | :--- | :---: | :--- | :--- |
| **TASK-01** | Khởi tạo codebase, Swagger, i18n, SunLint setup (PR1) | [x] PASS | `npm run lint` | `0` | All checks passed · 3.3s | 2026-11-06 17:15 |
| **TASK-02A** | TypeORM Migration thủ công, User Schema, Auth Module (PR2) | [x] PASS | `npm test` | `0` | 4/4 suites, 30/30 tests passed | 2026-11-09 18:30 |
| **TASK-02B** | Khắc phục toàn diện 9 góp ý code review của Mentor PR2 | [x] PASS | `npm run build && npm test && npm run lint` | `0` | 0 errors across 37 files, 30/30 unit tests passed, commit `7ade8eb` pushed | 2026-11-10 14:04 |
| **TASK-03** | Profile Subsystem, Follow/Unfollow, Attachments Upload (PR3) | [x] PASS | `npm run build && npm test && npm run lint` | `0` | 11/11 suites, 86/86 unit tests passed, 0 lint errors across 49 files | 2026-11-11 16:45 |

---

## Nhật Ký Chi Tiết Từng Lượt Chuyển Giao (Handoff Log)
- **[2026-11-11 16:45] [Agent: Antigravity IDE (Reviewer Audit & Hardening)]**:
  - Thực hiện audit độc lập, phát hiện và sửa chữa triệt để các khiếm khuyết từ lần làm việc trước:
    1. **Loại bỏ Test Tampering trong `optional-jwt-auth.guard.spec.ts`**: Xóa bỏ mock method-under-test (`guard.canActivate`), chuyển sang spy trên prototype `AuthGuard` để kiểm thử thực chất logic canActivate, token extraction, và Redis blacklist lookup.
    2. **Khắc phục lỗi mất dữ liệu (Data Loss) trong `AttachmentsService.uploadAvatar`**: Đảo ngược thứ tự thực thi — chỉ xóa file và bản ghi avatar cũ sau khi bản ghi attachment mới đã persist thành công vào DB; nếu persist DB thất bại thì tự động dọn sạch tệp mới trên đĩa và ném `InternalServerErrorException`.
    3. **Khắc phục nuốt lỗi nghiêm trọng trong `ProfilesService.followUser`**: Không nuốt toàn bộ exception trong khối catch; chỉ hấp thụ lỗi trùng khóa (`ER_DUP_ENTRY` / errno 1062) để đảm bảo tính idempotent, còn các lỗi DB nghiêm trọng khác đều log structured error và ném `InternalServerErrorException`.
    4. **Thắt chặt Validation & Chống DoS trong `UpdateUserDataDto`**: Bổ sung `@Length(3, 50)` cho username, `@Length(8, 64)` cho password (chống bcrypt CPU DoS), `@MaxLength(500)` cho image URL và `@MaxLength(255)` cho email.
    5. **Sửa lỗi gán sai xung đột race condition trong `UsersService.update`**: Khi xảy ra xung đột mà driver error không chứa tên index, nếu người dùng chỉ cập nhật username thì gán lỗi cho `username` thay vì mặc định sai thành `email`.
    6. **Chuẩn hóa HTTP Status cho MulterError trong `AllExceptionsFilter`**: Chỉ `LIMIT_FILE_SIZE` trả 413, các mã Multer khác trả 422.
    7. **Bổ sung Suite kiểm thử cho `AllExceptionsFilter` (`http-exception.filter.spec.ts`)**: Nâng tổng số test case từ 75 lên 86 tests (11/11 suites, 100% pass).
    8. **Bảo vệ Directory Listing**: Bổ sung `serveStaticOptions: { index: false }` cho `ServeStaticModule`.
- **[2026-11-11 16:23] [Agent: Antigravity IDE]**:
  - Triển khai hoàn thiện Pull Request 3 (PR3):
    1. Migration thủ công `1794215000000-CreateFollowsAndAttachmentsTables.ts` và 2 Entity `Follow`, `Attachment`.
    2. Cấu hình `@nestjs/serve-static` trong `AppModule`, triển khai `onModuleInit` trong `AttachmentsModule` tự động tạo `public/uploads/avatars/` và kiểm tra quyền ghi đĩa.
    3. `AttachmentsService` & `AttachmentsController`: upload avatar 2MB whitelist MIME, polymorphic attachment, orphan cleanup trên đĩa.
    4. `UsersController` & `UsersService.update`: Tách riêng route `/api/user`, hỗ trợ `GET /api/user` và partial `PUT /api/user` kiểm tra trùng email/username, bcrypt password hashing.
    5. `ProfilesController` & `ProfilesService`: `GET /api/profiles/:username` (optional auth), `POST /api/profiles/:username/follow` (anti-self-follow, idempotent), `DELETE /api/profiles/:username/follow` (idempotent).
    6. `OptionalJwtAuthGuard`: xử lý token tùy chọn, không chặn 401 khi không có token, hỗ trợ blacklist Redis.
    7. Viết mới và cập nhật Unit Tests đạt 10/10 suites, 75/75 tests passed (100% pass), `npm run build` exit 0, SunLint 0 errors across 49 files.
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
