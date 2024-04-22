if [ -f .env ]; then
    exit 0
fi

echo "Creating .env file..."

echo "POSTGRES_URI=postgresql://postgres:password123@127.0.0.1:5432/next-payload-3" >>.env
echo "PAYLOAD_SECRET=$(openssl rand -hex 16)" >>.env
