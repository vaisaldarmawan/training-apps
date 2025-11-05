FROM node:18.20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev for tests)
RUN npm install

# Copy all application files
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]