# ── Stage 1: Build ───────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# ── Stage 2: Runtime ─────────────────────────────────────────────────
FROM node:20-slim AS runner

# Install Python3 + PyMuPDF
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/* \
    && pip3 install pymupdf --break-system-packages

WORKDIR /app

ENV NODE_ENV=production

# Copy Next.js standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy PDF processor and templates (needed at runtime)
COPY --from=builder /app/lib/pdf_processor.py ./lib/pdf_processor.py
COPY --from=builder /app/templates ./templates

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
