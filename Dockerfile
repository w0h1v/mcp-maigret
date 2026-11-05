# Use the official Node.js 24 LTS image as the base image
FROM node:24-slim AS build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install the project dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Create a new stage for the production image
FROM node:24-slim

# Set the working directory in the container
WORKDIR /app

# Copy the built application from the build stage
COPY --from=build /app/build /app/build
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/package-lock.json /app/package-lock.json

# Install only production dependencies
RUN npm ci --omit=dev

# Bundle maigret (with the pdf extra) so the image runs without a Docker daemon,
# for example on hosted MCP platforms. Pinned for reproducible results (#22).
ARG MAIGRET_VERSION=0.6.6
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-venv \
 && rm -rf /var/lib/apt/lists/* \
 && python3 -m venv /opt/maigret \
 && /opt/maigret/bin/pip install --no-cache-dir "maigret[pdf]==${MAIGRET_VERSION}" \
 && /opt/maigret/bin/maigret --version
ENV PATH=/opt/maigret/bin:$PATH
ENV MAIGRET_RUNNER=local

# Set environment variable for the reports directory
ENV MAIGRET_REPORTS_DIR=/app/reports

# Create the reports directory
RUN mkdir -p $MAIGRET_REPORTS_DIR

# Expose the port on which the application will run
EXPOSE 3000

# Command to run the application
ENTRYPOINT ["node", "build/index.js"]