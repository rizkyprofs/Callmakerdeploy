pipeline {
    agent any
    
    stages {
        stage('Test Environment') {
            steps {
                bat '''
                    echo "=== BASIC CHECKS ==="
                    echo "Docker:"
                    docker --version
                    echo "Node:"
                    node --version 2>NUL || echo "Node not found"
                    echo "NPM:"
                    npm --version 2>NUL || echo "NPM not found"
                    echo "Git:"
                    git --version
                    echo "Current dir:"
                    cd
                    dir
                '''
            }
        }
        
        stage('Checkout') {
            steps {
                git branch: 'master',
                    url: 'https://github.com/rizkyprofs/Callmakerdeploy.git'
                
                bat '''
                    echo "Files after checkout:"
                    dir
                    echo "Backend:"
                    if exist backend (cd backend && dir && cd..)
                    echo "Frontend:"
                    if exist frontend (cd frontend && dir && cd..)
                '''
            }
        }
        
        stage('Simple Deploy') {
            steps {
                bat '''
                    echo "Starting simple deployment..."
                    echo "1. Starting MySQL..."
                    docker run -d --name test-mysql -e MYSQL_ROOT_PASSWORD=test -p 3306:3306 mysql:8.0
                    
                    echo "2. Waiting for MySQL..."
                    ping -n 10 127.0.0.1 > nul
                    
                    echo "3. Checking MySQL..."
                    docker ps
                    
                    echo "4. Cleaning up..."
                    docker stop test-mysql
                    docker rm test-mysql
                    
                    echo "✅ Simple test completed!"
                '''
            }
        }
    }
}