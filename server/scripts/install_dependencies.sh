#!/bin/bash
cd /home/ec2-user/apps/renting-manager-kiro/server

# The node_modules are already in the artifact, but we need to ensure production only
npm prune --production

# Run Prisma migrations
npx prisma migrate deploy