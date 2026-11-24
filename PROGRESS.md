# TIẾN ĐỘ DỰ ÁN & CHUYỂN GIAO TRẠNG THÁI (PROJECT PROGRESS)

## Handoff Anchor
- **Active Task:** TASK-05B (PR5 Mentor Feedback Resolution & Architectural Hardening)
- **Current State:** VERIFIED_PASS
- **Active Environment:** Node.js v22.19.0 / NestJS 10.x / MySQL2 / ioredis
- **Target Files:**
  - `src/modules/profiles/profiles.service.ts`
  - `src/modules/profiles/profiles.service.spec.ts`
  - `src/modules/profiles/profiles.module.ts`
  - `src/modules/comments/comments.module.ts`
  - `src/modules/comments/comments.repository.ts`
  - `src/modules/comments/comments.repository.spec.ts`
  - `src/modules/comments/comments.service.ts`
  - `src/modules/comments/comments.service.spec.ts`
  - `src/modules/comments/entities/comment.entity.ts`
  - `src/modules/comments/dto/create-comment.dto.ts`
  - `src/modules/comments/dto/comment-dto.spec.ts`
  - `src/database/migrations/1794217000000-CreateCommentsTable.ts`
  - `src/modules/articles/articles.module.ts`
  - `src/modules/articles/articles.repository.ts`
  - `src/modules/articles/articles.repository.spec.ts`
  - `src/modules/articles/articles.service.ts`
  - `src/modules/articles/articles.service.spec.ts`
  - `src/modules/articles/entities/article.entity.ts`
  - `test/comments.e2e-spec.ts`
  - `test/articles.e2e-spec.ts`
  - `test/profiles.e2e-spec.ts`
  - `test/user.e2e-spec.ts`
  - `AGENTS.md`
  - `D:\Working-kit\harness\30-role-worker-karpathy.md`
- **Last Verification:**
  - `npm test`: 23/23 suites passed, 168/168 unit tests passed (exit code: 0)
  - `npm run build`: Nest build successfully compiled (exit code: 0)
  - `npm run lint`: SunLint passed with 0 errors across 76 files (exit code: 0)
- **Next Immediate Action:** Ready for mentor re-review and merge of PR #5 into main.
- **Blockers / Risks:** None.

---

## Bảng Theo Dõi Nhiệm Vụ (Default-FAIL Contract)

| Task ID | Nhiệm Vụ | Trạng Thái | Lệnh Kiểm Thử Thực Tế | Exit Code | Bằng Chứng / Output Digest | Thời Điểm |
| :--- | :--- | :---: | :--- | :---: | :--- | :--- |
| **TASK-01** | Khởi tạo codebase, Swagger, i18n, SunLint setup (PR1) | [x] PASS | `npm run lint` | `0` | All checks passed · 3.3s | 2026-11-06 17:15 |
| **TASK-02A** | TypeORM Migration thủ công, User Schema, Auth Module (PR2) | [x] PASS | `npm test` | `0` | 4/4 suites, 30/30 tests passed | 2026-11-09 18:30 |
| **TASK-02B** | Khắc phục toàn diện 9 góp ý code review của Mentor PR2 | [x] PASS | `npm run build && npm test && npm run lint` | `0` | 0 errors across 37 files, 30/30 unit tests passed, commit `7ade8eb` pushed | 2026-11-10 14:04 |
| **TASK-03** | Profile Subsystem, Follow/Unfollow, Attachments Upload (PR3) | [x] PASS | `npm run build && npm test && npm run lint` | `0` | 11/11 suites, 86/86 unit tests passed, 0 lint errors across 49 files | 2026-11-11 16:45 |
| **TASK-04** | CRUD Articles, Tagging, Feed & Favorites (PR4) | [x] PASS | `npm run build && npm test && npm run lint` | `0` | 18/18 suites, 134/134 unit tests passed, 0 lint errors across 66 files | 2026-11-18 17:57 |
| **TASK-05** | CRD Comments & Dual-Ownership Authorization (PR5) | [x] PASS | `npm run build && npm test && npm run lint` | `0` | 23/23 suites, 149/149 unit tests passed, 0 lint errors across 76 files | 2026-11-20 16:27 |
| **TASK-05B** | Khắc phục toàn diện 7 góp ý code review của Mentor PR5 | [x] PASS | `npm test && npm run lint && npm run build` | `0` | 23/23 suites (168/168 tests passed), 0 lint errors, build exit 0 | 2026-11-24 03:25 |

---

## Nhật Ký Chi Tiết Từng Lượt Chuyển Giao (Handoff Log)
- **[2026-11-24 02:50] [Agent: Antigravity IDE (PR5 Mentor Feedback Resolution)]**:
  - Khắc phục triệt để 7 góp ý code review của Mentor `huongnt-2545` trên PR #5:
    1. **Tập trung hóa Follows logic vào `ProfilesService`**:
       - Bổ sung `findFollowingIds(followerId: string, authorIds: string[]): Promise<Set<string>>` trong `ProfilesService`.
       - `CommentsService` và `ArticlesService` inject `ProfilesService` thay vì tự query bảng `follows`.
       - Bỏ hoàn toàn `Follow` khỏi `TypeOrmModule.forFeature` của `CommentsModule` và `ArticlesModule`.
       - Xóa `findFollowingAuthorIds` và `followRepository` khỏi `CommentsRepository` và `ArticlesRepository`.
    2. **Tối ưu tra cứu Article & loại bỏ Redundant Joins**:
       - Bổ sung `findSummaryBySlug(slug: string): Promise<ArticleSummary | null>` trong `ArticlesRepository` chỉ select `id` và `authorId`.
       - Expose `findArticleSummaryOrThrow(slug: string): Promise<ArticleSummary>` trong `ArticlesService`.
       - `CommentsService` inject `ArticlesService`, gọi `findArticleSummaryOrThrow` thay vì tự gọi `ArticlesRepository.findBySlug` với relations thừa.
       - Thay thế `findById(id)` bằng `findByIdAndArticleId(id, articleId)` không relations thừa; kiểm tra dual-ownership trực tiếp mà không cần check lặp `comment.articleId !== article.id`.
    3. **Composite Indexing**:
       - Migration `1794217000000-CreateCommentsTable.ts` và Entity `Comment` thay thế 2 index riêng lẻ `IDX_comments_article_id` và `IDX_comments_created_at` bằng composite index duy nhất `IDX_comments_article_id_created_at` (`article_id`, `created_at`).
    4. **Validation dynamic constraint token & thu gọn exports**:
       - `@MaxLength(COMMENT_BODY_MAX_LENGTH)` trong `create-comment.dto.ts` đổi sang dùng token `'body must not exceed $constraint1 characters'`.
       - Xóa hoàn toàn mảng `exports` không cần thiết trong `CommentsModule`.
    5. **Scoped E2E Teardown triệt để (Zero Table-Wipes)**:
       - Xóa toàn bộ các lệnh `delete({})` trên mọi bảng trong `test/comments.e2e-spec.ts`, `test/articles.e2e-spec.ts`, `test/profiles.e2e-spec.ts`, `test/user.e2e-spec.ts`.
       - Thu hẹp phạm vi `afterAll` chỉ xóa đúng các test user được sinh ra bởi chính test suite đó qua danh sách email cụ thể.
    6. **Bổ sung Quy chuẩn vĩnh viễn**:
       - Ghi nhận Nguyên tắc 7 vào `D:\Working-kit\harness\30-role-worker-karpathy.md`.
       - Bổ sung Rules 12-16 vào `AGENTS.md`.
- **[2026-11-20 16:27] [Agent: Antigravity IDE]**:
  - Triển khai hoàn thiện Pull Request 5 (PR5 - CRD Comments):
    1. Migration thủ công `1794217000000-CreateCommentsTable.ts` và Entity `Comment` với quan hệ cascade tới `Article` và `User`.
    2. `CreateCommentDto` với validation chặn chuỗi toàn khoảng trắng `@Matches(/\S/)`, `@MaxLength(4000)`, và response schemas Swagger.
    3. `CommentsRepository` và `comment.mapper.ts`: đóng gói truy vấn, phân trang sắp xếp, batch-load cờ `following` chống N+1 query.
    4. `CommentsService` và `CommentsController`: 3 endpoint tại route `@Controller('articles/:slug/comments')`:
       - `POST /api/articles/:slug/comments` (201 Created, JwtAuthGuard)
       - `GET /api/articles/:slug/comments` (200 OK, OptionalJwtAuthGuard, `@NoCacheHeaders()`)
       - `DELETE /api/articles/:slug/comments/:id` (204 No Content, JwtAuthGuard, phân quyền kép Dual-Ownership: tác giả bình luận HOẶC tác giả bài viết)
    5. Unit tests và E2E tests: 23/23 suites passed, 149/149 unit tests passed (100% pass), `npm run build` exit 0, SunLint 0 errors across 76 files.
- **[2026-11-19 12:20] [Agent: Antigravity IDE (PR4 Mentor Feedback Resolution)]**:
  - Khắc phục triệt để 5 góp ý code review của Mentor `huongnt-2545` trên PR #4:
    1. **Tạo `@NoCacheHeaders()` Decorator**: Đóng gói header `Cache-Control: no-store` dùng chung tại `src/common/decorators/no-cache-headers.decorator.ts`, loại bỏ 3 dòng `@Header` lặp lại tại 5 endpoint của `ArticlesController`.
    2. **Xóa Dead Defensive Check**: Loại bỏ `slug?.trim()` và `if (!cleanSlug)` trong `ArticlesService.findArticleOrThrow`, chỉ giữ lại kiểm tra `!article` từ database query.
    3. **Tách Shared Persistence Error Helper**: Tạo `rethrowAsPersistenceError` tại `src/common/utils/persistence-error.util.ts`, dùng chung cho `ArticlesRepository` và `TagsService`, kèm unit test suite `persistence-error.util.spec.ts`.
    4. **Loại bỏ False-Positive Test trong `ArticlesRepository.spec.ts`**: Đổi dữ liệu mock `removeFavorite` từ 0 thành 5 -> 4, assert chi tiết `mockQueryBuilder.set` được gọi với biểu thức trừ an toàn `GREATEST(favorites_count - 1, 0)`.
    5. **Xóa Đăng Ký Entity `Tag` Thừa**: Bỏ `Tag` khỏi `TypeOrmModule.forFeature` trong `ArticlesModule` vì entity đã được export từ `TagsModule`.
    6. **Bổ sung Quy chuẩn vĩnh viễn**: Cập nhật Rules 7-11 vào `AGENTS.md` và `D:\Working-kit\harness\30-role-worker-karpathy.md`.
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
