pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code from GitHub...'
                checkout scm
            }
        }
        
        stage('Stop Old Containers') {
            steps {
                echo 'Stopping and removing old containers...'
                script {
                    // Stop containers dengan nama yang sama
                    bat '''
                        docker rm -f callmaker-mysql callmaker-backend callmaker-frontend || exit 0
                        docker-compose down -v || exit 0
                    '''
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                echo 'Building Docker images...'
                script {
                    bat 'docker-compose build'
                }
            }
        }
        
        stage('Deploy') {
            steps {
                echo 'Deploying application...'
                script {
                    bat 'docker-compose up -d'
                }
            }
        }
        
        stage('Health Check') {
            steps {
                echo 'Checking application health...'
                script {
                    sleep 20
                    bat 'docker-compose ps'
                    bat 'docker-compose logs --tail=50 backend'
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ Deployment successful!'
            echo 'Backend: http://localhost:5000'
            echo 'Frontend: http://localhost:5173'
        }
        failure {
            echo '❌ Deployment failed!'
            bat 'docker-compose logs --tail=100'
        }
    }
}