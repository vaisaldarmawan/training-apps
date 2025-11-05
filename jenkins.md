# 🚀 Jenkins CI/CD Setup
### Docker Compose + Jenkins Pipeline (Windows, Linux, macOS)
---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Setup Instructions](#setup-instructions)
4. [Jenkins Configuration](#jenkins-configuration)
5. [Pipeline Setup](#pipeline-setup)

---

## Overview

Setup ini memberikan complete CI/CD environment dengan:
- ✅ **Jenkins** - CI/CD orchestration & UI
- ✅ **Jenkins Agent** - Worker node untuk menjalankan build
- ✅ **SonarQube** - Code quality & security analysis
- ✅ **PostgreSQL** - Database untuk SonarQube
- ✅ **Docker-in-Docker** - Build & deploy containers

**Architecture:**
```
┌─────────────────────────────────────────────────────┐
│                  Docker Host                         │
│  ┌──────────────────────────────────────────────┐  │
│  │         jenkins-net Network                   │  │
│  │                                                │  │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────────┐ │  │
│  │  │ Jenkins │  │  Agent  │  │  SonarQube   │ │  │
│  │  │  :8080  │  │ (Worker)│  │   :9000      │ │  │
│  │  └────┬────┘  └────┬────┘  └──────┬───────┘ │  │
│  │       │            │                │         │  │
│  │       └────────────┴────────────────┘         │  │
│  │                    │                           │  │
│  │              ┌─────▼──────┐                   │  │
│  │              │ PostgreSQL │                   │  │
│  │              │   :5432    │                   │  │
│  │              └────────────┘                   │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │          Docker Socket                        │  │
│  │      /var/run/docker.sock                     │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```
---

## Project Structure

```
training-apps/
├── docker-compose.yml          # Main orchestration
├── Jenkinsfile                 # Pipeline definition
├── README.md                   # This file
│
├── app/
│   ├── Dockerfile             # Application container
│   ├── package.json
│   ├── app.js
│   └── ... (application code)
│
├── jenkins/
│   └── Dockerfile             # Jenkins master
│
└── jenkins-agent/
    └── Dockerfile             # Jenkins agent/worker
```

---

## Configuration Files

### 1. docker-compose.yml

**Complete multi-platform configuration:**

```yaml
name: simple

services:
  app:
    build: ./app
    container_name: simple-app
    ports:
      - "5050:3000"
    volumes:
      - vol-simple:/app/public/images/
    networks:
      - jenkins-net
    restart: unless-stopped

  sonarqube:
    image: sonarqube:9.9.1-community
    container_name: simple-sonarqube
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "9000:9000"
    environment:
      - SONAR_JDBC_URL=jdbc:postgresql://db:5432/sonar
      - SONAR_JDBC_USERNAME=sonar
      - SONAR_JDBC_PASSWORD=sonar
      - SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_extensions:/opt/sonarqube/extensions
      - sonarqube_logs:/opt/sonarqube/logs
    deploy:
      resources:
        limits:
          memory: 2g
    networks:
      - jenkins-net
    restart: unless-stopped

  db:
    image: postgres:15
    container_name: simple-db
    environment:
      - POSTGRES_USER=sonar
      - POSTGRES_PASSWORD=sonar
      - POSTGRES_DB=sonar
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sonar"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - jenkins-net
    restart: unless-stopped

  jenkins:
    build: ./jenkins
    container_name: simple-jenkins
    user: root
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - JAVA_OPTS=-Djenkins.install.runSetupWizard=false
      - DOCKER_HOST=unix:///var/run/docker.sock
    networks:
      - jenkins-net
    restart: unless-stopped

  agent:
    build: ./jenkins-agent
    container_name: simple-agent
    user: root
    depends_on:
      - jenkins
    environment:
      - JENKINS_URL=http://jenkins:8080
      - JENKINS_AGENT_NAME=devops1-agent
      - JENKINS_AGENT_WORKDIR=/home/jenkins/agent
      - JENKINS_SECRET=
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - agent_workspace:/home/jenkins/agent
    networks:
      - jenkins-net
    restart: unless-stopped

volumes:
  vol-simple:
  sonarqube_data:
  sonarqube_extensions:
  sonarqube_logs:
  postgres_data:
  jenkins_home:
  agent_workspace:

networks:
  jenkins-net:
    driver: bridge
```

---

### 2. jenkins/Dockerfile

**Multi-platform Jenkins master with Docker CLI:**

```dockerfile
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
```

---

### 3. jenkins-agent/Dockerfile

**Multi-platform agent with Node.js, Docker, and SonarScanner:**

```dockerfile
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
```

---

### 4. app/Dockerfile

**Simple Node.js application:**

```dockerfile
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
```

---

### 5. Jenkinsfile

**Complete CI/CD pipeline:**

```groovy
pipeline {
    agent { label 'devops1-agent' }

    stages {
        stage('Pull SCM') {
            steps {
                echo 'Cloning repository...'
                git branch: 'main', url: 'https://github.com/USERNAME/training-apps.git'
            }
        }
        
        stage('Build') {
            steps {
                echo 'Installing dependencies...'
                dir('app') {
                    sh 'npm install'
                }
            }
        }
        
        stage('Testing') {
            steps {
                echo 'Running tests...'
                dir('app') {
                    sh '''
                        npm test
                        npm run test:coverage
                    '''
                }
            }
            post {
                always {
                    echo 'Test stage completed'
                }
            }
        }
        
        stage('Code Review') {
            steps {
                echo 'Running SonarQube analysis...'
                dir('app') {
                    sh '''
                        sonar-scanner \
                            -Dsonar.projectKey=simple-apps \
                            -Dsonar.sources=. \
                            -Dsonar.host.url=http://sonarqube:9000 \
                            -Dsonar.login=
                    '''
                }
            }
        }
        
        stage('Deploy') {
            steps {
                echo 'Deploying application...'
                sh '''
                    docker compose build app
                    docker compose up -d --force-recreate --no-deps app
                '''
            }
        }

        stage('Backup') {
            steps {
                echo 'Pushing image to registry...'
                sh 'docker compose push app || echo "Push failed or not configured"'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
        always {
            echo 'Cleaning up workspace...'
        }
    }
}
```

---

## Setup Instructions

### Step 1: Start All Services

**Windows (PowerShell):**
```powershell
docker compose up -d --build
```

**macOS/Linux:**
```bash
docker compose up -d --build
```

**First build will take 7-10 minutes** depending on internet speed.

### Step 2: Verify All Containers Running

```bash
docker compose ps
```

Expected output - all should show "Up":
```
NAME                STATUS
simple-app          Up
simple-jenkins      Up
simple-agent        Up
simple-sonarqube    Up
simple-db           Up (healthy)
```

### Step 3: Access Services

Open in your browser:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Jenkins** | http://localhost:8080 | Initial admin password (see below) |
| **SonarQube** | http://localhost:9000 | admin / admin (change on first login) |
| **Application** | http://localhost:5050 | No auth |

**Get Jenkins Initial Password:**
```bash
docker exec simple-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

---

## Jenkins Configuration

### Step 1: Initial Setup Wizard

1. Access http://localhost:8080
2. Enter the initial admin password
3. Click **Install suggested plugins**
   Kamu harus sudah lihat plugin seperti:
   - Docker Pipeline
   - Pipeline
   - Pipeline: Github
   - Pipeline: Stage View Plugin
   - SonarQube Scanner for Jenkins
5. Wait for plugins to install (~2-3 minutes)
6. Create your admin user
7. Save and Continue
8. Jenkins URL: http://localhost:8080 (default is fine)
9. Click **Start using Jenkins**

### Step 2: Configure Jenkins Agent

1. Go to **Manage Jenkins** → **Manage Nodes and Clouds**
2. Click **New Node**
3. Configuration:
   - **Node name:** `devops1-agent`
   - **Type:** Permanent Agent
   - Click **Create**

4. Node settings:
   - **Number of executors:** `2`
   - **Remote root directory:** `/home/jenkins/agent`
   - **Labels:** `devops1-agent`
   - **Usage:** Use this node as much as possible
   - **Launch method:** Launch agent by connecting it to the controller

5. Click **Save**

6. **Copy the secret** shown on the screen (looks like: `abc123def456...`)

### Step 3: Update Agent Secret

Edit `docker-compose.yml` and add the secret:

```yaml
agent:
  environment:
    - JENKINS_SECRET=paste-your-secret-here  # ← ADD YOUR SECRET
```

Restart agent:
```bash
docker compose up -d agent
```

Verify agent is connected:
```bash
docker logs simple-agent
# Should see: "Connected"
```

In Jenkins UI, agent should show as "Connected" with green icon.
---

## Pipeline Setup

### Step 1: Create Pipeline Job

1. In Jenkins, click **New Item**
2. Enter name: `simple-app-pipeline`
3. Select: **Pipeline**
4. Click **OK**

### Step 2: Configure Pipeline

1. Scroll to **Pipeline** section
2. Definition: **Pipeline script from SCM**
3. SCM: **Git**
4. Repository URL: `https://github.com/YOUR_USERNAME/training-apps.git`
5. Branch: `*/main`
6. Script Path: `Jenkinsfile`
7. Click **Save**

### Step 3: Update Jenkinsfile in Repository

Update your Jenkinsfile on GitHub with correct values:

1. Repository URL (line 8)
2. SonarQube token (line 39 - or use credentials)

**Better approach - use credentials:**
```groovy
stage('Code Review') {
    steps {
        dir('app') {
            sh '''
                sonar-scanner \
                    -Dsonar.projectKey=simple-apps \
                    -Dsonar.sources=. \
                    -Dsonar.host.url=http://sonarqube:9000 \
                    -Dsonar.login=${SONAR_TOKEN}
            '''
        }
    }
}
```

### Step 4: Run Pipeline

1. In Jenkins, go to your pipeline job
2. Click **Build Now**
3. Watch the build progress in **Blue Ocean** or classic UI

**Expected stages:**
```
✅ Pull SCM          - Clone code
✅ Build             - npm ci
✅ Testing           - Run tests (100% coverage)
✅ Code Review       - SonarQube analysis
✅ Deploy            - Rebuild & restart container
✅ Backup            - Optional backup step
```

### Step 5: View Results

- **Jenkins:** Pipeline execution logs
- **SonarQube:** http://localhost:9000/dashboard?id=simple-apps
- **Application:** http://localhost:5050

---

## Troubleshooting

### Issue: Container keeps restarting

**Check logs:**
```bash
docker logs simple-agent
docker logs simple-app
```

**Common fixes:**
```bash
# Clean restart
docker compose down
docker compose up -d --build

# Check agent connection
docker exec simple-agent docker ps
```

### Issue: Jenkins agent not connecting

**Solution:**
1. Verify secret is correct in docker-compose.yml
2. Restart agent: `docker compose restart agent`
3. Check logs: `docker logs simple-agent`

### Issue: Port already in use

**Find what's using the port:**
```bash
# macOS/Linux
lsof -i :8080

# Windows
netstat -ano | findstr :8080
```

**Solution:** Stop the process or change port in docker-compose.yml

---

## Common Commands Reference

```bash
# Start all services
docker compose up -d

# Rebuild specific service
docker compose build --no-cache jenkins
docker compose up -d jenkins

# View logs
docker compose logs -f agent

# Stop all
docker compose down

# Stop and remove volumes (⚠️ deletes data)
docker compose down -v

# Check status
docker compose ps

# Execute command in container
docker exec simple-agent docker ps

# Restart service
docker compose restart agent

# Clean everything
docker system prune -a
```

---

## Summary

| Component | Purpose | Port |
|-----------|---------|------|
| Jenkins | CI/CD controller & UI | 8080 |
| Agent | Worker node for builds | - |
| SonarQube | Code quality analysis | 9000 |
| PostgreSQL | SonarQube database | 5432 |
| Application | Your Node.js app | 5050 |

---

**🎉 Congratulations!** 

Your complete CI/CD environment is now ready. Every push to your repository can automatically trigger:
- Automated testing
- Code quality analysis
- Security scanning
- Containerized deployment

**Happy building!** 🚀

---