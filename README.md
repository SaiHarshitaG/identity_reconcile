# Identity Reconciliation API

This project implements the **Identity Reconciliation Backend Task**

The goal is to identify and consolidate customer identities across multiple purchases based on shared email and/or phone numbers.



## Live Deployment

Live API URL: ```https://identity-reconcile-3dd1.onrender.com```

[https://identity-reconcile-3dd1.onrender.com/identify](https://identity-reconcile-3dd1.onrender.com/identify)


## Problem Overview

Customers may place orders using:

- Different emails
- Different phone numbers
- Or combinations of both

Each checkout event contains at least one of:

- `email`
- `phoneNumber`

The system must:

- Track multiple contact records
- Link related contacts
- Maintain a single **primary identity**
- Merge identities when necessary
- Return consolidated identity details


##  Tech Stack

- **Node.js**
- **TypeScript**
- **Express**
- **Knex.js**
- **PostgreSQL (Neon Cloud)**
- **Render (Deployment)**



## Database Schema

Table: `contacts`

| Column         | Type      | Description |
|---------------|----------|------------|
| id            | integer  | Primary key |
| email         | string   | Optional |
| phoneNumber   | string   | Optional |
| linkedId      | integer  | References primary contact |
| linkPrecedence| string   | "primary" or "secondary" |
| createdAt     | timestamp| Auto generated |
| updatedAt     | timestamp| Auto generated |
| deletedAt     | timestamp| Nullable |



## API Endpoint

POST `/identify`

### Request Body

```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

At least one field is required.


### Response Format

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": [
      "lorraine@hillvalley.edu",
      "mcfly@hillvalley.edu"
    ],
    "phoneNumbers": [
      "123456"
    ],
    "secondaryContactIds": [23]
  }
}
```

## Identity Rules Implemented

### 1. New Customer
If no existing contact matches:
- Create new **primary** contact.

---

### 2. Existing Contact Match
If email or phone matches existing contact:
- Return consolidated identity.
- If new information is introduced → create **secondary** contact.

---

### 3. Merging Two Primary Contacts
If a request links two different primary groups:
- Oldest primary remains primary.
- Newer primary becomes secondary.
- Entire identity trees are merged.
- Operation is transaction-safe.

---

## Transaction Safety

All reconciliation logic runs inside a database transaction to ensure:

- Atomic updates
- No partial merges
- No inconsistent identity state

---

## 📂 Project Structure

```
backend/
│
├── src/
│   ├── config/
│   ├── middlewares/
│   ├── modules/contact/
│   ├── utils/
│   └── server.ts
│
├── migrations/
├── knexfile.ts
├── package.json
└── tsconfig.json
```

---

## ⚙️ Running Locally

### 1. Clone Repository

```
git clone https://github.com/SaiHarshitaG/identity_reconcile.git 
cd /backend
```

### 2. Install Dependencies

```
npm install
```

### 3. Setup Environment Variables

Create a `.env` file:

```
DATABASE_URL=your_neon_postgres_connection_string
PORT=3000
```

### 4. Run Migrations

```
npm run migrate
```

### 5. Start Development Server

```
npm run dev
```

Server will run at:```http://localhost:3000```


# Example Test Cases

### Create Primary

```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

---

### Create Secondary

```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

---

### Merge Two Primaries

1.
```json
{ "email": "x@test.com" }
```

2.
```json
{ "phoneNumber": "999999" }
```

3.
```json
{
  "email": "x@test.com",
  "phoneNumber": "999999"
}
```

Oldest primary remains.

---

## Deployment (Render)

### Build Command

```
npm install && npm run build && npm run migrate
```

### Start Command

```
npm start
```

### Environment Variable Required

```
DATABASE_URL
```

Root directory set to:

```
backend
```

## Edge Cases Handled

- Only email provided
- Only phoneNumber provided
- Both provided
- Duplicate prevention
- Identity tree merging
- Primary precedence by oldest record
- Transaction safety

---

## Production Considerations

- All writes wrapped in transaction
- Duplicate prevention using Set logic
- Deterministic primary selection
- Clean modular architecture
- Error handling middleware implemented


## Author

Sai Harshita Ganti
MNNIT Allahabad

