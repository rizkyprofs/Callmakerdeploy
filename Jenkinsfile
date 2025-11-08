    post {
        always {
            echo "📊 Pipeline completed with status: ${currentBuild.result}"
            bat '''
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
        success {
            echo "🎉 DEVSECOPS PIPELINE SUCCESSFUL!"
            bat '''
                echo.
                echo "========================================"
                echo "        DEVSECOPS TASK COMPLETED       "
                echo "========================================"
                echo "✅ SAST: Static Security Testing - DONE"
                echo "✅ DAST: Dynamic Security Testing - DONE" 
                echo "✅ CI/CD: Pipeline Execution - SUCCESS"
                echo "✅ Backend: Node.js API - RUNNING"
                echo "✅ Frontend: Vue.js App - RUNNING"
                echo "✅ Database: MySQL - RUNNING"
                echo.
                echo "🌐 APPLICATION URLs:"
                echo "   Frontend: http://localhost:3000"
                echo "   Backend API: http://localhost:5000"
                echo "   API Health: http://localhost:5000/api/health"
                echo "   MySQL Port: 3307"
                echo.
                echo "🎯 VUE.JS APP SUDAH DEPLOY!"
                echo "========================================"
            '''
        }
        // ... failure section tetap
    }