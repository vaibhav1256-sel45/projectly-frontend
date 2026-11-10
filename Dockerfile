# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Public URL of the site, e.g. https://projectly.duckdns.org (all APIs share one origin behind Caddy)
ARG VITE_API_URL
ENV VITE_USER_URL=$VITE_API_URL \
    VITE_PROJECT_URL=$VITE_API_URL \
    VITE_TASK_URL=$VITE_API_URL \
    VITE_COMMON_URL=$VITE_API_URL
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv
