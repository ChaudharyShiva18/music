# client/Dockerfile

### Build stage
FROM node:18-bullseye as build

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

COPY . /usr/src/app

# Build the production-ready static files
RUN npm run build

### Production stage with Nginx
FROM nginx:stable-alpine
# Copy the React build output to Nginx www folder
COPY --from=build /usr/src/app/build /usr/share/nginx/html

# Expose port 80 (inside container)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
