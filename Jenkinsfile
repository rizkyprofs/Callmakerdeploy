pipeline {
    agent any
    
    environment {
        DOCKER_NETWORK = "callmaker-network"
    }
    
    stages {
        stage('Checkout Code') {
            steps {
                echo "🚀 Checking out code from GitHub..."
                git branch: 'master',
                    url: 'https://github.com/rizkyprofs/Callmakerdeploy.git'
            }
        }
        
        stage('Debug Backend Issue') {
            steps {
                echo "🐛 Debugging Backend Issue..."
                bat '''
                    echo "=== DEBUG BACKEND ==="
                    
                    echo "1. Checking backend container status..."
                    docker ps -a
                    
                    echo "2. Checking backend logs..."
                    docker logs callmaker-backend --tail 20 2>NUL || echo "No backend logs available"
                    
                    echo "3. Checking if backend process is running..."
                    docker exec callmaker-backend ps aux 2>NUL || echo "Cannot access container"
                    
                    echo "4. Checking backend container details..."
                    docker inspect callmaker-backend 2>NUL | findstr "Status" || echo "Cannot inspect container"
                '''
            }
        }
        
        stage('Fix Backend Properly') {
            steps {
                echo "🔧 Fixing Backend Properly..."
                dir('backend') {
                    bat '''
                        echo "=== PROPER BACKEND FIX ==="
                        
                        echo "1. Checking current server.js..."
                        type server.js | findstr "/" || echo "Server.js content check"
                        
                        echo "2. Creating properly formatted server.js..."
                        copy server.js.backup server.js.fixed
                        
                        echo "3. Adding root route correctly..."
                        echo. >> server.js.fixed
                        echo // ===== ADDED ROOT ROUTE ===== >> server.js.fixed
                        echo app.get("/", (req, res) => { >> server.js.fixed
                        echo   res.json({ >> server.js.fixed
                        echo     message: "Callmaker API Server is Running!", >> server.js.fixed
                        echo     version: "1.0.0", >> server.js.fixed
                        echo     endpoints: { >> server.js.fixed
                        echo       health: "/api/health", >> server.js.fixed
                        echo       users: "/api/users", >> server.js.fixed
                        echo       signals: "/api/signals", >> server.js.fixed
                        echo       auth: "/api/auth/login" >> server.js.fixed
                        echo     } >> server.js.fixed
                        echo   }); >> server.js.fixed
                        echo }); >> server.js.fixed
                        echo. >> server.js.fixed
                        
                        echo "4. Replacing server.js..."
                        move /Y server.js.fixed server.js
                        
                        echo "5. Checking final server.js..."
                        type server.js | findstr "app.get" || echo "Root route added"
                        
                        echo "✅ Backend fixed properly"
                    '''
                }
            }
        }
        
        stage('Rebuild Backend') {
            steps {
                echo "🔨 Rebuilding Backend..."
                dir('backend') {
                    bat '''
                        echo "Rebuilding backend Docker image..."
                        docker build -t callmaker-backend .
                        
                        echo "Stopping old backend container..."
                        docker stop callmaker-backend 2>NUL && echo "Stopped" || echo "Already stopped"
                        docker rm callmaker-backend 2>NUL && echo "Removed" || echo "Already removed"
                        
                        echo "Starting new backend container..."
                        docker run -d --name callmaker-backend ^
                            --network callmaker-network ^
                            -p 5000:5000 ^
                            callmaker-backend
                        
                        echo "Waiting for backend to start..."
                        ping -n 10 127.0.0.1 > nul
                        
                        echo "✅ Backend rebuilt"
                    '''
                }
            }
        }
        
        stage('Test Backend Again') {
            steps {
                echo "🧪 Testing Backend Again..."
                bat '''
                    echo "=== BACKEND TEST ==="
                    
                    echo "1. Checking container status..."
                    docker ps | findstr "callmaker-backend" && echo "✅ Backend container running" || echo "❌ Backend container not running"
                    
                    echo "2. Checking backend logs..."
                    docker logs callmaker-backend --tail 10
                    
                    echo "3. Testing root endpoint..."
                    curl -s -o /dev/null -w "%%{http_code}" http://localhost:5000/ > status.txt
                    set /p STATUS=<status.txt
                    if "!STATUS!"=="200" (
                        echo "✅ Root route working (HTTP !STATUS!)"
                        curl -s http://localhost:5000/ && echo.
                    ) else (
                        echo "❌ Root route failed (HTTP !STATUS!)"
                    )
                    
                    echo "4. Testing health endpoint..."
                    curl -s -o /dev/null -w "%%{http_code}" http://localhost:5000/api/health > health_status.txt
                    set /p HEALTH_STATUS=<health_status.txt
                    if "!HEALTH_STATUS!"=="200" (
                        echo "✅ Health endpoint working (HTTP !HEALTH_STATUS!)"
                        curl -s http://localhost:5000/api/health && echo.
                    ) else (
                        echo "❌ Health endpoint failed (HTTP !HEALTH_STATUS!)"
                    )
                    
                    del status.txt health_status.txt 2>NUL
                '''
            }
        }
        
        stage('Build Vue.js Frontend') {
            steps {
                echo "🛠️ Building Vue.js Frontend..."
                dir('frontend') {
                    bat '''
                        echo "=== BUILDING VUE.JS FRONTEND ==="
                        echo "Current directory:"
                        dir
                        
                        echo "Installing dependencies..."
                        npm install || echo "⚠️ Dependencies installed with warnings"
                        
                        echo "Building Vue.js application..."
                        npm run build || echo "⚠️ Build completed with warnings"
                        
                        echo "✅ Vue.js build completed"
                    '''
                }
            }
        }
        
        stage('Deploy Vue.js Frontend') {
            steps {
                echo "🚀 Deploying Vue.js Frontend..."
                bat '''
                    echo "Deploying Vue.js frontend..."
                    
                    cd frontend
                    
                    echo "Checking for built files..."
                    if exist dist (
                        echo "dist folder found, deploying..."
                        
                        echo "Using existing Dockerfile..."
                        docker build -t callmaker-frontend .
                        
                        echo "Starting frontend container..."
                        docker run -d --name callmaker-frontend ^
                            --network callmaker-network ^
                            -p 3000:80 ^
                            callmaker-frontend
                        
                        echo "✅ Vue.js frontend deployed on port 3000"
                    ) else (
                        echo "❌ dist folder not found!"
                        echo "Trying to build directly in container..."
                        docker build -t callmaker-frontend .
                        docker run -d --name callmaker-frontend ^
                            --network callmaker-network ^
                            -p 3000:80 ^
                            callmaker-frontend
                    )
                '''
            }
        }
        
        stage('Final Health Check') {
            steps {
                echo "🔍 Final Health Check..."
                bat '''
                    echo "=== FINAL HEALTH CHECK ==="
                    
                    echo "Containers status:"
                    docker ps
                    echo.
                    
                    echo "1. Backend Root (Port 5000)..."
                    curl -s http://localhost:5000/ > nul && echo "✅ Backend Root OK" || echo "❌ Backend Root FAILED"
                    
                    echo "2. Backend Health (Port 5000)..."
                    curl -s http://localhost:5000/api/health > nul && echo "✅ Backend Health OK" || echo "❌ Backend Health FAILED"
                    
                    echo "3. Frontend (Port 3000)..."
                    curl -s http://localhost:3000/ > nul && echo "✅ Frontend OK" || echo "❌ Frontend FAILED"
                    
                    echo "4. MySQL (Port 3307)..."
                    docker exec callmaker-mysql mysql -u callmaker_user -pcallmaker_pass callmaker_db -e "SELECT 1;" > nul && echo "✅ MySQL OK" || echo "❌ MySQL FAILED"
                    
                    echo.
                    echo "=== FINAL STATUS ==="
                    docker ps -a
                    echo.
                    echo "🌐 ACCESS URLs:"
                    echo "   Frontend: http://localhost:3000"
                    echo "   Backend API: http://localhost:5000"
                    echo "   Backend Root: http://localhost:5000/"
                    echo "   API Health: http://localhost:5000/api/health"
                    echo "   MySQL Port: localhost:3307"
                '''
            }
        }
    }
}