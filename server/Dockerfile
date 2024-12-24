# server/Dockerfile
FROM node:18-bullseye

# Install system deps for Python, pip, ffmpeg, etc.
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python libraries
# spotdl & yt-dlp & others (requests, mutagen, ytmusicapi)
RUN pip3 install spotdl yt-dlp requests mutagen ytmusicapi

# Create app directory
WORKDIR /app

# Copy package.json & package-lock.json first
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy the rest of the server code
COPY . /app

# Expose port 5000
EXPOSE 5000

# By default, "npm run dev" or "npm start" as desired:
# For dev environment with nodemon, ensure nodemon is installed
# and "dev": "nodemon index.js" is in package.json scripts.
CMD ["npm", "run", "dev"]
