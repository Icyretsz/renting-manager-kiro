#!/bin/bash
cd /home/ec2-user/apps/renting-manager-kiro/server

# Start the application with PM2
pm2 start dist/index.js --name rental-management-api --time

# Save PM2 configuration
pm2 save