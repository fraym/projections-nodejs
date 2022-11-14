#!/bin/bash

SCRIPT_DIR="$(dirname $(python -c 'import os,sys;print(os.path.realpath(sys.argv[1]))' $0 2>/dev/null || python3 -c 'import os,sys;print(os.path.realpath(sys.argv[1]))' $0 2>/dev/null))"
AWS_REGION="eu-central-1"
AWS_ECR_URI="067475952430.dkr.ecr.eu-central-1.amazonaws.com"
AWS_PROFILE="becklyn-docker-ecr"

echo $SCRIPT_DIR

aws sts get-caller-identity --profile $AWS_PROFILE --no-cli-pager &>/dev/null
if [ $? != 0 ] 
then
    echo "Login to $AWS_PROFILE"
    aws sso login --profile $AWS_PROFILE
else
    echo "AWS Already logged in."
fi

aws --profile $AWS_PROFILE ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ECR_URI || echo "Docker already logged in."
