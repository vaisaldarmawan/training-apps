FROM jenkins/inbound-agent:latest-jdk17

USER root

# Install basic tools
RUN apt-get update && \
    apt-get install -y \
    curl \
    gnupg2 \
    git \
    git-lfs \
    ca-certificates \
    unzip \
    lsb-release \
    wget && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js 18.x
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get update && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Docker CLI and Docker Compose
RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli docker-compose-plugin && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install SonarScanner (platform-independent, runs on JVM)
RUN mkdir -p /opt/sonar-scanner && \
    curl -fsSL -o /tmp/sonar.zip https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006.zip && \
    unzip -q /tmp/sonar.zip -d /opt/sonar-scanner && \
    SCANNER_DIR=$(ls -d /opt/sonar-scanner/sonar-scanner-* | head -n 1) && \
    ln -sf $SCANNER_DIR/bin/sonar-scanner /usr/local/bin/sonar-scanner && \
    chmod +x /usr/local/bin/sonar-scanner && \
    chmod +x $SCANNER_DIR/bin/sonar-scanner && \
    rm /tmp/sonar.zip

# Verify
RUN echo "=== Verifying ===" && \
    node -v && npm -v && \
    git --version && \
    docker --version && \
    docker compose version && \
    sonar-scanner --version

ENV PATH="/usr/local/bin:${PATH}"
ENV DOCKER_HOST=unix:///var/run/docker.sock

USER jenkins
WORKDIR /home/jenkins/agent
