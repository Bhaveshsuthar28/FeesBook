# FeesBook

## Backend setup

The Node.js backend lives in the `backend` folder and uses ES modules, Drizzle ORM, and Turso/libSQL.

### Quick start

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The health endpoint is available at:

```
GET http://localhost:3000/api/health
```

### Scripts

- `npm run dev` - start the development server with nodemon
- `npm run build` - installs dependencies (`npm install`)
- `npm start` - start the server without nodemon
