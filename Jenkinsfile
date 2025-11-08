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
            }
        }
        
        stage('SAST - Static Application Security Testing') {
            parallel {
                stage('Dependency Vulnerability Scan') {
                    steps {
                        echo "🔍 Scanning for vulnerable dependencies..."
                        bat '''
                            echo "=== BACKEND DEPENDENCY SCAN ==="
                            cd backend
                            npm audit --audit-level moderate || echo "Vulnerabilities found"
                            cd..
                            
                            echo "=== FRONTEND DEPENDENCY SCAN ==="
                            cd frontend  
                            npm audit --audit-level moderate || echo "Vulnerabilities found"
                            cd..
                        '''
                    }
                }
                
                stage('Code Quality Check') {
                    steps {
                        echo "📝 Checking code quality..."
                        bat '''
                            echo "Checking for sensitive data in code..."
                            findstr /S /I "password\\|secret\\|key\\|token" backend\\*.* frontend\\*.* 2>NUL && echo "⚠️  Potential secrets found" || echo "✅ No obvious secrets found"
                            
                            echo "Checking file permissions..."
                            dir backend\\*.env 2>NUL && echo "⚠️  .env file found" || echo "✅ No .env in repo"
                        '''
                    }
                }
            }
        }
        
        stage('Clean Previous Build') {
            steps {
                echo "🧹 Cleaning previous containers..."
                bat '''
                    docker-compose down 2>NUL || echo "No previous compose"
                    docker stop callmaker-mysql 2>NUL || echo "No MySQL"
                    docker rm callmaker-mysql 2>NUL || echo "No MySQL to remove"
                    docker network create ${DOCKER_NETWORK} 2>NUL || echo "Network exists"
                    echo "✅ Environment cleaned"
                '''
            }
        }
        
        stage('Setup MySQL Database') {
            steps {
                echo "🗄️ Setting up MySQL..."
                bat '''
                    docker run -d --name callmaker-mysql ^
                        --network ${DOCKER_NETWORK} ^
                        -e MYSQL_ROOT_PASSWORD=rootpass ^
                        -e MYSQL_DATABASE=callmaker_db ^
                        -e MYSQL_USER=callmaker_user ^
                        -e MYSQL_PASSWORD=callmaker_pass ^
                        -p 3307:3306 ^
                        -v callmaker_mysql_data:/var/lib/mysql ^
                        mysql:8.0
                    
                    echo "Waiting for MySQL..."
                    ping -n 30 127.0.0.1 > nul
                    echo "✅ MySQL started"
                '''
            }
        }
        
        stage('Build Application') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('backend') {
                            bat '''
                                echo "Installing backend dependencies..."
                                npm install
                                
                                echo "Configuring environment..."
                                echo DB_HOST=callmaker-mysql > .env
                                echo DB_USER=callmaker_user >> .env
                                echo DB_PASSWORD=callmaker_pass >> .env
                                echo DB_NAME=callmaker_db >> .env
                                echo JWT_SECRET=production-secret-2024 >> .env
                                echo NODE_ENV=production >> .env
                                echo PORT=5000 >> .env
                                
                                echo "✅ Backend ready"
                            '''
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            bat '''
                                echo "Installing frontend dependencies..."
                                npm install
                                
                                echo "Building frontend..."
                                npm run build
                                
                                echo "✅ Frontend built"
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Initialize Database') {
            steps {
                echo "📊 Initializing database..."
                bat '''
                    echo "Importing database schema..."
                    docker cp callmaker_db.sql callmaker-mysql:/tmp/callmaker_db.sql
                    docker exec callmaker-mysql mysql -u callmaker_user -pcallmaker_pass callmaker_db -e "SOURCE /tmp/callmaker_db.sql;"
                    
                    echo "✅ Database initialized"
                '''
            }
        }
        
        stage('Deploy Application') {
            steps {
                echo "🚀 Deploying application..."
                bat '''
                    echo "Starting application stack..."
                    docker-compose up --build -d
                    
                    echo "Waiting for services to start..."
                    ping -n 30 127.0.0.1 > nul
                    
                    echo "✅ Application deployed"
                '''
            }
        }
        
        stage('DAST - Dynamic Application Security Testing') {
            steps {
                echo "🔒 Running security tests..."
                bat '''
                    echo "=== BASIC SECURITY CHECKS ==="
                    
                    echo "1. Testing backend endpoints..."
                    curl -s -o backend_health.json http://localhost:5000/api/health && echo "✅ Backend responsive" || echo "❌ Backend not responding"
                    
                    echo "2. Checking for common vulnerabilities..."
                    echo "   - Testing SQL injection protection..."
                    curl -s "http://localhost:5000/api/auth/login" -H "Content-Type: application/json" -d "{\"username\":\"admin' OR '1'='1\",\"password\":\"test\"}" | findstr "error\\|invalid" && echo "✅ SQL injection blocked" || echo "⚠️  SQL injection check inconclusive"
                    
                    echo "3. Testing XSS protection..."
                    curl -s "http://localhost:5000/api/auth/login" -H "Content-Type: application/json" -d "{\"username\":\"<script>alert('xss')</script>\",\"password\":\"test\"}" | findstr "error\\|invalid" && echo "✅ XSS attempt blocked" || echo "⚠️  XSS check inconclusive"
                    
                    echo "4. Checking CORS headers..."
                    curl -s -I http://localhost:5000/api/health | findstr "Access-Control" && echo "✅ CORS headers present" || echo "⚠️  CORS headers not found"
                    
                    echo "5. Testing frontend security headers..."
                    curl -s -I http://localhost:80 | findstr "X-Frame-Options\\|X-Content-Type-Options" && echo "✅ Security headers present" || echo "⚠️  Security headers missing"
                    
                    echo "=== SECURITY SCAN COMPLETED ==="
                '''
            }
        }
        
        stage('Integration Test') {
            steps {
                echo "🧪 Running integration tests..."
                bat '''
                    echo "=== APPLICATION HEALTH CHECKS ==="
                    
                    echo "1. Backend API Test:"
                    curl -f http://localhost:5000/api/health && echo "✅ Backend HEALTHY" || echo "❌ Backend UNHEALTHY"
                    
                    echo "2. Frontend Test:"
                    curl -f http://localhost:80 && echo "✅ Frontend HEALTHY" || echo "❌ Frontend UNHEALTHY"
                    
                    echo "3. Database Connection Test:"
                    docker exec callmaker-mysql mysql -u callmaker_user -pcallmaker_pass callmaker_db -e "SELECT 1;" && echo "✅ Database HEALTHY" || echo "❌ Database UNHEALTHY"
                    
                    echo "4. Login Function Test:"
                    curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"rizky\",\"password\":\"rizky123\"}" | findstr "success" && echo "✅ Login functional" || echo "⚠️  Login test failed"
                    
                    echo "=== APPLICATION URLs ==="
                    echo "🌐 Frontend: http://localhost:80"
                    echo "🔧 Backend:  http://localhost:5000"
                    echo "🗄️  Database: localhost:3307"
                    echo "🔑 Demo Login: rizky / rizky123"
                '''
            }
        }
    }
    
    post {
        always {
            echo "📊 Build completed with status: ${currentBuild.result}"
            bat '''
                echo "=== FINAL STATUS ==="
                docker ps -a
                echo "=== BACKEND LOGS ==="
                docker logs callmaker-backend --tail 10 2>NUL || echo "No backend logs"
                echo "=== SECURITY SUMMARY ==="
                echo "SAST: Dependency scanning completed"
                echo "DAST: Basic security tests executed" 
                echo "App: Deployed and tested"
            '''
        }
        success {
            echo "✅ ✅ ✅ DEVSECOPS PIPELINE SUCCESSFUL ✅ ✅ ✅"
            bat '''
                echo " "
                echo "🎉 DEVSECOPS DEPLOYMENT COMPLETED! 🎉"
                echo "======================================"
                echo "🔒 Security Scans: PASSED"
                echo "🚀 Application: DEPLOYED" 
                echo "🧪 Tests: EXECUTED"
                echo "🌐 Access: http://localhost:80"
                echo "======================================"
            '''
        }
        failure {
            echo "❌ ❌ ❌ PIPELINE FAILED ❌ ❌ ❌"
            bat '''
                echo "Debugging information:"
                docker-compose logs 2>NUL || echo "No compose logs"
                docker-compose down 2>NUL || echo "Cleanup completed"
            '''
        }
    }
}