#!/bin/bash
set -e

echo "Stopping application..."
pm2 stop rental-management-api || true
pm2 delete rental-management-api || true

# Wait for connections to close
sleep 5

echo "✅ Application stopped"