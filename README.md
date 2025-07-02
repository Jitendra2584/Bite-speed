# Bite speed Identity Service

A robust backend service for identity reconciliation and contact management, built with Node.js, TypeScript, and PostgreSQL. This service intelligently links customer contacts across multiple touch points to create a unified customer identity.

## 🚀 Features

- **Identity Reconciliation**: Automatically links contacts based on email and phone number matches
- **Contact Consolidation**: Merges duplicate contacts while maintaining data integrity
- **Primary/Secondary Linking**: Establishes hierarchical relationships between related contacts
- **Transaction Safety**: Ensures data consistency with database transactions
- **Input Validation**: Comprehensive validation using Zod schemas
- **RESTful API**: Clean and simple API endpoints

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Validation**: Zod
- **Environment**: dotenv

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/bitespeed-identity-service.git
cd bitespeed-identity-service
```

2. **Install dependencies**
```bash
npm install
```

In `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=bitespeed_identity
PORT=3000
```

3. **Start the development server**
```bash
npm run dev
```

## 📁 Project Structure

```
bitespeed-identity-service/
├── src/
│   ├── entity/
│   │   └── contacts.ts          # Contact entity definition
│   ├── service/
│   │   └── contact.service.ts   # Business logic for contact operations
│   ├── zod/
│   │   └── index.ts            # Validation schemas
│   ├── data-source.ts          # Database configuration
│   └── index.ts                # Main server file
├── tests/
│   ├── contact.service.test.ts # Test cases
│   └── run-tests.ts           # Test runner
├── .env.example               # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## 🔗 API Endpoints

### Health Check
```http
GET /
```

**Response:**
```json
{
  "message": "Bite speed Identity Service is running!"
}
```

### Identify Contact
```http
POST /identify
```

**Request Body:**
```json
{
  "email": "customer@example.com",
  "phoneNumber": "1234567890"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["customer@example.com", "customer.alt@example.com"],
    "phoneNumbers": ["1234567890", "0987654321"],
    "secondaryContactIds": [2, 3]
  }
}
```

### Clear Database (Development)
```http
POST /clear-db
```

## 🎯 Business Logic

### Contact Linking Rules

1. **New Contact**: If no matching email or phone exists, create a new primary contact
2. **Exact Match**: If exact email+phone combination exists, return existing contact
3. **Partial Match**: If only email OR phone matches, create a secondary contact linked to the primary
4. **Contact Merging**: If request spans multiple primary contacts, merge them by converting older primaries to secondaries

### Example Scenarios

#### Scenario 1: New Customer
```json
// Request
{ "email": "new@customer.com", "phoneNumber": "1111111111" }

// Creates new primary contact
{
  "primaryContactId": 1,
  "emails": ["new@customer.com"],
  "phoneNumbers": ["1111111111"],
  "secondaryContactIds": []
}
```

#### Scenario 2: Existing Customer with New Email
```json
// Request (phone matches existing contact)
{ "email": "alternate@customer.com", "phoneNumber": "1111111111" }

// Creates secondary contact, returns consolidated view
{
  "primaryContactId": 1,
  "emails": ["new@customer.com", "alternate@customer.com"],
  "phoneNumbers": ["1111111111"],
  "secondaryContactIds": [2]
}
```

### Test Categories
- **Basic CRUD Operations**
- **Contact Linking Logic**
- **Input Validation**
- **Edge Cases**
- **Error Handling**

### Manual Testing with Postman
use curl:

```bash
# Create new contact
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "1234567890"}'

# Link existing contact
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test2@example.com", "phoneNumber": "1234567890"}'
```

Error Response Format:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## 🔧 Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

## 📚 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_USER` | Database username | - |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | bitespeed_identity |
| `PORT` | Server port | 3000 |

---

**Happy Coding! 🚀**