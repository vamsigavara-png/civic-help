# HelpHub Deployment Guide

## Local Development

```bash
# Install dependencies
npm install

# Copy and edit .env
cp .env.example .env

# Run with Docker Compose
docker-compose up

# Or manually:
# 1. Start PostgreSQL
# 2. Run migrations: npx prisma migrate dev --name init
# 3. Seed: npm run seed
# 4. Dev server: npm run dev
```

Access the app at `http://localhost:3000`.

**Admin login:**
- Email: `admin@helphub.local`
- Password: `admin123`

## Production Deployment

### Vercel (Recommended for Next.js)

1. Push to GitHub
2. Connect repo to Vercel
3. Set environment variables:
   - `DATABASE_URL`: PostgreSQL connection (use Supabase, Heroku Postgres, or AWS RDS)
   - `JWT_SECRET`: Strong random value (use `openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL`: Your domain

4. Deploy

```bash
# Local test
npm run build
npm start
```

### Render.com

1. Connect GitHub repo
2. Render will detect `render.yaml`
3. It will:
   - Create PostgreSQL database
   - Build and deploy Next.js app
   - Run Prisma migrations automatically

### Docker (Self-hosted)

```bash
# Build image
docker build -t helphub:latest .

# Run with external Postgres
docker run -d \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="your-secret" \
  -e NEXT_PUBLIC_APP_URL="https://your-domain.com" \
  -p 3000:3000 \
  helphub:latest
```

## Pre-Launch Checklist

- [ ] Database backups configured
- [ ] HTTPS enforced
- [ ] Environment secrets secured (never in git)
- [ ] JWT_SECRET is strong and unique
- [ ] SMTP configured for admin notifications
- [ ] Object storage wired for evidence files
- [ ] Malware scanning enabled
- [ ] Rate limiting switched to Redis for production traffic
- [ ] Admin 2FA enrollment UI built
- [ ] Security headers verified
- [ ] Load testing completed
- [ ] Incident response plan documented
- [ ] Privacy policy reviewed by counsel
- [ ] Data retention policy implemented

## First Admin Setup

1. Database seed creates: `admin@helphub.local` / `admin123`
2. Log in at `/admin/login`
3. Change password immediately
4. Set up TOTP 2FA
5. Create additional admin users via `/admin/settings` (TODO: UI)

## Monitoring

- Monitor error logs (app logs, database slow queries)
- Monitor abuse report queue
- Review audit logs regularly
- Set up alerts for:
  - High complaint volume
  - Evidence scan failures
  - Flagged spam complaints
  - Failed authentication attempts

## Scaling

- Switch rate limiting from Postgres to Redis
- Add read replicas for complaint queries
- Cache public complaint pages with CDN
- Use async job queue for evidence scanning

## Maintenance

```bash
# Update dependencies
npm update

# Regenerate Prisma client
npx prisma generate

# Check migrations
npx prisma migrate status

# Backup database
pg_dump $DATABASE_URL > backup.sql
```
