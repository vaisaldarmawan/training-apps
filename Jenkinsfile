pipeline {
    agent { label 'devops1-agent' }

    stages {
        stage('Pull SCM') {
            steps {
                echo 'Cloning repository...'
                git branch: 'main', url: 'https://github.com/vaisaldarmawan/training-apps.git'
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
                            -Dsonar.login=sqa_855eeb7a69bd11f2287cc91f7fb05e73ff7d1327
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
