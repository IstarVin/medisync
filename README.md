# CareLog - School Clinic Management System

A simple and efficient School Clinic Management System that uses QR code technology to provide quick healthcare access at educational institutions. CareLog is designed specifically for emergency situations where time, accuracy, and immediate access to student information are crucial.

## Features

- QR code-based student identification
- Quick medical record access
- Emergency contact management
- Visit tracking and documentation
- Staff management system
- Responsive web interface

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- pnpm (recommended) or npm

### Database Setup

This project uses MongoDB with Mongoose. You'll need to set up a MongoDB instance:

**Option 1: Local MongoDB**

1. Install MongoDB on your machine
2. Start the MongoDB service
3. Create a database named `medisync`

**Option 2: MongoDB Atlas (Cloud)**

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string

### Environment Configuration

1. Copy `.env.example` to `.env`:

   ```sh
   cp .env.example .env
   ```

2. Update the `.env` file with your MongoDB connection string:

   ```env
   MONGODB_URI="mongodb://localhost:27017/medisync"
   # or for MongoDB Atlas:
   # MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/medisync"

   SMTP2GO_API_KEY="your-smtp2go-api-key"
   SMTP2GO_SENDER_EMAIL="your-sender-email@example.com"
   ```

### Installation

Install dependencies with pnpm (recommended):

```sh
pnpm install
```

Or with npm:

```sh
npm install
```

## Developing

Start the development server:

```sh
pnpm run dev

# or start the server and open the app in a new browser tab
pnpm run dev -- --open
```

## Building

To create a production version of your app:

```sh
pnpm run build
```

You can preview the production build with `pnpm run preview`.

## Database Migration

This project has been migrated from SQLite to MongoDB using Mongoose. Key changes include:

- **Database**: Now uses MongoDB instead of SQLite
- **ORM**: Uses Mongoose instead of Drizzle ORM
- **Environment Variables**: `MONGODB_URI` instead of `DATABASE_URL`
- **Schema**: All models are defined using Mongoose schemas with proper TypeScript interfaces

All database operations have been updated to use Mongoose methods such as:

- `Model.find()`, `Model.findById()`, `Model.create()`
- Population for relationships instead of SQL joins
- MongoDB-native features like ObjectIds and automatic timestamps

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
