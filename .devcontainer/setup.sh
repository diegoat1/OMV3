#!/bin/bash
set -e

echo "=== Installing Python dependencies ==="
pip install -r requirements.txt

echo "=== Installing frontend dependencies ==="
cd omega-medicina-app && npm install && cd ..

echo "=== Creating development databases ==="
python scripts/seed_dev_data.py

echo "=== Setup complete! ==="
echo ""
echo "To start the backend:  python src/main.py"
echo "To start the frontend: cd omega-medicina-app && npx expo start --web --port 8081"
