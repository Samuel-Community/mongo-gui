# MongoGUI - Modern MongoDB Web Manager 🚀

MongoGUI is a professional, lightweight web-based administration interface for MongoDB, built with **Next.js 15**, **Tailwind CSS 4**, and **Monaco Editor**. It provides a sleek alternative to heavy desktop clients for managing local or remote databases with real-time analytics.

## ✨ Features

* **Real-Time Dashboard**: Live monitoring of server health (RAM, CPU usage, active connections, and uptime).
* **Global Analytics**: Intelligent aggregation of storage size and document counts across all databases.
* **Pro Code Editor**: Integrated **Monaco Editor** (VS Code engine) with syntax highlighting and strict JSON validation.
* **User Settings**: Update your administrator password directly from the interface.
* **Smart Security**: Save button automatically disables if JSON syntax is invalid.
* **Responsive UI**: Modern design with dark/light mode support and a fixed sidebar.

---

## 🛠️ Tech Stack

* **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
* **Styling**: Tailwind CSS 4 + Shadcn UI (Radix UI)
* **Database**: MongoDB (Data) & SQLite (Auth)
* **Security**: BcryptJS & Jose (JWT)

---

## 🚀 Installation & First Launch

### 1. Setup
```bash
git clone https://github.com/Samuel-Community/mongo-gui.git
cd mongo-gui-modern
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory. For maximum security, generate your **JWT_SECRET** using:

```bash
openssl rand -base64 32
```

Add it to your `.env`:

```env
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET=your_generated_key
```

### 🔑 3. Retrieving Your Credentials

The application features an **Automatic Setup** mode:

1. Start the server: `npm run dev`.
2. Open your browser at `http://localhost:3000`.
3. **Check your terminal**: As soon as the page loads, a yellow box will appear in your console containing your auto-generated `admin` credentials.
4. **Important**: Log in and go to the **Settings** section to change your password for better security.
![image](https://media.tutorapide.xyz/zWkNEZofUoR3.png)

---

## 📦 Production Deployment (VPS)

### 1. Build & Run with PM2
To keep the app running 24/7. Note that the `-p` (port) and `-H` (hostname) flags are optional:

```bash
# Generate the production build
npm run build

# Start the application

pm2 start npm --name "mongo-gui" -- start

# Use -p to change the port (default 3000)
# Use -H 127.0.0.1 to restrict access to localhost only (more secure with Nginx)
pm2 start npm --name "mongo-gui" -- start -- -p 4000 -H 127.0.0.1
pm2 save
```
Note: Removing -H 127.0.0.1 will allow you to access the app directly via http://your-server-ip:4000. Keeping it ensures that only your Nginx reverse proxy can talk to the app, which is the recommended setup for production

### 2. Reverse Proxy Configuration (Nginx)

Access the app via your domain (e.g., `https://domain.com`):

Replace domain.com with your domain

[nginx](./mongo.conf)

---

## 🔒 Security & Networking

* **IP Restriction**: Binding to `127.0.0.1` ensures the app is invisible to the public internet except through your domain.
* **JWT Middleware**: Every internal route is protected. Unauthorized requests are automatically redirected to the login page.
* **Dynamic Detection**: The middleware uses advanced header detection to ensure perfect redirects behind Nginx.

---


## 🖼️ Screen

![login](https://media.tutorapide.xyz/Nvsw402SUImx.png)
![dasboard](https://media.tutorapide.xyz/d9kuOaAmeCmH.png)
![database](https://media.tutorapide.xyz/IzSAvupLDrEj.png)
![stats](https://media.tutorapide.xyz/tPROsqDWfydV.png)
![settings](https://media.tutorapide.xyz/YlqD5IM4RSnw.png)

---
## 🤖 AI Contribution

Developed with AI assistance to optimize Nginx configurations, Next.js 15 middleware logic, and secure authentication workflows.

---

## 📝 License

MIT License.

Developed with ❤️ by [Samuel-TutoRapide](https://github.com/Samuel-TutoRapide)