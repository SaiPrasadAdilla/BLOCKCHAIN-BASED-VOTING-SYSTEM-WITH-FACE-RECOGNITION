@echo off
echo ========================================
echo  Voting Application - Fresh Rebuild
echo ========================================
echo.
echo [1/4] Stopping containers and removing volumes...
docker compose down -v --remove-orphans
echo.
echo [2/4] Pruning old images...
docker image prune -f
echo.
echo [3/4] Building images from scratch...
docker compose build --no-cache
echo.
echo [4/4] Starting all services...
docker compose up -d
echo.
echo ========================================
echo  Fresh setup complete!
echo  - App:      http://localhost:3000
echo  - Frontend: http://localhost:4200
echo  - MongoDB:  localhost:27017
echo ========================================
pause
