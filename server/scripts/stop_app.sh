#!/bin/bash
pm2 stop rental-management-api || true
pm2 delete rental-management-api || true