# Deployment Guide (AWS EC2)

This guide details how to deploy your SecureBlog application to an AWS EC2 instance.

## Prerequisites
- An AWS Account.
- Terminal (Mac/Linux) or PowerShell/Git Bash (Windows) with SSH enabled.

## Step 1: Launch EC2 Instance
1.  Log in to the **AWS Console**.
2.  Go to **EC2** Dashboard and click **Launch Instance**.
3.  **Name**: `SecureBlog Server`.
4.  **AMI**: Select **Ubuntu Server 24.04 LTS** (Free Tier eligible).
5.  **Instance Type**: `t2.micro` (Free Tier eligible).
6.  **Key Pair**: Create a new key pair (e.g., `blog-key.pem`), download and save it safely.
7.  **Network Settings**:
    -   Allow SSH traffic from **My IP**.
    -   Allow HTTP traffic from the internet.
    -   Allow HTTPS traffic from the internet.
8.  Click **Launch Instance**.

## Step 2: Connect to Instance
1.  Open your terminal/PowerShell.
2.  Navigate to where you saved your key (`cd Downloads`).
3.  Set permissions (Linux/Mac only): `chmod 400 blog-key.pem`.
4.  Connect:
    ```bash
    ssh -i "blog-key.pem" ubuntu@<YOUR_INSTANCE_PUBLIC_IP>
    ```

## Step 3: Server Setup
Run the following commands on the server to install necessary software:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python, pip, Nginx, and Git
sudo apt install python3-pip python3-venv nginx git -y
```

## Step 4: Deploy Code
You can clone your repository if it's on GitHub, or copy files from your local machine using SCP.

### Option A: Using Git (Recommended)
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd <REPO_NAME>
```

### Option B: Using SCP (If code is local)
On your LOCAL machine:
```bash
# Copy backend
scp -i "blog-key.pem" -r backend ubuntu@<IP>:/home/ubuntu/blog-backend
# Copy frontend (we only need the contents inside frontend/)
scp -i "blog-key.pem" -r frontend ubuntu@<IP>:/home/ubuntu/blog-frontend
```

## Step 5: Configure Backend
```bash
cd /home/ubuntu/blog-backend # or wherever you put it

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
pip install gunicorn uvicorn

# Test run (Ctrl+C to stop)
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Setup Systemd Service (Keep backend running)
Create a service file:
`sudo nano /etc/systemd/system/secureblog.service`

Paste this content:
```ini
[Unit]
Description=Gunicorn instance to serve SecureBlog
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/blog-backend
Environment="PATH=/home/ubuntu/blog-backend/venv/bin"
ExecStart=/home/ubuntu/blog-backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000

[Install]
WantedBy=multi-user.target
```

Start and enable the service:
```bash
sudo systemctl start secureblog
sudo systemctl enable secureblog
```

## Step 6: Configure Frontend & Nginx
Copy frontend files to the web directory:
```bash
sudo mkdir -p /var/www/secureblog
# Assuming you are in the parent directory containing frontend/
sudo cp -r /home/ubuntu/blog-frontend/* /var/www/secureblog/
```

Configure Nginx:
`sudo nano /etc/nginx/sites-available/secureblog`

Paste this content:
```nginx
server {
    listen 80;
    server_name <YOUR_PUBLIC_IP>; # Or your domain name

    root /var/www/secureblog;
    index index.html;

    # Serve Static Files (Frontend)
    location / {
        try_files $uri $uri/ @backend;
    }

    # Reverse Proxy to Backend
    location @backend {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/secureblog /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## Step 7: Verify
Open your browser and visit: `http://<YOUR_INSTANCE_PUBLIC_IP>`

Your SecureBlog should be live!

### Troubleshooting
- **Backend Logs**: `sudo journalctl -u secureblog`
- **Nginx Logs**: `sudo tail -f /var/log/nginx/error.log`
