# TradeSphere

TradeSphere is a full-stack trading platform foundation featuring real-time market data, portfolio management, and a modern, responsive UI. It integrates with Alpha Vantage for live stock quotes and uses a Node.js/Express backend paired with a React/Vite frontend. Data is stored securely in a PostgreSQL database hosted on Supabase, accessed via Prisma ORM.

## Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [npm](https://www.npmjs.com/) (usually comes with Node.js)
*   A [Supabase](https://supabase.com/) account (or any PostgreSQL instance) for the database.
*   An [Alpha Vantage API Key](https://www.alphavantage.co/) for live market data.

## Project Structure

This project is structured as a monorepo containing both the frontend and backend:

*   **`/client`**: The React frontend application, built with Vite and styled with Tailwind CSS.
*   **`/server`**: The Node.js backend API, using Express.js, Prisma, and WebSockets.

## Setup Instructions

### 1. Install Dependencies

From the root directory of the project, run the following command to install dependencies for the root, client, and server simultaneously:

```bash
npm run install:all
```

### 2. Configure Environment Variables

**Backend (`server/.env`)**
Ensure your `server/.env` file is properly configured with your Supabase credentials, Alpha Vantage API key, and SMTP details for email OTP verification:

```env
# Database (Supabase PostgreSQL)
# Make sure your password is URL-encoded if it contains special characters (e.g., @ becomes %40)
DATABASE_URL="postgresql://postgres:YOUR_ENCODED_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:YOUR_ENCODED_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres"

# JWT Secrets
JWT_ACCESS_SECRET="your_access_secret_here"
JWT_REFRESH_SECRET="your_refresh_secret_here"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Alpha Vantage API
ALPHA_VANTAGE_API_KEY="YOUR_API_KEY"

# Email Configuration (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"
EMAIL_FROM="TradeSphere <noreply@tradesphere.com>"

# Server Config
PORT=5000
NODE_ENV=development
CLIENT_URL="http://localhost:5173"
```

### 3. Database Initialization

With your `DATABASE_URL` and `DIRECT_URL` properly set in `server/.env`, initialize the database schema.

Navigate to the server directory:
```bash
cd server
```

Push the schema to your Supabase PostgreSQL database:
```bash
npx prisma db push
```

Generate the Prisma client:
```bash
npx prisma generate
```

Return to the root directory:
```bash
cd ..
```

## Running the Application

To start both the backend server and the frontend client concurrently, run the following command from the **root directory**:

```bash
npm run dev
```

*   **Client** will run on: `http://localhost:5173`
*   **Server API** will run on: `http://localhost:5000`

Access the client application in your browser and you can create an account, verify via email OTP, and start exploring the trading platform.

## Features

*   **Real-time Market Data**: Uses WebSockets and Alpha Vantage for live price updates.
*   **Portfolio Management**: Simulated buying and selling with real-time PnL calculation.
*   **Interactive Charts**: Integrated with `lightweight-charts` for viewing historical OHLCV data.
*   **Secure Authentication**: JWT-based authentication with email OTP verification via Nodemailer.
*   **Modern UI**: Built with React, Tailwind CSS, and Lucide icons for a premium, dark-mode aesthetic.
