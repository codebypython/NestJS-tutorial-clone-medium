# TIẾN ĐỘ DỰ ÁN & CHUYỂN GIAO TRẠNG THÁI (PROJECT PROGRESS)

## Handoff Anchor
- **Active Task:** TASK-06 (Pull Request 6 - E2E Integration Testing & C2 Branch Coverage)
- **Current State:** VERIFIED_PASS
- **Active Environment:** Node.js v22.19.0 / NestJS 10.x / MySQL2 / ioredis
- **Target Files:**
  - `.env.test`
  - `.env.example`
  - `.gitignore`
  - `package.json`
  - `src/config/configuration.ts`
  - `src/database/data-source.ts`
  - `src/modules/redis/redis.constants.ts`
  - `src/modules/redis/redis.module.ts`
  - `test/jest-e2e.json`
  - `test/setup-e2e.ts`
  - `test/helpers/e2e-database.helper.ts`
  - `test/helpers/e2e-app.helper.ts`
  - `test/factories/e2e-data.factory.ts`
  - `test/comments.e2e-spec.ts`
- **Last Verification:**
  - `npm run test:e2e`: 6/6 E2E suites passed, 67/67 E2E tests passed on `conduit_db_test` (exit code: 0)
  - `npm run test:e2e:cov`: 26/26 C2 E2E tests passed, 100% Branch Coverage on `src/modules/comments` (exit code: 0)
  - `npm test`: 23/23 unit suites passed, 168/168 unit tests passed (exit code: 0)
  - `npm run build`: Nest build successfully compiled (exit code: 0)
  - `npm run lint`: SunLint passed with 0 errors across 76 files (exit code: 0)
- **Next Immediate Action:** Ready for PR #6 review and merge into main.
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
| **TASK-06** | Thiết lập E2E Test Database riêng, Truncate/Faker Lifecycle & C2 Coverage cho CommentsController (PR6) | [x] PASS | `npm run test:e2e && npm run test:e2e:cov && npm test && npm run build && npm run lint` | `0` | 6/6 E2E suites (67/67 tests passed), 100% C2 Branch Coverage on comments, 23/23 unit suites (168/168 passed), 0 lint errors | 2026-11-25 17:20 |

---

## Nhật Ký Chi Tiết Tiến Độ Triển Khai

- **[2026-11-25 17:20] [PR6 Implementation - E2E Integration Testing & C2 Coverage]**:
  - Thiết lập môi trường kiểm thử tích hợp tách biệt hoàn toàn với môi trường phát triển:
    1. **Cơ sở dữ liệu & Redis kiểm thử độc lập**:
       - Sử dụng `conduit_db_test` riêng trên MySQL và phân vùng Redis riêng (`REDIS_DB=1` trong `.env.test`, mặc định `REDIS_DB=0` cho development).
       - `test/setup-e2e.ts` (`globalSetup` của Jest E2E) tự động tạo schema `conduit_db_test` (kèm kiểm tra ràng buộc tên `*_test` để bảo vệ DB development) và chạy toàn bộ TypeORM migrations thủ công (`synchronize: false`).
       - `src/database/data-source.ts` chọn đúng `.env.test` khi `NODE_ENV=test`.
    2. **Thực thi tuần tự & làm sạch dữ liệu sau mỗi test case**:
       - Cấu hình `maxWorkers: 1` trong `test/jest-e2e.json` và `--runInBand` trong `package.json`.
       - Xây dựng `truncateDatabase(app)` trong `test/helpers/e2e-database.helper.ts`: thực hiện `SET FOREIGN_KEY_CHECKS = 0`, `TRUNCATE TABLE` toàn bộ các bảng nghiệp vụ và `flushdb` trên phân vùng Redis test (`db > 0`) trong `afterEach`.
       - Tạo `test/helpers/e2e-app.helper.ts` tái sử dụng cấu hình HTTP pipeline chuẩn (`api` prefix, `AllExceptionsFilter`, `ConduitValidationPipe`).
    3. **Sinh dữ liệu mẫu với `@faker-js/faker` trước mỗi test case**:
       - Xây dựng `test/factories/e2e-data.factory.ts` (`seedFakeUser`, `seedFakeArticle`, `seedFakeComment`, `seedFakeFollow`, `buildFakeCreateCommentPayload`) chạy trong `beforeEach`.
    4. **Kiểm thử E2E cấp độ C2 cho `CommentsController` (`test/comments.e2e-spec.ts`)**:
       - Bao phủ 26 test cases qua toàn bộ luồng `Request -> Guard/Pipe -> Controller -> Service -> Repository -> MySQL/Redis`:
         - `POST /api/articles/:slug/comments`: `201` (`Token`/`Bearer`, tự động trim, xác minh bản ghi DB), `401` (thiếu token, sai định dạng, token bị blacklist trên Redis), `422` (payload rỗng, sai kiểu, toàn khoảng trắng, vượt quá 4000 ký tự, trường không hợp lệ), `404` (article không tồn tại).
         - `GET /api/articles/:slug/comments`: `200` (mảng rỗng + `Cache-Control: no-store`, sắp xếp giảm dần theo thời gian khi chưa đăng nhập, tính toán `author.following` khi đăng nhập, fallback khách khi token lỗi hoặc đã logout), `404`.
         - `DELETE /api/articles/:slug/comments/:id`: `401`, `400` (`ParseIntPipe`), `404` (article không tồn tại, comment không tồn tại, comment thuộc bài viết khác), `403` (người lạ), `204` (tác giả comment, tác giả bài viết theo Dual-Ownership, tự xóa của tác giả bài viết), và kiểm chứng `ON DELETE CASCADE` khi xóa bài viết cha.
       - Đo lường bằng `npm run test:e2e:cov`: đạt **100% Branch Coverage (C2)** trên toàn bộ `src/modules/comments` (`26/26 tests passed`); toàn bộ `npm run test:e2e` đạt **6/6 suites (67/67 tests passed)**.

- **[2026-11-24 02:50] [PR5 Review Feedback Resolution]**:
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
    5. **Scoped E2E Teardown**:
       - Thu hẹp phạm vi `afterAll` trong các suite E2E chỉ xóa đúng các test user do suite đó sinh ra qua danh sách email cụ thể.

- **[2026-11-20 16:27] [PR5 Implementation]**:
  - Triển khai hoàn thiện Pull Request 5 (PR5 - CRD Comments):
    1. Migration thủ công `1794217000000-CreateCommentsTable.ts` và Entity `Comment` với quan hệ cascade tới `Article` và `User`.
    2. `CreateCommentDto` với validation chặn chuỗi toàn khoảng trắng `@Matches(/\S/)`, `@MaxLength(4000)`, và response schemas Swagger.
    3. `CommentsRepository` và `comment.mapper.ts`: đóng gói truy vấn, phân trang sắp xếp, batch-load cờ `following` chống N+1 query.
    4. `CommentsService` và `CommentsController`: 3 endpoint tại route `@Controller('articles/:slug/comments')`:
       - `POST /api/articles/:slug/comments` (201 Created, JwtAuthGuard)
       - `GET /api/articles/:slug/comments` (200 OK, OptionalJwtAuthGuard, `@NoCacheHeaders()`)
       - `DELETE /api/articles/:slug/comments/:id` (204 No Content, JwtAuthGuard, phân quyền kép Dual-Ownership: tác giả bình luận HOẶC tác giả bài viết)
    5. Unit tests và E2E tests: 23/23 suites passed, 149/149 unit tests passed (100% pass), `npm run build` exit 0, SunLint 0 errors across 76 files.

- **[2026-11-19 12:20] [PR4 Review Feedback Resolution]**:
  - Khắc phục triệt để 5 góp ý code review của Mentor `huongnt-2545` trên PR #4:
    1. **Tạo `@NoCacheHeaders()` Decorator**: Đóng gói header `Cache-Control: no-store` dùng chung tại `src/common/decorators/no-cache-headers.decorator.ts`, loại bỏ 3 dòng `@Header` lặp lại tại 5 endpoint của `ArticlesController`.
    2. **Xóa Dead Defensive Check**: Loại bỏ `slug?.trim()` và `if (!cleanSlug)` trong `ArticlesService.findArticleOrThrow`, chỉ giữ lại kiểm tra `!article` từ database query.
    3. **Tách Shared Persistence Error Helper**: Tạo `rethrowAsPersistenceError` tại `src/common/utils/persistence-error.util.ts`, dùng chung cho `ArticlesRepository` và `TagsService`, kèm unit test suite `persistence-error.util.spec.ts`.
    4. **Loại bỏ False-Positive Test trong `ArticlesRepository.spec.ts`**: Đổi dữ liệu mock `removeFavorite` từ 0 thành 5 -> 4, assert chi tiết `mockQueryBuilder.set` được gọi với biểu thức trừ an toàn `GREATEST(favorites_count - 1, 0)`.
    5. **Xóa Đăng Ký Entity `Tag` Thừa**: Bỏ `Tag` khỏi `TypeOrmModule.forFeature` trong `ArticlesModule` vì entity đã được export từ `TagsModule`.

- **[2026-11-11 16:45] [PR3 Audit & Hardening]**:
  - Thực hiện rà soát độc lập và hoàn thiện các điểm kỹ thuật của PR #3:
    1. Loại bỏ mock `guard.canActivate` trong `optional-jwt-auth.guard.spec.ts`, chuyển sang spy trên prototype `AuthGuard`.
    2. Cập nhật `AttachmentsService.uploadAvatar` để chỉ xóa file và bản ghi avatar cũ sau khi bản ghi mới persist thành công; tự động dọn tệp mới nếu DB lỗi.
    3. Xử lý đúng lỗi trùng khóa (`ER_DUP_ENTRY` / errno 1062) trong `ProfilesService.followUser` và ném `InternalServerErrorException` cho các lỗi DB nghiêm trọng khác.
    4. Thắt chặt validation trong `UpdateUserDataDto` và chuẩn hóa mapping xung đột race condition trong `UsersService.update`.
    5. Chuẩn hóa HTTP status cho `MulterError` trong `AllExceptionsFilter`, bổ sung `http-exception.filter.spec.ts` (86/86 tests passed) và bật `index: false` cho `ServeStaticModule`.

- **[2026-11-11 16:23] [PR3 Implementation]**:
  - Triển khai hoàn thiện Pull Request 3 (PR3):
    1. Migration thủ công `1794215000000-CreateFollowsAndAttachmentsTables.ts` và 2 Entity `Follow`, `Attachment`.
    2. Cấu hình `@nestjs/serve-static` trong `AppModule`, triển khai `onModuleInit` trong `AttachmentsModule`.
    3. `AttachmentsService` & `AttachmentsController`: upload avatar 2MB whitelist MIME, polymorphic attachment, orphan cleanup trên đĩa.
    4. `UsersController` & `UsersService.update`: tách riêng route `/api/user`, hỗ trợ `GET /api/user` và partial `PUT /api/user`.
    5. `ProfilesController` & `ProfilesService`: `GET /api/profiles/:username`, `POST /api/profiles/:username/follow`, `DELETE /api/profiles/:username/follow`.
    6. `OptionalJwtAuthGuard` hỗ trợ optional auth và Redis blacklist.

- **[2026-11-10 14:04] [PR2 Review Feedback Resolution]**:
  - Khắc phục toàn diện 9 góp ý review trên PR #2:
    1. Bỏ secret fallback, dùng `getOrThrow` / `ConfigurationException`.
    2. Loại bỏ comment chưa triển khai khỏi mã nguồn auth.
    3. Loại bỏ code session thừa trong kiến trúc JWT stateless.
    4. Phân loại lỗi DB rõ ràng giữa 422 và 500 kèm log chi tiết.
    5. Ngăn chặn Timing Attack bằng `TIMING_SAFE_DUMMY_DIGEST`.
    6. Bắt buộc truyền `token: string` trong `buildUserResponse`.
    7. Loại bỏ phương thức thừa trong `RedisService`.
    8. Khởi tạo entity bằng `this.userRepository.create({...})`.
    9. Thiết lập `.env.test` và dọn dẹp dữ liệu test ở `afterAll`.
