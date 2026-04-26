#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

apt-get update
# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs tesseract-ocr unzip jq

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Set up the workspace
mkdir -p /home/ubuntu/career-ops
cd /home/ubuntu/career-ops

# Sync from S3 (adjust the bucket name based on what we got)
# We will use string replacement for the bucket name before running the command
aws s3 sync s3://career-ops-workspace-856715346/ .

chown -R ubuntu:ubuntu /home/ubuntu/career-ops

# Install dependencies as ubuntu user
sudo -u ubuntu npm install
sudo -u ubuntu npx playwright install-deps chromium
sudo -u ubuntu npx playwright install chromium

# Run the OCR script in tmux
sudo -u ubuntu tmux new-session -d -s ocr "node ocr-pngs.js"
