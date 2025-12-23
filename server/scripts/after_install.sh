#!/bin/bash
set -e

cd /home/ec2-user/apps/renting-manager-kiro/server

echo "📥 Restoring critical files..."

# Restore .env file
if [ -f "/home/ec2-user/backups/.env" ]; then
  cp /home/ec2-user/backups/.env /home/ec2-user/apps/renting-manager-kiro/server/.env
  chmod 600 /home/ec2-user/apps/renting-manager-kiro/server/.env
  echo "✅ .env restored"
else
  echo "❌ ERROR: No .env backup found!"
  echo "❌ Application cannot start without .env file"
  echo "❌ Please SSH into EC2 and create .env manually"
  exit 1
fi

# Install production dependencies
echo "📦 Installing dependencies..."
npm ci --production --silent

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

echo "✅ Installation completed successfully"