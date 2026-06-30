# Anonymous Messaging App

Create an account, get a shareable link, and let anyone send you anonymous messages.

## Stack
- Node.js + Express
- PostgreSQL (via `pg`)
- EJS templates
- JWT auth (cookie-based)

## Setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **Create a Postgres database** and copy `.env.example` to `.env`, then fill in:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/anon_msg_db
   JWT_SECRET=some_long_random_string
   PORT=3000
   ```

3. **Run the schema** to create tables:
   ```
   psql "$DATABASE_URL" -f db/schema.sql
   ```
   (or paste the contents of `db/schema.sql` into any Postgres GUI like pgAdmin/TablePlus)

4. **Start the server**
   ```
   node server.js
   ```
   Visit `http://localhost:3000`

## How it works

- Sign up → you get a unique link like `http://yoursite.com/u/yourname-x7k2p`
- Share that link anywhere (bio, group chat, social media)
- Anyone who opens it can type a message and send it — no login required, and the IP/identity isn't stored anywhere
- Log into your dashboard anytime to read (and delete) messages

## Deploying

Any Node host with a Postgres add-on works well: Render, Railway, Fly.io, or a VPS.
- Set `DATABASE_URL` and `JWT_SECRET` as environment variables on the host
- If your Postgres provider requires SSL (common on managed DBs), uncomment the `ssl` line in `db/pool.js`
- Run `db/schema.sql` against the production database once before first use

## Notes on anonymity
The app does **not** log sender IP addresses or any identifying info in the `messages` table — only the message content and timestamp. If you want to add basic spam protection (e.g. rate limiting per IP) without ever storing the IP, let me know and I can add that.
