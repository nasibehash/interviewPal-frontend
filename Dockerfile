# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /app

# install first so the layer is cached until package files change
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.29-alpine AS runtime
# nginx renders every *.template in this folder with the container's environment variables
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/interviewpal/browser /usr/share/nginx/html

# where /api is forwarded to (the backend container in docker-compose)
ENV API_URL=http://api:8080
EXPOSE 80
