pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code from GitHub...'
                checkout scm
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
        
        stage('Stop Old Containers') {
            steps {
                echo 'Stopping old containers...'
                script {
                    bat 'docker-compose down || exit 0'
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
                    bat 'docker-compose logs backend'
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
            bat 'docker-compose logs'
        }
    }
}