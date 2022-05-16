#!/bin/bash

set -e
set -x

wails build -u -platform darwin/universal
cp build/acorn.sqlite build/bin/Acorn.app/Contents/Resources/acorn.sqlite
