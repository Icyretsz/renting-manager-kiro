#!/bin/bash
set -e

echo "🔍 Validating deployment..."

# Wait for app to fully start
sleep 10

# Check if PM2 process is running
if pm2 describe rental-management-api > /dev/null 2>&1; then
  echo "✅ PM2 process is running"
  
  # Check if process is actually online
  STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="rental-management-api") | .pm2_env.status')
  
  if [ "$STATUS" = "online" ]; then
    echo "✅ Application is online"
    
    # Optional: Health check endpoint
    # if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    #   echo "✅ Health check passed"
    # else
    #   echo "⚠️ Health check failed"
    #   exit 1
    # fi
    
    exit 0
  else
    echo "❌ Application is not online (status: $STATUS)"
    pm2 logs rental-api --lines 50
    exit 1
  fi
else
  echo "❌ PM2 process not found"
  exit 1
fi