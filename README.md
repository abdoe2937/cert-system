# 🏆 CertifyPro — Certificate Management System

A full-stack certificate management system with role-based authentication, PDF certificate generation, and separate student/admin dashboards.

---

## 📁 Project Structure

```
cert-system/
├── backend/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # Register, login, profile
│   │   ├── adminController.js  # Admin CRUD + certificate sending
│   │   └── studentController.js# Student certificate fetch
│   ├── middleware/
│   │   └── auth.js             # JWT protect + adminOnly guards
│   ├── models/
│   │   ├── User.js             # User model (with studentCode gen)
│   │   └── Certificate.js      # Certificate model
│   ├── routes/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   └── student.js
│   ├── scripts/
│   │   └── seedAdmin.js        # Creates first admin account
│   ├── utils/
│   │   └── pdfGenerator.js     # pdf-lib A4 landscape certificate
│   ├── certificates/           # Generated PDFs (auto-created)
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── api/
    │   │   └── index.js        # Axios instance + all API calls
    │   ├── context/
    │   │   └── AuthContext.js  # Global auth state
    │   ├── components/
    │   │   └── Navbar.js       # Shared navigation bar
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js
    │   │   ├── StudentDashboard.js
    │   │   ├── AdminDashboard.js
    │   │   └── NotFound.js
    │   ├── App.js              # Router + protected routes
    │   ├── index.js
    │   └── index.css           # Tailwind + custom styles
    ├── .env.example
    ├── package.json
    └── tailwind.config.js
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (or a MongoDB Atlas URI)
- npm or yarn

---

### 1. Clone / enter the project

```bash
cd cert-system
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create your `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/cert-system
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Seed the admin account:

```bash
node scripts/seedAdmin.js
```

Start the backend:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Backend runs at **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create your `.env` file:

```bash
cp .env.example .env
```

`.env`:
```env
REACT_APP_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm start
```

Frontend runs at **http://localhost:3000**

---

## 🔐 Default Credentials

| Role  | Email               | Password     |
|-------|---------------------|--------------|
| Admin | admin@certify.com   | admin123456  |

Students register themselves via the `/register` page.

---

## 📡 API Reference

### Auth
| Method | Endpoint              | Access  | Description         |
|--------|-----------------------|---------|---------------------|
| POST   | /api/auth/register    | Public  | Register new user   |
| POST   | /api/auth/login       | Public  | Login               |
| GET    | /api/auth/me          | Private | Get current profile |

**Register body:**
```json
{ "name": "Alice", "email": "alice@test.com", "password": "pass123", "phone": "+1234567890" }
```

**Login body:**
```json
{ "email": "alice@test.com", "password": "pass123" }
```

---

### Admin (requires `Authorization: Bearer <token>` + admin role)

| Method | Endpoint                        | Description                    |
|--------|---------------------------------|--------------------------------|
| GET    | /api/admin/users                | Get all students               |
| GET    | /api/admin/users/:id            | Get student + their certs      |
| PATCH  | /api/admin/complete/:id         | Mark student as completed      |
| POST   | /api/admin/send-certificate/:id | Generate & send PDF certificate|

**send-certificate body:**
```json
{ "courseName": "Full-Stack Web Development" }
```

---

### Student (requires `Authorization: Bearer <token>`)

| Method | Endpoint                   | Description            |
|--------|----------------------------|------------------------|
| GET    | /api/student/certificates  | Get own certificates   |

---

### Static Files

Generated certificates are served at:
```
GET http://localhost:5000/certificates/<filename>.pdf
```

---

## 🎨 Features

### Student Dashboard
- View profile info (name, email, phone, join date)
- See unique **Student Code** (with gold shimmer animation)
- View all issued certificates
- Download certificates as PDF

### Admin Dashboard
- Stats: total / completed / in-progress counts
- Full searchable, filterable student table
- **Mark as Completed** — one-click status update
- **Send Certificate** — opens modal, enter course name, generates A4 PDF
- Auto-refreshable table

### PDF Certificate
- A4 Landscape format
- Includes: student name, course name, student code, issue date
- Gold decorative borders, seal, and footer
- Saved to `/backend/certificates/` and linked in DB

---

## 🔒 Security

- Passwords hashed with **bcryptjs** (12 salt rounds)
- **JWT** tokens (7-day expiry, configurable)
- Route guards: `protect` middleware + `adminOnly` middleware
- CORS restricted to frontend origin
- Input validation on all endpoints
- Passwords stripped from all JSON responses via `toJSON()`
- 401 auto-logout on expired token (frontend interceptor)

---

## 🛠 Tech Stack

| Layer       | Technology                      |
|-------------|----------------------------------|
| Frontend    | React 18, React Router 6, Tailwind CSS, Axios |
| Backend     | Node.js, Express 4              |
| Database    | MongoDB + Mongoose              |
| Auth        | JWT + bcryptjs                  |
| PDF         | pdf-lib                         |
| Fonts       | Playfair Display, DM Sans (Google Fonts) |
| Toasts      | react-hot-toast                 |

---

## 📝 Notes

- The `certificates/` folder is auto-created on first certificate generation.
- To promote a user to admin manually:
  ```js
  // In MongoDB shell or Compass
  db.users.updateOne({ email: "user@example.com" }, { $set: { role: "admin" } })
  ```
- For production: use environment variables, serve frontend as static build, use HTTPS.
