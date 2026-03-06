#!/bin/bash
# 로컬에서 사이트 미리보기 (Node 없이 Python 사용)
cd "$(dirname "$0")"
echo "로컬 서버 시작: http://localhost:3000"
echo "종료하려면 Ctrl+C"
python3 -m http.server 3000
