#!/bin/bash
# Script to copy AWS credentials from default profile to lifescape profile

echo "🔧 Setting up 'lifescape' AWS profile..."
echo ""

# Get credentials from default profile
ACCESS_KEY=$(aws configure get aws_access_key_id --profile default 2>/dev/null)
SECRET_KEY=$(aws configure get aws_secret_access_key --profile default 2>/dev/null)
REGION=$(aws configure get region --profile default 2>/dev/null || echo "us-east-1")

if [ -z "$ACCESS_KEY" ] || [ -z "$SECRET_KEY" ]; then
    echo "❌ Error: Could not read credentials from default profile"
    echo "Please run: aws configure --profile lifescape"
    exit 1
fi

echo "✅ Found credentials in default profile"
echo "📋 Copying to 'lifescape' profile..."
echo ""

# Configure lifescape profile
aws configure set aws_access_key_id "$ACCESS_KEY" --profile lifescape
aws configure set aws_secret_access_key "$SECRET_KEY" --profile lifescape
aws configure set region "$REGION" --profile lifescape
aws configure set output json --profile lifescape

echo "✅ 'lifescape' profile configured successfully!"
echo ""
echo "🔍 Verifying configuration..."
aws configure list --profile lifescape
echo ""
echo "🧪 Testing AWS access..."
aws sts get-caller-identity --profile lifescape
echo ""
echo "✅ Setup complete! You can now test your function:"
echo "   cd sls-lifescape"
echo "   SENDGRID_API_KEY=test_key npx serverless invoke local --function createThread --path event/thread.json"

