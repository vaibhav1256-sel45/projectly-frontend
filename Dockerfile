# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Each backend service lives on its own Render URL, so each gets its own build arg
# (Render injects dashboard environment variables into the build as matching ARGs).
ARG VITE_USER_URL
ARG VITE_PROJECT_URL
ARG VITE_TASK_URL
ARG VITE_COMMON_URL
ENV VITE_USER_URL=$VITE_USER_URL \
    VITE_PROJECT_URL=$VITE_PROJECT_URL \
    VITE_TASK_URL=$VITE_TASK_URL \
    VITE_COMMON_URL=$VITE_COMMON_URL
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
