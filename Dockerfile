# Use Node.js LTS (Long Term Support) version
FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./


# Install dependencies
RUN npm install

# Copy app source code
COPY . .

# Expose the port your app runs on
ENV PORT=8080
EXPOSE 8080

# Start the application
CMD [ "node", "src/index.js" ]
