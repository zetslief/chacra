#!/usr/bin/bash

esbuild bot.ts --bundle --outdir=./dist
node ./dist/bot.js