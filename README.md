# Treep 🌴

A social media web application built with Node.js, Express, MongoDB, and EJS.

## Features

- User registration and authentication
- Create, edit, and delete posts
- Follow/unfollow users
- Real-time chat functionality
- Search posts
- User profiles with followers/following

## Prerequisites

- **Node.js** 18.0.0 or higher
- **MongoDB** (local or MongoDB Atlas)
- **npm** (comes with Node.js)

## Quick Start

### 1. Clone the Repository

```bash
git clone git@github.com:Jesse-Bett/Treep.git
cd Treep
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

Create a `.env` file in the root directory:

```bash
touch .env
```

Add the following environment variables to `.env`:

```env
CONNECTIONSTRING=mongodb+srv://username:password@cluster.mongodb.net/database?appName=Treep
PORT=3000
JWTSECRET=your_random_secret_string_here
SENDGRIDAPIKEY=your_sendgrid_api_key_here
```

**Required:**
- `CONNECTIONSTRING` - Your MongoDB connection string (get from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- `JWTSECRET` - Any random string for JWT token signing

**Optional:**
- `PORT` - Server port (defaults to 3000)
- `SENDGRIDAPIKEY` - For email notifications (leave empty if not using)

**Example `.env` file:**
```env
CONNECTIONSTRING=mongodb+srv://user:pass@cluster.mongodb.net/treep?appName=Treep
PORT=3000
JWTSECRET=mysupersecretkey123
SENDGRIDAPIKEY=
```

### 4. Build Frontend Assets

```bash
npm run build
```

### 5. Run the Application

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Development mode (with webpack watch):**
```bash
npm run watch
```

**Production mode:**
```bash
npm start
```

### 6. Access the Application

Open your browser and navigate to: **http://localhost:3000**

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon
- `npm run watch` - Start dev server with webpack watch
- `npm run build` - Build frontend assets for production

## MongoDB Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Get your connection string from "Connect" → "Connect your application"
5. Add the connection string to your `.env` file
6. In Network Access, add `0.0.0.0/0` to allow connections from anywhere (or your server's IP)

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for detailed deployment instructions.

**Recommended platforms:**
- [Render.com](https://render.com) - Easiest setup, free tier available
- [Railway.app](https://railway.app) - No spin-downs, $5 free credit/month
- [Fly.io](https://fly.io) - Global edge network

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Template Engine:** EJS
- **Real-time:** Socket.io
- **Frontend:** Vanilla JavaScript (bundled with Webpack)
- **Authentication:** Express Sessions, JWT
- **Other:** Bcrypt, Marked (Markdown), Sanitize HTML

## Project Structure

```
treep/
├── controllers/     # Route controllers
├── models/         # Database models
├── views/          # EJS templates
├── frontend-js/    # Client-side JavaScript
├── public/         # Static assets
├── router.js       # Main routes
├── router-api.js   # API routes
├── app.js          # Express app configuration
├── db.js           # Database connection
└── webpack.config.js
```

## Notes

- The `csurf` package is deprecated but still functional. Consider migrating to a modern CSRF protection solution in the future.
- Make sure your MongoDB connection string includes the database name (e.g., `/treep` before the query parameters).

## License

ISC
