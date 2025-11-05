# SonarQube + PostgreSQL + SonarScanner Setup

## Docker Compose 

Update a file named `docker-compose.yml`:

```yaml

services:
  sonarqube:
    image: sonarqube:9.9.1-community
    container_name: simple-sonarqube
    depends_on:
      - db
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

volumes:
  vol-simple:
  sonarqube_data:
  sonarqube_extensions:
  sonarqube_logs:
  postgres_data:
```

---

## Run SonarQube + PostgreSQL

```bash
docker compose build
```

```bash
docker compose up -d
```

Then open your browser:
```
http://localhost:9000
```

Default credentials:
```
Username: admin
Password: admin
```

You’ll be prompted to change the password at first login.

---

## Install SonarScanner

SonarScanner is used to analyze your source code and send reports to your SonarQube instance.

---

### **Ubuntu / Linux Installation**

```bash
sudo apt update
sudo apt install unzip -y

# Download and extract
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-7.3.0.5189-linux-x64.zip
unzip sonar-scanner-cli-7.3.0.5189-linux-x64.zip

# Move and set permissions
sudo mv -v sonar-scanner-7.3.0.5189-linux-x64 /opt/sonar-scanner
sudo chown -R sonar:sonar /opt/sonar-scanner

# Create global symlink
sudo ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/bin/sonar-scanner
```

---

### **macOS Installation**

Using **Homebrew** (recommended):

```bash
brew install sonar-scanner
```

---

### **Windows Installation**

1. Download from:  
   👉 [https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/](https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/)

2. Extract to:  
   `C:\sonar-scanner`

3. Add this path to **Environment Variables → PATH**:  
   ```
   C:\sonar-scanner\bin
   ```

4. Test installation:  
   ```
   sonar-scanner -v
   ```

---

## Configure Project for Scanning

Create a configuration file in your project root:
```bash
vim sonar-project.properties
```

```properties
# must be unique in a given SonarQube instance
sonar.projectKey=simple-apps

# --- optional properties ---

# defaults to project key
sonar.projectName=simple-apps
# defaults to 'not provided'
sonar.projectVersion=1.0
 
# Path is relative to the sonar-project.properties file. Defaults to .
sonar.sources=.
 
# Encoding of the source code. Default is default system encoding
sonar.sourceEncoding=UTF-8

sonar.exclusions=coverage/**, node_modules/**, testing/**

sonar.tests=testing/

sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

---

## Run SonarScanner

Run the scanner from your project directory:

```bash
sonar-scanner \
  -Dsonar.projectKey=Simple-Apps \
  -Dsonar.sources=. \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=<your_token_here>
```

> 💡 **Tip:**  
> Generate a token in SonarQube UI:  
> **My Account → Security → Generate Tokens**

---

## Verify Results

After the scan completes, open your browser and visit:

```
http://localhost:9000/dashboard?id=Simple-Apps
```

You’ll see the analysis results including bugs, vulnerabilities, and code smells.

---
