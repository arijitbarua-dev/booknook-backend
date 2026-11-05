# 📚 BookNook Backend

### Powering Your Digital Library Experience.

**BookNook Backend** is the RESTful API server for the BookNook online library management platform. Built with Node.js and Express.js, it provides the backend infrastructure for managing books, handling borrowing and returns, retrieving library data, and securely validating authenticated user requests.

Powered by MongoDB and integrated with Better Auth JWT verification, this backend connects the BookNook frontend with its library data and core application functionality.

---

## ✨ Key Features

- **📖 Book Management API** — Create, retrieve, update, and delete book records with dedicated REST API endpoints.
- **🔍 Search, Filter & Sort** — Search books by title or author, filter by category, sort by newest or oldest, and organize results by title.
- **🔐 Secure Authentication & Authorization** — Verify Better Auth JWT tokens using JWKS and protect sensitive API endpoints with authentication middleware.
- **📚 Borrowing Management** — Process book borrowing requests, check available copies, prevent duplicate active borrowing, and maintain borrowing records.
- **↩️ Book Returns & Availability Tracking** — Manage return operations, update borrowing records, and automatically restore available book copies in the database.

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime for server-side development |
| **Express.js** | REST API development and route handling |
| **MongoDB** | NoSQL database for books and borrowing records |
| **MongoDB Node.js Driver** | Database connectivity and CRUD operations |
| **Better Auth** | Authentication integration |
| **JOSE** | JWT verification using remote JWKS |
| **CORS** | Cross-origin resource sharing |
| **dotenv** | Environment variable management |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm
- [MongoDB Atlas](https://www.mongodb.com/atlas) account or a MongoDB instance
- Git

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/arijitbarua-dev/booknook-backend.git
```

**2. Navigate to the project directory**

```bash
cd booknook-backend
```

**3. Install dependencies**

```bash
npm install
```

**4. Configure environment variables**

Create a `.env` file in the project root:

```env
MONGODB_URL=your_mongodb_connection_string
JWKS_URL=your_better_auth_jwks_url
```

Replace the placeholder values with your actual MongoDB connection string and Better Auth JWKS endpoint. Never commit real credentials to GitHub.

**5. Start the backend server**

```bash
node index.js
```

The server runs on:

```text
http://localhost:5000
```

---

## 🔗 API Overview

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check server availability |
| GET | `/books` | Retrieve books with search, filtering, and sorting |
| GET | `/books/:id` | Retrieve a specific book |
| POST | `/books` | Add a new book |
| PUT / PATCH | `/books/:id` | Update book information |
| DELETE | `/books/:id` | Delete a book |
| GET | `/new-arrivals` | Retrieve the six newest books |
| POST | `/borrows` | Borrow a book |
| GET | `/borrows` | Retrieve borrowing records |
| PUT / PATCH | `/borrows/:id` | Update a borrowing record |
| DELETE | `/borrows/:id` | Return a borrowed book |
| GET | `/verify-token` | Verify an authentication token |

**Authentication:** Protected endpoints require a valid Bearer token in the Authorization header.

---

## 🗄️ Database Structure

The backend uses MongoDB with a database named `BookNook` and two primary collections:

- **books** — Stores book information, categories, descriptions, images, copy counts, and creation timestamps.
- **borrows** — Stores borrowing records, book details, borrower information, borrowing dates, and return dates.

---

## 🔗 Related Project

**BookNook Frontend:** [github.com/arijitbarua-dev/BookNook](https://github.com/arijitbarua-dev/BookNook)

The frontend communicates with this backend API to provide users with a complete online library management experience.

---

## 👨‍💻 Developer

**Arijit Barua Turza**

- GitHub: [@arijitbarua-dev](https://github.com/arijitbarua-dev)
- Backend Repository: [BookNook Backend](https://github.com/arijitbarua-dev/booknook-backend)
- Frontend Repository: [BookNook](https://github.com/arijitbarua-dev/BookNook)

---

<p align="center">
  <strong>📚 BookNook Backend — The Engine Behind Your Digital Library.</strong>
</p>
