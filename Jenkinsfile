pipeline {
    agent any
    
    environment {
        PROJECT_NAME = "CallmakerDeploy"
        DOCKER_NETWORK = "callmaker-network"
    }
    
    stages {
        stage('Checkout Code') {
            steps {
                echo "🚀 Checking out code from GitHub..."
                git branch: 'master',
                    url: 'https://github.com/rizkyprofs/Callmakerdeploy.git'
                
                bat '''
                    echo "=== WORKSPACE INFO ==="
                    cd
                    dir
                    echo "=== BACKEND STRUCTURE ==="
                    if exist backend (cd backend && dir && cd..) else (echo "Backend missing!")
                    echo "=== FRONTEND STRUCTURE ==="  
                    if exist frontend (cd frontend && dir && cd..) else (echo "Frontend missing!")
                '''
            }
        }
        
        stage('Clean Previous Build') {
            steps {
                echo "🧹 Cleaning previous containers..."
                bat '''
                    echo "Stopping and removing containers..."
                    docker-compose down 2>NUL || echo "Docker-compose cleanup done"
                    
                    echo "Stopping individual containers..."
                    docker stop callmaker-backend 2>NUL || echo "No backend container"
                    docker stop callmaker-frontend 2>NUL || echo "No frontend container" 
                    docker stop callmaker-mysql 2>NUL || echo "No MySQL container"
                    
                    echo "Removing containers..."
                    docker rm callmaker-backend 2>NUL || echo "No backend to remove"
                    docker rm callmaker-frontend 2>NUL || echo "No frontend to remove"
                    docker rm callmaker-mysql 2>NUL || echo "No MySQL to remove"
                    
                    echo "Removing volumes..."
                    docker volume rm callmaker_mysql_data 2>NUL || echo "No volume to remove"
                    
                    echo "Creating network..."
                    docker network create ${DOCKER_NETWORK} 2>NUL || echo "Network exists"
                    
                    echo "✅ Cleanup completed"
                '''
            }
        }
        
        stage('Setup MySQL Database') {
            steps {
                echo "🗄️ Setting up MySQL Container..."
                bat '''
                    echo "Starting MySQL container..."
                    docker run -d --name callmaker-mysql ^
                        --network ${DOCKER_NETWORK} ^
                        -e MYSQL_ROOT_PASSWORD=rootpass ^
                        -e MYSQL_DATABASE=callmaker_db ^
                        -e MYSQL_USER=callmaker_user ^
                        -e MYSQL_PASSWORD=callmaker_pass ^
                        -p 3307:3306 ^
                        -v callmaker_mysql_data:/var/lib/mysql ^
                        mysql:8.0
                    
                    echo "Waiting for MySQL to initialize (40 seconds)..."
                    ping -n 40 127.0.0.1 > nul
                    
                    echo "Checking MySQL status..."
                    docker logs callmaker-mysql --tail 10
                    echo "✅ MySQL container started"
                '''
            }
        }
        
        stage('Install Backend Dependencies') {
            steps {
                echo "📦 Installing Backend Dependencies..."
                dir('backend') {
                    bat '''
                        echo "Installing backend dependencies..."
                        npm install
                        echo "Updating .env for Docker..."
                        echo DB_HOST=callmaker-mysql > .env
                        echo DB_USER=callmaker_user >> .env
                        echo DB_PASSWORD=callmaker_pass >> .env
                        echo DB_NAME=callmaker_db >> .env
                        echo DB_PORT=3306 >> .env
                        echo JWT_SECRET=jenkins-docker-secret-2024 >> .env
                        echo NODE_ENV=production >> .env
                        echo PORT=5000 >> .env
                        echo "✅ Backend setup completed"
                    '''
                }
            }
        }
        
        stage('Install Frontend Dependencies') {
            steps {
                echo "📦 Installing Frontend Dependencies..."
                dir('frontend') {
                    bat '''
                        echo "Installing frontend dependencies..."
                        npm install
                        echo "✅ Frontend dependencies installed"
                    '''
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                echo "🏗️ Building Frontend..."
                dir('frontend') {
                    bat '''
                        echo "Building frontend application..."
                        npm run build
                        echo "✅ Frontend built successfully"
                    '''
                }
            }
        }
        
        stage('Initialize Database') {
            steps {
                echo "📊 Initializing Database..."
                bat '''
                    echo "Waiting for MySQL to be ready..."
                    ping -n 10 127.0.0.1 > nul
                    
                    echo "Checking MySQL connection..."
                    docker exec callmaker-mysql mysql -u callmaker_user -pcallmaker_pass callmaker_db -e "SELECT 1;" && echo "✅ MySQL connected" || echo "⚠️ MySQL connecting..."
                    
                    echo "Importing database from SQL file..."
                    if exist callmaker_db.sql (
                        echo "SQL file found, importing data..."
                        docker cp callmaker_db.sql callmaker-mysql:/tmp/callmaker_db.sql
                        docker exec callmaker-mysql mysql -u callmaker_user -pcallmaker_pass callmaker_db -e "SOURCE /tmp/callmaker_db.sql;"
                        echo "✅ Database imported successfully"
                    ) else (
                        echo "❌ SQL file not found"
                        exit 1
                    )
                    
                    echo "Verifying data..."
                    docker exec callmaker-mysql mysql -u callmaker_user -pcallmaker_pass callmaker_db -e "
                        SHOW TABLES;
                        SELECT COUNT(*) as user_count FROM users;
                        SELECT COUNT(*) as signal_count FROM signals;
                    "
                '''
            }
        }
        
        stage('Deploy Application') {
            steps {
                echo "🚀 Deploying Application..."
                bat '''
                    echo "Using existing docker-compose.yml..."
                    echo "Starting application stack..."
                    docker-compose up --build -d
                    
                    echo "Waiting for services to start (30 seconds)..."
                    ping -n 30 127.0.0.1 > nul
                    
                    echo "Checking containers status..."
                    docker ps
                    echo "✅ Application deployment completed"
                '''
            }
        }
        
        stage('Health Check') {
            steps {
                echo "🏥 Running Health Checks..."
                bat '''
                    echo "Testing Backend API (max 3 attempts)..."
                    for /l %%x in (1,1,3) do (
                        curl -f http://localhost:5000/api/health && (
                            echo "✅ Backend HEALTHY" 
                            goto backend_healthy
                        ) || (
                            echo "Attempt %%x: Backend starting..."
                            ping -n 5 127.0.0.1 > nul
                        )
                    )
                    echo "❌ Backend UNHEALTHY after 3 attempts"
                    exit 1
                    
                    :backend_healthy
                    echo "Testing Frontend..."
                    curl -f http://localhost:80 && echo "✅ Frontend HEALTHY" || echo "❌ Frontend UNHEALTHY"
                    
                    echo "Testing Database Connection..."
                    docker exec callmaker-mysql mysql -u callmaker_user -pcallmaker_pass callmaker_db -e "
                        SELECT '=== DEPLOYMENT SUCCESS ===' as '';
                        SELECT username, role FROM users;
                        SELECT 'Total signals:' as '', COUNT(*) as count FROM signals;
                    " && echo "✅ Database VERIFIED"
                    
                    echo.
                    echo "🎉🎉🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉🎉🎉"
                    echo "================================================"
                    echo "🌐 Frontend URL: http://localhost:80"
                    echo "🔧 Backend API: http://localhost:5000" 
                    echo "🗄️  MySQL: localhost:3307"
                    echo "👥 Login with: rizky / rizky123"
                    echo "================================================"
                '''
            }
        }
    }
    
    post {
        always {
            echo "📊 Build Completed - Status: ${currentBuild.result}"
            bat '''
                echo "=== FINAL CONTAINERS STATUS ==="
                docker ps -a
                echo "=== BACKEND LOGS (last 10 lines) ==="
                docker logs callmaker-backend --tail 10 2>NUL || echo "No backend logs"
                echo "=== MYSQL LOGS (last 10 lines) ==="
                docker logs callmaker-mysql --tail 10 2>NUL || echo "No MySQL logs"
            '''
        }
        
        success {
            echo "✅ ✅ ✅ DEPLOYMENT SUCCESSFUL ✅ ✅ ✅"
            bat '''
                echo " "
                echo "🎊 APPLICATION IS RUNNING! 🎊"
                echo "Open http://localhost:80 in your browser"
                echo "Use credentials: rizky / rizky123"
            '''
        }
        
        failure {
            echo "❌ ❌ ❌ DEPLOYMENT FAILED ❌ ❌ ❌"
            bat '''
                echo "=== TROUBLESHOOTING INFO ==="
                echo "Backend logs:"
                docker logs callmaker-backend --tail 20 2>NUL || echo "No backend logs"
                echo "MySQL logs:"
                docker logs callmaker-mysql --tail 15 2>NUL || echo "No MySQL logs"
                echo "Frontend logs:"
                docker logs callmaker-frontend --tail 10 2>NUL || echo "No frontend logs"
                echo "Cleaning up..."
                docker-compose down 2>NUL || echo "Cleanup completed"
            '''
        }
    }
}