#!/usr/bin/bash

npm run-script watch &
cd dist
python3 -m http.server
