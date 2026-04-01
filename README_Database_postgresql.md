# 📦 Inventory Scanner – PostgreSQL Setup Guide

This guide will walk you through setting up **PostgreSQL**, creating the database, configuring environment variables, and seeding data for the **Inventory Scanner (Wholesale Module)**.

---

## 🚀 Prerequisites

- Node.js installed  
- npm or yarn  
- Git (optional but recommended)

---

# 🖥️ Step 1: Install PostgreSQL

## 🍎 Mac (Homebrew Method)

1. Open Terminal  
2. Check if Homebrew is installed:
   ```bash
   brew -v
   ```

3. If not installed:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

4. Install PostgreSQL:
   ```bash
   brew install postgresql@14
   ```

---

## 🪟 Windows

### Option 1 (Recommended): Official Installer

1. Download PostgreSQL from:  
   https://www.postgresql.org/download/windows/

2. Run installer and follow steps:
   - Set password for **postgres user**
   - Default port: `5432`
   - Keep pgAdmin installed

---

# ▶️ Step 2: Start PostgreSQL Service

## 🍎 Mac
```bash
brew services start postgresql@14
```

## 🪟 Windows

### Method 1 (Services)
- Press `Win + R`
- Type `services.msc`
- Find `postgresql-x64-14`
- Click Start

### Method 2 (Command Line)
```bash
net start postgresql-x64-14
```

---

# 🗄️ Step 3: Create Database

## 🍎 Mac
```bash
psql postgres
```

## 🪟 Windows
```bash
psql -U postgres
```

### Inside PostgreSQL CLI:
```sql
CREATE DATABASE inventory_scanner;
```

Exit:
```sql
\q
```

---

# 🔗 Step 4: Configure DATABASE_URL

Edit:
```
.env.local
```

## 🍎 Mac
```env
DATABASE_URL="postgresql://<your-username>@localhost:5432/inventory_scanner"
```

## 🪟 Windows
```env
DATABASE_URL="postgresql://postgres:<your-password>@localhost:5432/inventory_scanner"
```

---

# 🔍 How to Find Your Database URL

## 🍎 Mac
```bash
whoami
```

## 🪟 Windows
```bash
whoami
```

Or use pgAdmin:
- Servers → PostgreSQL → Databases

---

# 🧱 Step 5: Push Schema
```bash
npx prisma db push
```

---

# 🌱 Step 6: Seed Data
```bash
npx prisma db seed
```

---

# 🎯 Step 7: Run App
```bash
npm run dev
```

Open:
http://localhost:3000

---

# 🔐 Default Credentials

| Role      | Code | Password |
|----------|------|----------|
| Admin    | 9001 | 5678     |
| Employee | 1001 | 1234     |

---

# ✅ Done!

Your database is fully set up and ready.
