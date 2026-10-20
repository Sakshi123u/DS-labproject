# LibraFlow – Distributed Library Management System
**Computer Engineering Mini Project | Distributed Systems & DevOps**

LibraFlow is a distributed, microservice-based Library Management System designed to demonstrate distributed systems principles, REST inter-service communication, Docker multi-container orchestration, and Kubernetes pod scalability.

---

## 1. System Architecture

The application is decomposed into four independent backend microservices, a dedicated single-page frontend, and a MongoDB persistent datastore:

```
[ React + Vite Frontend (Port 3000 / 80) ]
                   │
                   ▼ (HTTP / REST)
       [ API Gateway (Port 8080) ]
        ├── /api/books         ──► [ Book Service (Port 4001) ] ──► [ MongoDB ]
        ├── /api/borrow        ──► [ Borrow Service (Port 4002) ] ──► [ MongoDB ]
        │                                 │
        │                                 ├── (REST: Check & Decrement Inventory) ──► Book Service
        │                                 └── (REST: Emit Borrow Event)            ──► Notification Service
        └── /api/notifications ──► [ Notification Service (Port 4003) ] ──► [ MongoDB ]
```

### Microservices Breakdown

| Service | Port | Description | Tech Stack |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `8080` | Unified REST entry point for the frontend, routes requests and aggregates health checks | Node.js, Express, Axios |
| **Book Service** | `4001` | Inventory catalog, search, CRUD, and atomic quantity updates (`$inc: -1 / +1`) | Node.js, Express, Mongoose |
| **Borrow Service** | `4002` | Borrow & return workflow, enforces zero-quantity checks, communicates with Book & Notification services | Node.js, Express, Axios, Mongoose |
| **Notification Service** | `4003` | Automated event logging for borrow/return actions and system alerts | Node.js, Express, Mongoose |
| **MongoDB** | `27017` | Persistent document storage for books, borrowings, and notifications (internal only) | MongoDB 7.0 |
| **Frontend** | `3000 / 80` | Clean library dashboard with real-time UI, statistics, catalog management, and system status | React 19, Vite, Tailwind CSS |

---

## 2. Directory Structure

```text
distributed-library/
├── api-gateway/           # Port 8080 - REST gateway router & health aggregator
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── .env.example
├── book-service/          # Port 4001 - Book catalog & atomic inventory
│   ├── models/Book.js
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── .env.example
├── borrow-service/        # Port 4002 - Borrow / return orchestration
│   ├── models/Borrowing.js
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── .env.example
├── notification-service/  # Port 4003 - Activity notification logger
│   ├── models/Notification.js
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── .env.example
├── frontend/              # Nginx & production container config
│   ├── Dockerfile
│   └── nginx.conf
├── k8s/                   # Kubernetes manifests for Minikube / Cloud
│   ├── mongo.yaml
│   ├── book-service.yaml
│   ├── borrow-service.yaml
│   ├── notification-service.yaml
│   ├── api-gateway.yaml
│   └── frontend.yaml
├── src/                   # React frontend application source code
├── compose.yaml           # Docker Compose multi-service definition
├── server.ts              # Local unified development server
├── package.json
└── README.md
```

---

## 3. Ubuntu EC2 Setup Guide (t2.medium / t3.medium - 3.7 GB RAM)

### Step 1: System Update & 2 GB Swap Setup
For smooth operation on a 3.7 GB RAM EC2 instance, ensure 2 GB swap space is active:

```bash
sudo apt update && sudo apt upgrade -y

# Check existing swap
free -h

# If swap is not configured, create a 2 GB swap file:
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Step 2: Install Docker & Docker Compose
```bash
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker
```

---

## 4. Running with Docker Compose

To start the complete multi-service application with persistent MongoDB volume:

```bash
# 1. Build and start all services in detached mode
docker compose up -d --build

# 2. Check running containers
docker compose ps

# 3. View live logs from all services
docker compose logs -f

# 4. Access the application in your browser:
# http://<EC2-PUBLIC-IP>:3000
```

To stop all services:
```bash
docker compose down
```

---

## 5. Kubernetes (Minikube) Deployment & Scaling

> **Important Note for EC2:** Due to the 3.7 GB RAM constraint, stop Docker Compose before starting Minikube (`docker compose down`).

### Step 1: Install Minikube & kubectl
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start Minikube with optimized memory for 3.7 GB instance
minikube start --driver=docker --memory=2200mb --cpus=2
```

### Step 2: Build Images Inside Minikube's Docker Daemon
Point your terminal to Minikube's Docker daemon so the cluster can access local images without pushing to Docker Hub:

```bash
eval $(minikube docker-env)

# Build service images inside Minikube
docker build -t libraflow-book-service:latest ./book-service
docker build -t libraflow-notification-service:latest ./notification-service
docker build -t libraflow-borrow-service:latest ./borrow-service
docker build -t libraflow-api-gateway:latest ./api-gateway
docker build -t libraflow-frontend:latest -f ./frontend/Dockerfile .
```

### Step 3: Deploy All Manifests
```bash
kubectl apply -f k8s/mongo.yaml
kubectl apply -f k8s/book-service.yaml
kubectl apply -f k8s/notification-service.yaml
kubectl apply -f k8s/borrow-service.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/frontend.yaml

# Check pod statuses
kubectl get pods -w
```

### Step 4: Demonstrate Horizontal Pod Scaling (Book Service)
To demonstrate Kubernetes scalability for your mini project presentation:

```bash
# Scale the Book Service to 3 replicas
kubectl scale deployment book-service --replicas=3

# Observe the 3 book-service pods starting up
kubectl get pods -l app=book-service

# Verify the deployment state
kubectl get deployment book-service
```

### Step 5: Access Frontend on Minikube
```bash
# Port-forward frontend service to port 3000
kubectl port-forward service/frontend 3000:80 --address 0.0.0.0
```

---

## 6. Key Distributed Design Features Demonstrated

1. **Atomic Inventory Control**: Borrowing uses atomic conditional decrement (`$inc: -1` where `availableQuantity >= 1`) to guarantee no race condition causes negative stock.
2. **Duplicate Return Prevention**: Borrow Service rejects return requests if status is already marked `RETURNED`.
3. **Failure Isolation**: If the Notification Service is temporarily delayed or offline, the core borrow transaction still completes cleanly.
4. **Live System Health Probing**: The `/api/system/health` gateway endpoint executes real concurrent health checks against all 4 microservices and reports individual response latencies.
