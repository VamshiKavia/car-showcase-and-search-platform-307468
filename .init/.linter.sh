#!/bin/bash
cd /home/kavia/workspace/code-generation/car-showcase-and-search-platform-307468/car_website_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

