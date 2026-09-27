FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_SHOPIER_VIP_URL=
ARG VITE_VIP_PRICE_LABEL=₺199
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_SHOPIER_VIP_URL=${VITE_SHOPIER_VIP_URL}
ENV VITE_VIP_PRICE_LABEL=${VITE_VIP_PRICE_LABEL}

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD ["wget", "--quiet", "--tries=1", "--spider", "http://127.0.0.1/"]
