#!/bin/bash

dir="$1"

if [ ! -d "$dir" ]; then
  echo "Error: $dir not found"
  exit
fi

read  -r -p "Build $dir? [Y/n] " response

if [[ $response =~ ^[Yy]$ ]]; then
  cd $dir

  target="$dir.zip"
  source="*"
  zip -r $target $source

  aws s3 cp $target s3://lambda/
  aws lambda create-function \
    --function-name $dir \
    --runtime nodejs4.3 \
    --code S3Bucket=lambda,S3Key=$dir.zip \
    --handler index.handler \
    --role arn:aws:iam::XXX:role/lambda_basic_vpc_execution \
    --vpc-config SubnetIds=XXX,SecurityGroupIds=XXX \
    --memory-size 128
fi
