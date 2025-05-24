# frontend/Dockerfile

# Fáza buildovania
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
# Ak používaš yarn:
# COPY package.json yarn.lock ./

RUN npm install --legacy-peer-deps
# Ak používaš yarn:
# RUN yarn install --frozen-lockfile

COPY . .

# Nastav API URL pre build time, ak by si ho potreboval počas `npm run build`
# Ale lepšie je ho nastaviť ako runtime environment premennú
# ARG NEXT_PUBLIC_API_URL
# ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build
# Ak používaš yarn:
# RUN yarn build

# Produkčná fáza
FROM node:20-alpine
WORKDIR /app

# Skopíruj iba potrebné súbory z build fázy
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
# Skopíruj len produkčné node_modules, ak ich build fáza generuje oddelene
# alebo skopíruj všetky a Next.js si poradí
COPY --from=builder /app/node_modules ./node_modules
# Pre čistú inštaláciu produkčných závislostí:
# RUN npm ci --omit=dev

ENV NODE_ENV production

EXPOSE 3000

# Príkaz na spustenie produkčného servera
CMD ["npm", "start"]
# Ak používaš yarn:
# CMD ["yarn", "start"]