# Shrinkr

A backend REST API for shortening URLs with click analytics, QR code generation, and security features built in.

---

## Why Shrinkr exists

Shrinkr was built to explore production-grade backend patterns such as authentication flows, analytics tracking, API security, and scalable URL redirection systems.

## Features

- **URL Shortening** — generate short links with random or custom codes
- **QR Code Generation** — get a QR code for any URL instantly
- **Click Analytics** — track clicks per link broken down by country, device, browser, and OS
- **Link Management** — activate/deactivate links, set custom expiry times, delete links
- **User Dashboard Stats** — total URLs, total clicks, active vs expired counts
- **JWT Auth** — access token + refresh token flow via HTTP-only cookies
- **Email Verification** — OTP-based email verification on sign-up
- **Forgot Password** — OTP-based password reset via email
- **Rate Limiting** — token bucket rate limiting via Arcjet
- **Bot Detection** — blocks malicious bots while allowing search engines and API clients
- **Attack Protection** — Arcjet Shield guards against SQLi, XSS, and common attacks
- **File Uploads** — profile picture upload via Cloudinary

---

## Tech Stack

| Layer        | Technology                                 |
| ------------ | ------------------------------------------ |
| Runtime      | Node.js                                    |
| Framework    | Express.js v5                              |
| Database     | MongoDB + Mongoose                         |
| Auth         | JWT (access + refresh tokens), bcrypt      |
| Security     | Arcjet (rate limit, bot detection, shield) |
| Email        | Nodemailer + Mailtrap                      |
| File Storage | Cloudinary + Multer                        |
| Analytics    | GeoIP-lite, ua-parser-js                   |
| QR Codes     | qrcode                                     |
| Validation   | express-validator                          |

---

## Project Structure

```
shrinkr/
├── index.js
└── src/
    ├── app.js
    ├── config/
    │   ├── arcjet.config.js
    │   └── env.config.js
    ├── connection/
    │   └── db.js
    ├── controllers/
    │   ├── auth.controllers.js
    │   ├── url.controllers.js
    │   └── users.controllers.js
    ├── middleware/
    │   ├── arcjet.middleware.js
    │   ├── auth.middleware.js
    │   ├── globalError.middleware.js
    │   ├── multer.middleware.js
    │   └── validateError.middleware.js
    ├── models/
    │   ├── analytics.models.js
    │   ├── url.models.js
    │   └── user.models.js
    ├── routes/
    │   ├── auth.routes.js
    │   ├── url.routes.js
    │   └── user.routes.js
    └── utils/
        ├── ApiError.utils.js
        ├── ApiResponse.utils.js
        ├── asyncHandler.utils.js
        ├── cloudinary.utils.js
        ├── email.utils.js
        └── validate.utils.js
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Mailtrap account (for email testing)
- Cloudinary account (for image uploads)
- Arcjet account (for security)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/shrinkr.git
cd shrinkr

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your values in .env

# 4. Start the development server
npm run dev
```

The server will start at `http://localhost:3000`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```dotenv
PORT=3000
MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>

NODE_ENV=development

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1h

REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRES=7d

MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=465
MAILTRAP_USERNAME=your_mailtrap_username
MAILTRAP_PASSWORD=your_mailtrap_password
MAILTRAP_SMTP_SENDER="noreply@shrinkr.com"

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_CLOUD_KEY=your_api_key
CLOUDINARY_CLOUD_SECRET=your_api_secret

BASE_URL=http://localhost:3000

ARCJET_ENV=development
ARCJET_KEY=your_arcjet_key
```

---

## API Reference

All routes are prefixed with `/api/v1`.

### Auth — `/api/v1/auth`

| Method | Endpoint               | Auth | Description                                        |
| ------ | ---------------------- | ---- | -------------------------------------------------- |
| POST   | `/sign-up`             | No   | Register a new user                                |
| POST   | `/sign-in`             | No   | Log in, returns access + refresh tokens as cookies |
| POST   | `/verify`              | No   | Verify email with OTP                              |
| POST   | `/SendverificationOTP` | No   | Resend email verification OTP                      |

#### POST `/sign-up`

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "userName": "johndoe",
  "email": "john@example.com",
  "password": "yourpassword"
}
```

#### POST `/sign-in`

```json
{
  "email": "john@example.com",
  "password": "yourpassword"
}
```

#### POST `/verify`

```json
{
  "token": "123456"
}
```

---

### URLs — `/api/v1/url`

All routes except `/:code` require authentication.

| Method | Endpoint                 | Auth | Description                                |
| ------ | ------------------------ | ---- | ------------------------------------------ |
| POST   | `/`                      | Yes  | Shorten a URL (random code)                |
| POST   | `/generateCustomizedUrl` | Yes  | Shorten with a custom code                 |
| POST   | `/generateQRCode`        | Yes  | Generate QR code for a URL                 |
| GET    | `/:code`                 | No   | Redirect to original URL                   |
| GET    | `/allUrlsOfUser`         | Yes  | Get all URLs created by the logged-in user |
| GET    | `/allActiveUrls`         | Yes  | Get all non-expired URLs                   |
| GET    | `/allExpiredUrls`        | Yes  | Get all expired URLs                       |
| GET    | `/allClicksOfUser`       | Yes  | Get total click count across all user URLs |
| GET    | `/stats/:code`           | Yes  | Get detailed analytics for a specific URL  |
| GET    | `/deleteUrl/:url`        | Yes  | Delete a URL by its short code             |
| GET    | `/deActivate/:url`       | Yes  | Toggle activate/deactivate a URL           |

#### POST `/` — Shorten a URL

```json
{
  "original_url": "https://example.com/some/long/path",
  "expiryTime": "7d"
}
```

Expiry format: `30m`, `2h`, `1d`, `1w`. Defaults to 7 days if omitted.

#### GET `/stats/:code` — Analytics response

```json
{
  "clicks": 142,
  "countries": { "US": 80, "PK": 30, "GB": 32 },
  "devices": { "mobile": 100, "desktop": 42 },
  "browsers": { "Chrome": 90, "Safari": 52 }
}
```

---

### Users — `/api/v1/user`

All routes require authentication unless noted.

| Method | Endpoint                   | Auth | Description                                            |
| ------ | -------------------------- | ---- | ------------------------------------------------------ |
| GET    | `/getMe`                   | Yes  | Get logged-in user profile                             |
| GET    | `/logOut`                  | Yes  | Log out (clears cookies)                               |
| GET    | `/refreshToken`            | No   | Issue new access token using refresh token cookie      |
| GET    | `/userStats`               | Yes  | Get URL stats summary (total, active, expired, clicks) |
| GET    | `/forgotPasswordOtp`       | No   | Send forgot password OTP to email                      |
| GET    | `/changeForgottenPassword` | No   | Reset password using OTP                               |
| POST   | `/updateProfile`           | Yes  | Update first name, last name, or username              |
| POST   | `/updatePassword`          | Yes  | Change password (requires old password)                |
| POST   | `/changeProfilePricture`   | Yes  | Upload/change profile picture (multipart/form-data)    |

#### GET `/userStats` — Response

```json
{
  "totalUrls": 15,
  "totalClicks": 342,
  "activeUrls": 10,
  "expiredUrls": 5
}
```

---

## Response Format

All responses follow a consistent structure:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Success"
}
```

Errors return:

```json
{
  "statusCode": 400,
  "message": "Error description"
}
```

---

## Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- Auth via **HTTP-only cookies** (not localStorage) to prevent XSS
- **Arcjet Shield** protects against SQL injection and common web attacks
- **Token bucket rate limiting** — 5 requests per minute per IP
- **Bot detection** — blocks malicious bots, allows search engines and API clients
- OTPs are **SHA-256 hashed** before storing in the database
- CORS restricted to specific allowed origins
- Request body size capped at **10kb**
- SSRF protection via `request-filtering-agent` on URL validation

---

# Architecture

## System Architecture Overview

Shrinkr follows a layered backend architecture separating routing, business logic, data access, and infrastructure concerns to maintain scalability and maintainability.

                Client (Web / Mobile / API Consumer)
                              │
                              │ HTTP Requests
                              ▼
                        Express Server
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼

Security Layer Middleware Layer Route Layer
(Arcjet Shield) (Auth, Errors, (API Routes)
Rate Limiting Validation)
Bot Protection │
▼
Controller Layer
(Request handling logic)
│
▼
Service Logic
(Business operations)
│
┌─────────────────────┼─────────────────────┐
│ │ │
▼ ▼ ▼
MongoDB Cloudinary Email Service
(Data Storage) (Profile Images) (OTP / Password Reset)
│
▼
Analytics Engine
(GeoIP + User Agent parsing)
Request Flow

## flow for URL shortening:

1 Client sends authenticated request
│
2 Arcjet checks:
• Rate limits
• Bot detection
• Attack protection
│
3 Auth middleware verifies JWT
│
4 Validation middleware checks input
│
5 Controller processes request
│
6 Database stores URL
│
7 Response returned with short code
Authentication Flow

Shrinkr uses a secure token rotation strategy:

User Login →
Access Token issued (short life)
Refresh Token issued (long life)

Access expires →
Refresh endpoint called →
New access token issued

Security decisions:

Access tokens expire quickly
Refresh tokens stored in HTTP-only cookies
Tokens never stored in localStorage
Passwords hashed with bcrypt
Security Architecture

Shrinkr uses layered security:

Request arrives
│
Arcjet Shield
(SQLi/XSS protection)
│
Rate Limiting
│
Bot Detection
│
JWT Authentication
│
Input Validation
│
Controller Execution

Defense strategy:

Prevent malicious requests early
Authenticate users
Validate data
Execute business logic only if safe

---

## Future Improvements

• Redis caching for analytics
• Background job processing
• Custom domain support
• Link password protection
• Team workspaces
• GraphQL version

---

## License

MIT
