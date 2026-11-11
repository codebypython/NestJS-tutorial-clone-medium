# Conduit Backend API - NestJS Tutorial (Clone Medium)

Sinh vien thuc hien: Nguyen Trung Kien  
Khoa / Truong: Khoa Cong nghe Thong tin - Dai hoc Bach Khoa, Dai hoc Da Nang (DUT)  
Hoc phan: WebScale Full-Stack Technologies  
Tieu chuan dao tao: Sun* Training Guideline & RealWorld Medium Specification  
Cong nghe su dung: NestJS 10.x, TypeScript 5.x Strict Mode, TypeORM, MariaDB/MySQL, Redis, SunLint, Jest  

--------------------------------------------------------------------------------

## 1. Gioi thieu tong quan

Du an xay dung he thong Backend RESTful API cho ung dung mang xa hoi chia se bai viet Conduit (Medium Clone) theo dac ta RealWorld va huong dan dao tao cua Sun*.

Du an duoc phan chia theo mo hinh cac Pull Request doc lap, tap trung vao kien truc huong module (Modular Architecture), quan ly phien ban co so du lieu bang TypeORM Migration thu cong, co che xac thuc JWT ket hop Redis Token Blacklist, xu ly ngoai le tap trung, co che da ngon ngu (i18n), tai lieu hoa API tu dong voi Swagger OpenAPI, va dam bao tieu chuan chat luong ma nguon nghiem ngat voi SunLint cung Google TypeScript Style Guide.

--------------------------------------------------------------------------------

## 2. Ket qua hoan thanh trong Pull Request 1 (Nen tang & Ha tang co so)

Pull Request 1 tap trung vao viec khoi tao nen tang ky thuat va ha tang co ban cho toan bo he thong:

1. Khoi tao du an NestJS:
   - Thiet lap du an voi TypeScript Strict Mode (bat strict, noImplicitAny, strictNullChecks).
   - Cau hinh tien to toan cuc cho moi API: /api.
   - Cung cap bo loc bat loi tap trung (AllExceptionsFilter) va bo dem thoi gian phan hoi (LoggingInterceptor).
   - Xu ly loi dau vao DTO voi ConduitValidationPipe tra ve chuan HTTP 422 Unprocessable Entity theo dac ta Conduit.

2. Xay dung API Hello World (Health Check):
   - Endpoint: GET /api/v1/health
   - Tra ve thong diep chao mung va kiem tra trang thai he thong.
   - Ho tro chuyen ngu tu dong thong qua tham so query ?lang=vi hoac header x-custom-lang: vi.

3. Tich hop co che da ngon ngu (i18n):
   - Su dung thu vien nestjs-i18n voi cac tep tu dien json cho tieng Anh (en) va tieng Viet (vi) tai thu muc src/i18n/.
   - Cau hinh tu dong sao chep du lieu tu dien khi build ma nguon (nest-cli.json).

4. Tai lieu hoa API voi Swagger OpenAPI:
   - Truy cap Swagger UI truc quan tai duong dan: http://localhost:3000/api/docs
   - Cau hinh mo ta day du cho DTO, Controller, va chuan xac thuc Token header theo dac ta Conduit: Authorization: Token <jwt>.

5. Kiem soat chat luong ma nguon (Quality Assurance):
   - Cai dat va tich hop cong cu SunLint (@sun-asterisk/sunlint v1.3.56).
   - Ket qua kiem tra: All checks passed (0 errors, 0 warnings tren toan bo 23 tep nguon).
   - Tuan thu chat che Google TypeScript Style Guide: khong su dung kieu any, dat ten theo chuan PascalCase/camelCase, su dung Named Exports.

6. Kiem thu tu dong (Automated Testing):
   - Unit Test: 3/3 test suites vuot qua thanh cong (npm test).
   - E2E Integration Test: 4/4 test cases vuot qua thanh cong (npm run test:e2e).

--------------------------------------------------------------------------------

## 3. Ket qua hoan thanh trong Pull Request 2 (Database Migration & Authentication)

Pull Request 2 trien khai toan dien ha tang quan ly phien ban co so du lieu thu cong va cac endpoint xac thuc theo dac ta RealWorld Endpoints:

1. Kien truc Migration thu cong voi TypeORM:
   - Cau hinh DataSource doc lap phuc vu TypeORM CLI tai `src/database/data-source.ts`.
   - Tuyet doi khong su dung co che dong bo tu dong (`synchronize: false`) de bao ve toan ven du lieu san xuat.
   - Dinh nghia User Entity (`src/modules/users/entities/user.entity.ts`) voi day du cac truong: id (UUID v4), email (unique), username (unique), passwordHash, bio, image, createdAt, updatedAt.
   - Tao ban migration khoi dau `1794214619650-CreateUsersTable.ts` thuc thi tao bang `users`, chi muc unique cho email va username.

2. Quan ly thong tin Nguoi dung & Ngan chan trung lap:
   - Xay dung `UsersService` va `UsersModule` cung cap cac phuong thuc tao moi, truy van nguoi dung theo ID, email, username.
   - Ngan chan trung lap email hoac username voi ma loi HTTP 422 Unprocessable Entity theo dac ta RealWorld: `{ "errors": { "email": ["has already been taken"] } }`.

3. Bao mat voi Redis Token Blacklist:
   - Kien truc phan tach lop Repository (`RedisTokenRepository`) de tuan thu nghiem ngat quy tac SunLint C033 (khong goi truc tiep Redis client tu business service).
   - Co che thu hoi phien dang nhap (Logout): luu JWT token vao Redis blacklist voi TTL dong tinh dua theo thoi gian het han con lai cua token (`exp - currentTime`).
   - `JwtAuthGuard` kiem tra trang thai thu hoi tai Redis truoc khi cho phep request tiep tuc xu ly; tu choi ngay lap tuc voi HTTP 401 Unauthorized neu token nam trong danh sach den.

4. Cac API Endpoints xac thuc:
   - `POST /api/users` (Dang ky tai khoan): Nhan payload `{ "user": { username, email, password } }`, ma hoa mat khau bang bcryptjs voi salt rounds = 10, luu tru vao database va tra ve HTTP 201 kem envelope `{ "user": { email, token, username, bio, image } }`.
   - `POST /api/users/login` (Dang nhap): Xac thuc email va mat khau, tra ve HTTP 200 kem JWT token va thong tin nguoi dung.
   - `POST /api/users/logout` (Dang xuat): Thu hoi JWT token hien tai vao Redis blacklist, tra ve HTTP 200 `{ "message": "Successfully logged out" }`.
   - `GET /api/user` (Lay thong tin nguoi dung hien tai): Yeu cau token xac thuc hop le, inject thong tin user vao route handler qua custom decorator `@CurrentUser()`, tra ve HTTP 200 kem thong tin user envelope.

5. Ho tro da dang chuan Header xac thuc:
   - Ho tro ca 2 dinh dang Authorization Header:
     - Chuan RealWorld: `Authorization: Token <jwt>`
     - Chuan RFC Bearer: `Authorization: Bearer <jwt>`

6. Tuan thu Tieu chuan Bao mat & Chat luong ma nguon:
   - SunLint Compliance: 0 errors, 0 warnings tren toan bo 37 tep nguon (`sunlint --all --input=src` bao cao `All checks passed`).
   - Tuan thu day du cac quy tac SunLint: C014, C017, C024, C033, C041, C067, S004, S006, S012, S037, S041, S042, S045, S051.
   - Thiet lap Anti-Cache headers tren cac endpoint xac thuc (`Cache-Control: no-store`, `Pragma: no-cache`, `Expires: 0`).
   - Tuan thu Google TypeScript Style Guide: strict typing, khong su dung kieu any, dat ten bien va ham ro rang theo semantic.

7. Kiem thu tu dong (Automated Testing):
   - Unit Test: 4/4 test suites vuot qua thanh cong (30/30 tests pass).
   - E2E Integration Test: 2/2 suites vuot qua thanh cong (19/19 tests pass, bao gom toan bo kich ban Auth: dang ky hop le/trung lap/sai dinh dang/race condition, dang nhap dung/sai, get current user co/khong token, va dang xuat / token blacklist tren ca scheme Token va Bearer).

--------------------------------------------------------------------------------

## 4. Cau truc thu muc ma nguon

```text
NestJS tutorials/
|-- src/
|   |-- common/                  Cac thanh phan dung chung (Constants, Filters, Interceptors, Pipes)
|   |   |-- constants/           Hang so toan he thong
|   |   |-- filters/             Bo loc bat loi tap trung AllExceptionsFilter
|   |   |-- interceptors/        LoggingInterceptor, TransformInterceptor
|   |   `-- pipes/               ConduitValidationPipe (chuan hoa loi DTO thanh HTTP 422)
|   |-- config/                  Cau hinh bien moi truong he thong
|   |-- database/                Cau hinh ket noi TypeORM, Data Source va Migration
|   |   |-- migrations/          Cac ban ghi migration quan ly phien ban CSDL
|   |   |   `-- 1794214619650-CreateUsersTable.ts
|   |   |-- data-source.ts       TypeORM Data Source cho migration CLI
|   |   `-- database.module.ts   Module ket noi co so du lieu ung dung
|   |-- i18n/                    Tu dien da ngon ngu (tieng Anh: en, tieng Viet: vi)
|   |-- modules/
|   |   |-- articles/            Module bai viet (chuan bi cho Pull 4)
|   |   |-- attachments/         Module upload tep da hinh (chuan bi cho Pull 3)
|   |   |-- auth/                Module xac thuc (Register, Login, Logout, Current User) (Pull 2)
|   |   |   |-- decorators/      Custom decorators (@CurrentUser)
|   |   |   |-- dto/             DTOs (CreateUserDto, LoginUserDto, UserResponseDto)
|   |   |   |-- guards/          JwtAuthGuard (xac thuc JWT va Redis blacklist)
|   |   |   |-- strategies/      Passport JWT Strategy (ho tro ca Token va Bearer)
|   |   |   |-- auth.controller.ts
|   |   |   |-- auth.module.ts
|   |   |   |-- auth.service.spec.ts
|   |   |   `-- auth.service.ts
|   |   |-- comments/            Module binh luan bai viet (chuan bi cho Pull 5)
|   |   |-- health/              Module API Health Check (Pull 1)
|   |   |-- profiles/            Module trang ca nhan & follow (chuan bi cho Pull 3)
|   |   |-- redis/               Module quan ly Redis va Token Blacklist (Pull 2)
|   |   |   |-- repositories/    RedisTokenRepository (truu tuong hoa truy cap du lieu)
|   |   |   |-- redis.constants.ts
|   |   |   |-- redis.module.ts
|   |   |   `-- redis.service.ts
|   |   |-- tags/                Module the tag bai viet (chuan bi cho Pull 4)
|   |   `-- users/               Module nguoi dung & Entity (Pull 2)
|   |       |-- entities/        User Entity (TypeORM)
|   |       |-- users.module.ts
|   |       |-- users.service.spec.ts
|   |       `-- users.service.ts
|   |-- app.module.ts            Root module cua ung dung
|   `-- main.ts                  Diem khoi chay ung dung, cau hinh Swagger, Pipes va Filters
|-- test/                        Kiem thu tich hop E2E (app.e2e-spec.ts, auth.e2e-spec.ts)
|-- .env.example                 Mau cau hinh bien moi truong
|-- .eslintrc.js                 Quy tac kiem tra cu phap ESLint
|-- nest-cli.json                Cau hinh trinh bien dich Nest CLI
|-- package.json                 Khai bao thu vien va cac lenh chay
`-- tsconfig.json                Cau hinh bien dich TypeScript Strict Mode
```

--------------------------------------------------------------------------------

## 5. Huong dan cai dat va chay du an

### 5.1. Cai dat cac goi thu vien
```bash
npm install
```

### 5.2. Thiet lap bien moi truong
Sao chep tep mau .env.example thanh .env:
```bash
cp .env.example .env
```
Cap nhat thong so ket noi co so du lieu (MariaDB/MySQL) va Redis phu hop voi moi truong may tinh cua ban:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `REDIS_HOST`, `REDIS_PORT`
- `JWT_SECRET`, `JWT_EXPIRES_IN`

### 5.3. Thuc thi Migration Co so du lieu
Truoc khi khoi chay he thong lan dau, chay migration de khoi tao schema va bang `users`:
```bash
# Thuc thi cac file migration chua chay
npm run migration:run

# Khi can hoan tac migration gan nhat
npm run migration:revert
```

### 5.4. Chay ung dung o che do Development
```bash
npm run start:dev
```
Ung dung se khoi chay tai dia chi: http://localhost:3000  
Giao dien Swagger API Docs tai: http://localhost:3000/api/docs  

### 5.5. Cac Endpoint chinh trong he thong

1. Health Check (Pull 1):
   - `GET /api/v1/health` (Ho tro da ngon ngu voi query `?lang=vi` hoac header `x-custom-lang: vi`)

2. Dang ky tai khoan (Pull 2):
   - `POST /api/users`
   - Body:
     ```json
     {
       "user": {
         "username": "johndoe",
         "email": "john@example.com",
         "password": "supersecretpassword"
       }
     }
     ```
   - Tra ve HTTP 201:
     ```json
     {
       "user": {
         "email": "john@example.com",
         "token": "eyJhbGciOi...",
         "username": "johndoe",
         "bio": "",
         "image": ""
       }
     }
     ```

3. Dang nhap tai khoan (Pull 2):
   - `POST /api/users/login`
   - Body:
     ```json
     {
       "user": {
         "email": "john@example.com",
         "password": "supersecretpassword"
       }
     }
     ```
   - Tra ve HTTP 200 voi user envelope va JWT token moi.

4. Lay thong tin nguoi dung hien tai (Pull 2):
   - `GET /api/user`
   - Header: `Authorization: Token <jwt>` hoac `Authorization: Bearer <jwt>`
   - Tra ve HTTP 200 kem thong tin nguoi dung.

5. Dang xuat he thong (Pull 2):
   - `POST /api/users/logout`
   - Header: `Authorization: Token <jwt>` hoac `Authorization: Bearer <jwt>`
   - Token se bi thu hoi va dua vao Redis blacklist cho den khi het han.

### 5.6. Chay kiem tra chat luong ma nguon (SunLint & ESLint)
```bash
# Chay kiem tra SunLint toan bo thu muc src (0 errors, 0 warnings)
npm run lint

# Chay kiem tra ESLint
npm run lint:eslint
```

### 5.7. Chay kiem thu tu dong
```bash
# Chay Unit Test (4 suites, 30 tests)
npm test

# Chay E2E Integration Test (2 suites, 19 tests)
npm run test:e2e
```


--------------------------------------------------------------------------------

## 6. Lo trinh cac Pull Request tiep theo

- Pull 1: Khoi tao du an NestJS, API Hello World, i18n, Swagger, SunLint (Hoan thanh).
- Pull 2: Migration co so du lieu thu cong, xac thuc Authentication (Register, Login, Logout voi Redis token blacklist, Get Current User) (Hoan thanh).
- Pull 3: Cac API quan ly User (Update User voi upload avatar da hinh polymorphic attachments, Get Profile, Follow, Unfollow).
- Pull 4: CRUD Articles (Tao bai viet voi auto-slug, danh sach phan trang, Global Feed, Personal Feed, Favorite, Unfavorite).
- Pull 5: CRD Comments (Binh luan tren bai viet), Tags API.
- Pull 6: Tong ket, toi uu hieu nang, bao mat, bo sung kiem thu E2E toan dien.
