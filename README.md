# Conduit Backend API - NestJS Tutorial (Clone Medium)

Sinh vien thuc hien: Nguyen Trung Kien  
Khoa / Truong: Khoa Cong nghe Thong tin - Dai hoc Bach Khoa, Dai hoc Da Nang (DUT)  
Hoc phan: WebScale Full-Stack Technologies  
Tieu chuan dao tao: Sun* Training Guideline & RealWorld Medium Specification  
Cong nghe su dung: NestJS 10.x, TypeScript 5.x Strict Mode, SunLint, Jest  

--------------------------------------------------------------------------------

## 1. Gioi thieu tong quan

Du an xay dung he thong Backend RESTful API cho ung dung mang xa hoi chia se bai viet Conduit (Medium Clone) theo dac ta RealWorld va huong dan dao tao cua Sun*.

Du an duoc phan chia theo mo hinh cac Pull Request doc lap, tap trung vao kien truc huong module (Modular Architecture), xu ly ngoai le tap trung, co che da ngon ngu (i18n), tai lieu hoa API tu dong voi Swagger OpenAPI, va dam bao tieu chuan chat luong ma nguon nghiem ngat voi SunLint cung Google TypeScript Style Guide.

--------------------------------------------------------------------------------

## 2. Ket qua hoan thanh trong Pull Request 1

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

## 3. Cau truc thu muc ma nguon

```text
NestJS tutorials/
|-- src/
|   |-- common/              Cac thanh phan dung chung (Constants, Filters, Interceptors, Pipes)
|   |-- config/              Cau hinh bien moi truong
|   |-- database/            Cau hinh ket noi TypeORM va Data Source
|   |-- i18n/                Tu dien da ngon ngu (tieng Anh: en, tieng Viet: vi)
|   |-- modules/
|   |   |-- health/          Module API Hello World / Health Check (Pull 1)
|   |   |-- auth/            Stub module xac thuc (chuan bi cho Pull 2)
|   |   |-- users/           Stub module nguoi dung (chuan bi cho Pull 2, 3)
|   |   |-- profiles/        Stub module trang ca nhan & follow (chuan bi cho Pull 3)
|   |   |-- attachments/     Stub module upload tep da hinh (chuan bi cho Pull 3)
|   |   |-- articles/        Stub module bai viet (chuan bi cho Pull 4)
|   |   |-- comments/        Stub module binh luan (chuan bi cho Pull 5)
|   |   |-- tags/            Stub module the tag bai viet (chuan bi cho Pull 4)
|   |   `-- redis/           Stub service quan ly token blacklist (chuan bi cho Pull 2)
|   |-- app.module.ts        Root module cua ung dung
|   `-- main.ts              Diem khoi chay ung dung, cau hinh Swagger, Pipes va Filters
|-- test/                    Kiem thu tich hop E2E (app.e2e-spec.ts, jest-e2e.json)
|-- .env.example             Mau cau hinh bien moi truong
|-- .eslintrc.js             Quy tac kiem tra cu phap ESLint
|-- nest-cli.json            Cau hinh trinh bien dich Nest CLI
|-- package.json             Khai bao thu vien va cac lenh chay
`-- tsconfig.json            Cau hinh bien dich TypeScript Strict Mode
```

--------------------------------------------------------------------------------

## 4. Huong dan cai dat va chay du an

### 4.1. Cai dat cac goi thu vien
```bash
npm install
```

### 4.2. Thiet lap bien moi truong
Sao chep tep mau .env.example thanh .env:
```bash
cp .env.example .env
```

### 4.3. Chay ung dung o che do Development
```bash
npm run start:dev
```
Ung dung se khoi chay tai dia chi: http://localhost:3000  
Giao dien Swagger API Docs tai: http://localhost:3000/api/docs  

### 4.4. Kiem tra API truc tiep
* Mac dinh (tieng Anh):
  `GET http://localhost:3000/api/v1/health`
  Ket qua:
  ```json
  {
    "statusCode": 200,
    "message": "Hello World! Conduit Backend API is running smoothly.",
    "timestamp": "2026-11-06T12:00:00.000Z",
    "environment": "development"
  }
  ```

* Chuyen sang tieng Viet:
  `GET http://localhost:3000/api/v1/health?lang=vi`
  hoac gui Header: `x-custom-lang: vi`
  Ket qua:
  ```json
  {
    "statusCode": 200,
    "message": "Xin chao! Conduit Backend API dang hoat dong on dinh.",
    "timestamp": "2026-11-06T12:00:00.000Z",
    "environment": "development"
  }
  ```

### 4.5. Chay kiem tra chat luong ma nguon (SunLint & ESLint)
```bash
# Chay kiem tra SunLint toan bo thu muc src
npm run lint

# Chay kiem tra ESLint
npm run lint:eslint
```

### 4.6. Chay kiem thu tu dong
```bash
# Chay Unit Test
npm test

# Chay E2E Integration Test
npm run test:e2e
```

--------------------------------------------------------------------------------

## 5. Lo trinh cac Pull Request tiep theo

- Pull 1: Khoi tao du an NestJS, API Hello World, i18n, Swagger, SunLint (Hoan thanh).
- Pull 2: Migration co so du lieu thu cong, xac thuc Authentication (Register, Login, Logout voi Redis token blacklist, Get Current User).
- Pull 3: Cac API quan ly User (Update User voi upload avatar da hinh polymorphic attachments, Get Profile, Follow, Unfollow).
- Pull 4: CRUD Articles (Tao bai viet voi auto-slug, danh sach phan trang, Global Feed, Personal Feed, Favorite, Unfavorite).
- Pull 5: CRD Comments (Binh luan tren bai viet), Tags API.
- Pull 6: Tong ket, toi uu hieu nang, bao mat, bo sung kiem thu E2E toan dien.
