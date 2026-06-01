apps\backend\.env
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRATION=
NODE_ENV=
PORT=
FRONTEND_URL=

apps\frontend\.env.local
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_APP_NAME=

frontend: npm run dev
backend: npm run start:dev
prisma studio: npx prisma studio

Create Schema
# In apps/backend
npx prisma migrate dev --name init 
npx prisma generate
npx prisma db seed

