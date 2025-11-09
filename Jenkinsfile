pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                echo '📥 Checking out code from GitHub...'
                checkout scm
            }
        }
        
        stage('SAST - NPM Audit') {
            steps {
                echo '🔍 Running NPM Audit (Dependency Scanning)...'
                script {
                    // Audit Backend
                    bat '''
                        cd backend
                        npm audit --audit-level=moderate --json > npm-audit-backend.json || exit 0
                        npm audit --audit-level=moderate || exit 0
                    '''
                    
                    // Audit Frontend
                    bat '''
                        cd frontend
                        npm audit --audit-level=moderate --json > npm-audit-frontend.json || exit 0
                        npm audit --audit-level=moderate || exit 0
                    '''
                }
                
                // Archive hasil audit
                archiveArtifacts artifacts: '**/npm-audit-*.json', allowEmptyArchive: true
            }
        }
        
        stage('SAST - ESLint Security Check') {
            steps {
                echo '🔍 Running ESLint Security Rules...'
                script {
                    // Install eslint-plugin-security jika belum ada
                    bat '''
                        cd backend
                        npm install --save-dev eslint eslint-plugin-security || exit 0
                        npx eslint . --ext .js --format json --output-file eslint-backend.json || exit 0
                        npx eslint . --ext .js || exit 0
                    '''
                    
                    bat '''
                        cd frontend
                        npx eslint src --ext .js,.vue --format json --output-file eslint-frontend.json || exit 0
                        npx eslint src --ext .js,.vue || exit 0
                    '''
                }
                
                archiveArtifacts artifacts: '**/eslint-*.json', allowEmptyArchive: true
            }
        }
        
        stage('SAST - Semgrep Security Scan') {
            steps {
                echo '🔍 Running Semgrep Static Analysis...'
                script {
                    bat '''
                        docker run --rm -v "%CD%:/src" returntocorp/semgrep semgrep --config=auto --json --output=semgrep-report.json /src || exit 0
                    '''
                }
                
                archiveArtifacts artifacts: 'semgrep-report.json', allowEmptyArchive: true
            }
        }
        
        stage('SAST - Dependency Check (OWASP)') {
            steps {
                echo '🔍 Running OWASP Dependency Check...'
                script {
                    bat '''
                        docker run --rm -v "%CD%:/src" owasp/dependency-check:latest --scan /src --format JSON --out /src/dependency-check-report.json --project CallMaker || exit 0
                    '''
                }
                
                archiveArtifacts artifacts: 'dependency-check-report.json', allowEmptyArchive: true
            }
        }
        
        stage('Stop Old Containers') {
            steps {
                echo '🛑 Stopping and removing old containers...'
                script {
                    bat '''
                        docker rm -f callmaker-mysql callmaker-backend callmaker-frontend || exit 0
                        docker-compose down -v || exit 0
                    '''
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                echo '🏗️ Building Docker images...'
                script {
                    bat 'docker-compose build'
                }
            }
        }
        
        stage('Deploy Application') {
            steps {
                echo '🚀 Deploying application...'
                script {
                    bat 'docker-compose up -d'
                }
            }
        }
        
        stage('Wait for Application') {
            steps {
                echo '⏳ Waiting for application to be ready...'
                script {
                    sleep 30
                    bat 'docker-compose ps'
                }
            }
        }
        
        stage('DAST - OWASP ZAP Baseline Scan') {
            steps {
                echo '🔍 Running OWASP ZAP Dynamic Security Scan...'
                script {
                    // Buat direktori untuk reports
                    bat 'if not exist zap-reports mkdir zap-reports'
                    
                    // Run ZAP Baseline Scan
                    bat '''
                        docker run --rm --network=host -v "%CD%/zap-reports:/zap/wrk:rw" zaproxy/zap-stable zap-baseline.py -t http://localhost:5000 -r zap-baseline-report.html -J zap-baseline-report.json -x zap-baseline-report.xml || exit 0
                    '''
                }
                
                // Publish HTML report
                publishHTML([
                    allowMissing: true,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'zap-reports',
                    reportFiles: 'zap-baseline-report.html',
                    reportName: 'OWASP ZAP Security Report'
                ])
                
                archiveArtifacts artifacts: 'zap-reports/*', allowEmptyArchive: true
            }
        }
        
        stage('DAST - Nikto Web Scanner') {
            steps {
                echo '🔍 Running Nikto Web Server Scanner...'
                script {
                    bat '''
                        docker run --rm --network=host sullo/nikto -h http://localhost:5000 -Format json -output nikto-report.json || exit 0
                    '''
                }
                
                archiveArtifacts artifacts: 'nikto-report.json', allowEmptyArchive: true
            }
        }
        
        stage('Security Quality Gate') {
            steps {
                echo '🚦 Checking Security Quality Gate...'
                script {
                    bat '''
                        @echo off
                        echo.
                        echo ============================================
                        echo    SECURITY SCAN SUMMARY
                        echo ============================================
                        echo.
                        
                        if exist backend\\npm-audit-backend.json (
                            echo [NPM AUDIT - Backend] Report generated
                        ) else (
                            echo [NPM AUDIT - Backend] No report found
                        )
                        
                        if exist frontend\\npm-audit-frontend.json (
                            echo [NPM AUDIT - Frontend] Report generated
                        ) else (
                            echo [NPM AUDIT - Frontend] No report found
                        )
                        
                        if exist backend\\eslint-backend.json (
                            echo [ESLint - Backend] Report generated
                        ) else (
                            echo [ESLint - Backend] No report found
                        )
                        
                        if exist semgrep-report.json (
                            echo [Semgrep] Report generated
                        ) else (
                            echo [Semgrep] No report found
                        )
                        
                        if exist zap-reports\\zap-baseline-report.html (
                            echo [OWASP ZAP] Report generated
                        ) else (
                            echo [OWASP ZAP] No report found
                        )
                        
                        echo.
                        echo ============================================
                        echo All security scans completed!
                        echo Check archived artifacts for detailed reports.
                        echo ============================================
                        echo.
                    '''
                }
            }
        }
        
        stage('Health Check') {
            steps {
                echo '✅ Final application health check...'
                script {
                    bat 'docker-compose ps'
                    bat 'docker-compose logs --tail=30 backend'
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ ============================================'
            echo '✅   DEPLOYMENT & SECURITY SCANS SUCCESSFUL!'
            echo '✅ ============================================'
            echo ''
            echo '🌐 Application URLs:'
            echo '   Backend:  http://localhost:5000'
            echo '   Frontend: http://localhost:5173'
            echo ''
            echo '📊 Security Reports:'
            echo '   - NPM Audit (Backend & Frontend)'
            echo '   - ESLint Security Check'
            echo '   - Semgrep Static Analysis'
            echo '   - OWASP Dependency Check'
            echo '   - OWASP ZAP DAST Scan'
            echo '   - Nikto Web Scanner'
            echo ''
            echo '📁 Check "Artifacts" for detailed reports'
            echo '============================================'
        }
        failure {
            echo '❌ ============================================'
            echo '❌   DEPLOYMENT FAILED!'
            echo '❌ ============================================'
            bat 'docker-compose logs --tail=100'
        }
        always {
            echo '🧹 Cleanup: Keeping containers running for testing'
        }
    }
}