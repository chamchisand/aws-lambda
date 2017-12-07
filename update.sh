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

  aws lambda update-function-code \
    --function-name $dir \
    --s3-bucket lambda \
    --s3-key $dir.zip
fi
