#!/bin/bash
# Wait for the app to start
sleep 10

# Check if PM2 process is running
pm2 describe rental-management-api > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "Application is running"
  exit 0
else
  echo "Application failed to start"
  exit 1
fi