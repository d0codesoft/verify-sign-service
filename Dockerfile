# Use the Node.js official base image
FROM node:22

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the service runs on (e.g., 3770)
EXPOSE 3770

# Start the application
CMD ["node", "main.js"]
