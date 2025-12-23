#!/bin/bash
set -e

echo "📦 Backing up critical files..."

# Ensure backup directory exists
mkdir -p /home/ec2-user/backups

# Backup .env file (CRITICAL!)
if [ -f "/home/ec2-user/apps/renting-manager-kiro/server/.env" ]; then
  cp /home/ec2-user/apps/renting-manager-kiro/server/.env /home/ec2-user/backups/.env
  chmod 600 /home/ec2-user/backups/.env
  echo "✅ .env backed up to /home/ec2-user/backups/.env"
else
  echo "⚠️ No .env file found at /home/ec2-user/apps/renting-manager-kiro/server/.env"
fi

# Clean up old build artifacts (will be replaced anyway)
if [ -d "/home/ec2-user/apps/renting-manager-kiro/server/dist" ]; then
  rm -rf /home/ec2-user/apps/renting-manager-kiro/server/dist
  echo "✅ Old dist/ removed"
fi

if [ -d "/home/ec2-user/apps/renting-manager-kiro/server/node_modules" ]; then
  rm -rf /home/ec2-user/apps/renting-manager-kiro/server/node_modules
  echo "✅ Old node_modules/ removed"
fi

echo "✅ Backup completed successfully"