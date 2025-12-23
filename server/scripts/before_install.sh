#!/bin/bash
# Backup current deployment
if [ -d "/home/ec2-user/apps/renting-manager-kiro/server" ]; then
  sudo rm -rf /home/ec2-user/apps/renting-manager-kiro-server-backup
  sudo cp -r /home/ec2-user/apps/renting-manager-kiro/server /home/ec2-user/apps/renting-manager-kiro-server-backup
fi