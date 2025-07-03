# Use an official Node.js runtime as a base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for better Docker cache usage)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code (if using tsc, otherwise skip this step)
RUN npm run build

# Expose the desired port
EXPOSE 3000

# Command to run the app (adjust if using ts-node instead of tsc)
CMD ["node", "dist/index.js"]
