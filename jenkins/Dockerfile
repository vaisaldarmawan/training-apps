FROM jenkins/jenkins:lts-jdk17

USER root

# Install Docker CLI (multi-platform compatible)
RUN apt-get update && \
    apt-get install -y \
    git \
    git-lfs \
    ca-certificates \
    curl \
    gnupg \
    lsb-release && \
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    # Add Docker repository
    echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    # Install Docker CLI and Docker Compose plugin
    apt-get update && \
    apt-get install -y docker-ce-cli docker-compose-plugin && \
    # Cleanup
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Jenkins plugins
RUN jenkins-plugin-cli --plugins \
    git \
    workflow-aggregator \
    docker-workflow \
    sonar \
    blueocean

USER jenkins

# Skip initial setup wizard
ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"
