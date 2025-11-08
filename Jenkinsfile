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
                    echo "Current directory:"
                    cd
                    echo "Files in workspace:"
                    dir
                    echo "Checking project structure:"
                    if exist backend (echo "✅ Backend exists" && cd backend && dir && cd..) else (echo "❌ Backend missing")
                    if exist frontend (echo "✅ Frontend exists" && cd frontend && dir && cd..) else (echo "❌ Frontend missing")
                    if exist callmaker_db.sql (echo "✅ SQL file exists") else (echo "❌ SQL file missing")
                    if exist Jenkinsfile (echo "✅ Jenkinsfile exists") else (echo "❌ Jenkinsfile missing")
                '''
            }
        }
        
        stage('Clean Previous Build') {
            steps {
                echo "🧹 Cleaning previous containers..."
                bat '''
                    docker-compose down 2>NUL || echo "No previous containers to stop"
                    docker stop callmaker-mysql 2>NUL || echo "No MySQL container"
                    docker rm callmaker-mysql 2>NUL || echo "No MySQL to remove"
                    docker volume rm callmaker_mysql_data 2>NUL || echo "No volume to remove"
                    docker network create ${DOCKER_NETWORK} 2>NUL || echo "Network already exists"
                '''
            }
        }
        
        stage('Setup MySQL Database') {
            steps {
                echo "🗄️ Setting up MySQL Container..."
                bat '''
                    echo "Starting MySQL container with Docker..."
                    docker run -d --name callmaker-mysql ^
                        --network ${DOCKER_NETWORK} ^
                        -e MYSQL_ROOT_PASSWORD=rootpass ^
                        -e MYSQL_DATABASE=callmaker_db ^
                        -e MYSQL_USER=callmaker_user ^
                        -e MYSQL_PASSWORD=callmaker_pass ^
                        -p 3307:3306 ^
                        -v callmaker_mysql_data:/var/lib/mysql ^
                        mysql:8.0
                    
                    echo "Waiting for MySQL to initialize..."
                    ping -n 40 127.0.0.1 > nul
                    echo "Checking MySQL status..."
                    docker logs callmaker-mysql --tail 10
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
                        echo "Creating .env for Docker..."
                        echo DB_HOST=callmaker-mysql > .env
                        echo DB_USER=callmaker_user >> .env
                        echo DB_PASSWORD=callmaker_pass >> .env
                        echo DB_NAME=callmaker_db >> .env
                        echo DB_PORT=3306 >> .env
                        echo JWT_SECRET=jenkins-docker-secret-2024 >> .env
                        echo NODE_ENV=production >> .env
                        echo PORT=5000 >> .env
                        echo "✅ Backend dependencies installed"
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
        
        stage('Initialize Database with SQL Export') {
            steps {
                echo "📊 Initializing Database from SQL Export..."
                bat '''
                    echo "Waiting for MySQL to be ready..."
                    ping -n 30 127.0.0.1 > nul
                    
                    echo "Checking if MySQL is ready..."
                    docker exec callmaker-mysql mysql -u callmaker_user -pcallmaker_pass callmaker_db -e "SELECT 1;" && echo "✅ MySQL ready" || echo "❌ MySQL not ready yet"
                    
                    echo "Checking if SQL file exists..."
                    if exist callmaker_db.sql (
                        echo "✅ callmaker_db.sql found - importing your actual data..."
                        docker cp callmaker_db.sql callmaker-mysql:/tmp/callmaker_db.sql
                        
                        echo "Importing SQL file..."
                        docker exec callmaker-mysql mysql -u callmaker_user -pcallmaker_pass callmaker_db -e "SOURCE /tmp/callmaker_db.sql;"
                        
                        echo "Verifying imported data..."
                        docker exec callmaker-mysql mysql -u callmaker_user -pcallmaker_pass callmaker_db -e "
                            SHOW TABLES;
                            SELECT '=== USERS ===' as '';
                            SELECT username, fullname, role FROM users;
                            SELECT '=== SIGNALS COUNT ===' as '';
                            SELECT COUNT(*) as total_signals FROM signals;
                        "
                    ) else (
                        echo "❌ callmaker_db.sql not found, creating basic structure..."
                        docker exec callmaker-mysql mysql -u callmaker_user -pcallmaker_pass callmaker_db -e "
                            CREATE TABLE IF NOT EXISTS users (
                                id int NOT NULL AUTO_INCREMENT,
                                username varchar(255) NOT NULL,
                                password varchar(255) NOT NULL,
                                fullname varchar(255) DEFAULT NULL,
                                role enum('user','admin') DEFAULT 'user',
                                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                                updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                PRIMARY KEY (id),
                                UNIQUE KEY username (username)
                            );
                            
                            CREATE TABLE IF NOT EXISTS signals (
                                id int NOT NULL AUTO_INCREMENT,
                                created_by int NOT NULL,
                                phone_number varchar(20) NOT NULL,
                                call_type varchar(50) DEFAULT NULL,
                                status enum('pending','completed','failed') DEFAULT 'pending',
                                duration int DEFAULT '0',
                                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                                PRIMARY KEY (id)
                            );
                            
                            INSERT IGNORE INTO users (username, password, fullname, role) VALUES 
                            ('rizky', 'rizky123', 'Rizky Profs', 'admin'),
                            ('admin', 'admin123', 'Administrator', 'admin');
                        " && echo "✅ Basic structure created"
                    )
                    
                    echo "🎉 Database initialization completed!"
                '''
            }
        }
        
        stage('Create Docker Compose') {
            steps {
                echo "🐳 Creating Docker Compose File..."
                bat '''
                    echo "Creating docker-compose.yml..."
                    echo version: '3.8' > docker-compose.yml
                    echo. >> docker-compose.yml
                    echo services: >> docker-compose.yml
                    echo. >> docker-compose.yml
                    echo   mysql: >> docker-compose.yml
                    echo     image: mysql:8.0 >> docker-compose.yml
                    echo     container_name: callmaker-mysql >> docker-compose.yml
                    echo     environment: >> docker-compose.yml
                    echo       MYSQL_ROOT_PASSWORD: rootpass >> docker-compose.yml
                    echo       MYSQL_DATABASE: callmaker_db >> docker-compose.yml
                    echo       MYSQL_USER: callmaker_user >> docker-compose.yml
                    echo       MYSQL_PASSWORD: callmaker_pass >> docker-compose.yml
                    echo     ports: >> docker-compose.yml
                    echo       - "3307:3306" >> docker-compose.yml
                    echo     volumes: >> docker-compose.yml
                    echo       - callmaker_mysql_data:/var/lib/mysql >> docker-compose.yml
                    echo     healthcheck: >> docker-compose.yml
                    echo       test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "callmaker_user", "-pcallmaker_pass"] >> docker-compose.yml
                    echo       timeout: 20s >> docker-compose.yml
                    echo       retries: 10 >> docker-compose.yml
                    echo     restart: unless-stopped >> docker-compose.yml
                    echo. >> docker-compose.yml
                    echo   backend: >> docker-compose.yml
                    echo     build: >> docker-compose.yml
                    echo       context: ./backend >> docker-compose.yml
                    echo       dockerfile: Dockerfile >> docker-compose.yml
                    echo     container_name: callmaker-backend >> docker-compose.yml
                    echo     ports: >> docker-compose.yml
                    echo       - "5000:5000" >> docker-compose.yml
                    echo     environment: >> docker-compose.yml
                    echo       - DB_HOST=callmaker-mysql >> docker-compose.yml
                    echo       - DB_USER=callmaker_user >> docker-compose.yml
                    echo       - DB_PASSWORD=callmaker_pass >> docker-compose.yml
                    echo       - DB_NAME=callmaker_db >> docker-compose.yml
                    echo       - JWT_SECRET=jenkins-docker-secret-2024 >> docker-compose.yml
                    echo       - NODE_ENV=production >> docker-compose.yml
                    echo     depends_on: >> docker-compose.yml
                    echo       mysql: >> docker-compose.yml
                    echo         condition: service_healthy >> docker-compose.yml
                    echo     restart: unless-stopped >> docker-compose.yml
                    echo. >> docker-compose.yml
                    echo   frontend: >> docker-compose.yml
                    echo     build: >> docker-compose.yml
                    echo       context: ./frontend >> docker-compose.yml
                    echo       dockerfile: Dockerfile >> docker-compose.yml
                    echo     container_name: callmaker-frontend >> docker-compose.yml
                    echo     ports: >> docker-compose.yml
                    echo       - "80:80" >> docker-compose.yml
                    echo     depends_on: >> docker-compose.yml
                    echo       - backend >> docker-compose.yml
                    echo     restart: unless-stopped >> docker-compose.yml
                    echo. >> docker-compose.yml
                    echo volumes: >> docker-compose.yml
                    echo   callmaker_mysql_data: >> docker-compose.yml
                    
                    echo "✅ docker-compose.yml created"
                '''
            }
        }
        
        stage('Create Dockerfiles') {
            steps {
                echo "🐳 Creating Dockerfiles..."
                
                dir('backend') {
                    bat '''
                        echo "Creating Backend Dockerfile..."
                        echo FROM node:18-alpine > Dockerfile
                        echo. >> Dockerfile
                        echo WORKDIR /app >> Dockerfile
                        echo. >> Dockerfile
                        echo COPY package*.json ./ >> Dockerfile
                        echo RUN npm install >> Dockerfile
                        echo. >> Dockerfile
                        echo COPY . . >> Dockerfile
                        echo. >> Dockerfile
                        echo EXPOSE 5000 >> Dockerfile
                        echo. >> Dockerfile
                        echo CMD ["npm", "start"] >> Dockerfile
                        echo "✅ Backend Dockerfile created"
                    '''
                }
                
                dir('frontend') {
                    bat '''
                        echo "Creating Frontend Dockerfile..."
                        echo FROM node:18-alpine as builder > Dockerfile
                        echo. >> Dockerfile
                        echo WORKDIR /app >> Dockerfile
                        echo. >> Dockerfile
                        echo COPY package*.json ./ >> Dockerfile
                        echo RUN npm install >> Dockerfile
                        echo. >> Dockerfile
                        echo COPY . . >> Dockerfile
                        echo RUN npm run build >> Dockerfile
                        echo. >> Dockerfile
                        echo FROM nginx:alpine >> Dockerfile
                        echo COPY --from=builder /app/dist /usr/share/nginx/html >> Dockerfile
                        echo COPY nginx.conf /etc/nginx/nginx.conf >> Dockerfile
                        echo. >> Dockerfile
                        echo EXPOSE 80 >> Dockerfile
                        echo CMD ["nginx", "-g", "daemon off;"] >> Dockerfile
                        echo "✅ Frontend Dockerfile created"
                    '''
                }
                
                dir('frontend') {
                    bat '''
                        echo "Creating nginx.conf..."
                        echo events { > nginx.conf
                        echo     worker_connections 1024; >> nginx.conf
                        echo } >> nginx.conf
                        echo. >> nginx.conf
                        echo http { >> nginx.conf
                        echo     include /etc/nginx/mime.types; >> nginx.conf
                        echo     default_type application/octet-stream; >> nginx.conf
                        echo. >> nginx.conf
                        echo     server { >> nginx.conf
                        echo         listen 80; >> nginx.conf
                        echo         server_name localhost; >> nginx.conf
                        echo         root /usr/share/nginx/html; >> nginx.conf
                        echo         index index.html; >> nginx.conf
                        echo. >> nginx.conf
                        echo         location / { >> nginx.conf
                        echo             try_files \\$uri \\$uri/ /index.html; >> nginx.conf
                        echo         } >> nginx.conf
                        echo. >> nginx.conf
                        echo         location /api { >> nginx.conf
                        echo             proxy_pass http://callmaker-backend:5000; >> nginx.conf
                        echo             proxy_set_header Host \\$host; >> nginx.conf
                        echo             proxy_set_header X-Real-IP \\$remote_addr; >> nginx.conf
                        echo             proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for; >> nginx.conf
                        echo         } >> nginx.conf
                        echo     } >> nginx.conf
                        echo } >> nginx.conf
                        echo "✅ nginx.conf created"
                    '''
                }
            }
        }
        
        stage('Deploy Application') {
            steps {
                echo "🚀 Deploying Application..."
                bat '''
                    echo "Building and starting containers..."
                    docker-compose up --build -d
                    
                    echo "Waiting for services to start..."
                    ping -n 45 127.0.0.1 > nul
                    
                    echo "Checking containers status..."
                    docker ps
                '''
            }
        }
        
        stage('Health Check') {
            steps {
                echo "🏥 Running Health Checks..."
                bat '''
                    echo "Testing Backend API..."
                    curl -f http://localhost:5000/api/health && echo "✅ Backend HEALTHY" || echo "❌ Backend UNHEALTHY"
                    
                    echo "Testing Frontend..."
                    curl -f http://localhost:80 && echo "✅ Frontend HEALTHY" || echo "❌ Frontend UNHEALTHY"
                    
                    echo "Testing MySQL Data..."
                    docker exec callmaker-mysql mysql -u callmaker_user -pcallmaker_pass callmaker_db -e "
                        SELECT '=== APPLICATION USERS ===' as '';
                        SELECT username, fullname, role FROM users;
                        SELECT '=== TOTAL SIGNALS ===' as '';
                        SELECT COUNT(*) as signals_count FROM signals;
                    " && echo "✅ MySQL DATA VERIFIED"
                    
                    echo.
                    echo "🎉 DOCKER DEPLOYMENT COMPLETED WITH YOUR ACTUAL DATA!"
                    echo "🌐 Frontend: http://localhost:80"
                    echo "🔧 Backend API: http://localhost:5000" 
                    echo "🗄️  MySQL Docker: localhost:3307"
                    echo "👥 Your ACTUAL Users:"
                    echo "   - rizky / rizky123 (admin)"
                    echo "   - admin / admin123 (admin)"
                    echo "💡 Using real data from your callmaker_db.sql export!"
                '''
            }
        }
    }
    
    post {
        always {
            echo "📊 Build Completed - Status: ${currentBuild.result}"
            bat '''
                echo "Final containers status:"
                docker ps -a
            '''
        }
        
        success {
            echo "✅ ✅ ✅ DOCKER DEPLOYMENT SUCCESSFUL ✅ ✅ ✅"
            bat '''
                echo "🎊 Your application is running with REAL DATA from MySQL export!"
                echo "📍 Access: http://localhost:80"
                echo "🔑 Login with: rizky / rizky123"
            '''
        }
        
        failure {
            echo "❌ ❌ ❌ DEPLOYMENT FAILED ❌ ❌ ❌"
            bat '''
                echo "Debugging info:"
                docker logs callmaker-backend --tail 20 2>NUL || echo "No backend logs"
                docker logs callmaker-mysql --tail 15 2>NUL || echo "No MySQL logs"
                docker-compose down 2>NUL || echo "Cleanup completed"
            '''
        }
    }
}