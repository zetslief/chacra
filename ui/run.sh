#!/usr/bin/bash

npm run-script build
cd dist
python3 -m http.server &
cd ..
npm run-script watch 
