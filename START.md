# How to Start the Application

## Quick Start Guide

After closing your computer and restarting, follow these steps to run the application again:

### Step 1: Start MySQL Database (if needed)

If MySQL is not running automatically, start it:

**On macOS:**
```bash
# If MySQL is installed via Homebrew
brew services start mysql

# Or if installed via MySQL installer
sudo /usr/local/mysql/support-files/mysql.server start
```

**Check if MySQL is running:**
```bash
mysql -u root -p -e "SELECT 1;"
```

### Step 2: Navigate to Server Directory

```bash
cd "/Users/hengrui/Desktop/Courses/CS411 Database Systems/fa25-cs411-team020-IShowCode/Server"
```

### Step 3: Start the Backend Server

```bash
npm start
```

Or for development mode (auto-restart on file changes):
```bash
npm run dev
```

You should see:
```
Testing database connection...
✓ Database connected successfully
============================================================
🚀 Server running on http://localhost:3000
============================================================
```

### Step 4: Open the Application

Open your web browser and go to:
```
http://localhost:3000
```

The frontend application will load automatically.

---

## Troubleshooting

### If you see "Database connection failed":

1. **Check MySQL is running:**
   ```bash
   brew services list | grep mysql
   # or
   ps aux | grep mysql
   ```

2. **Check .env file exists:**
   ```bash
   ls Server/.env
   ```

3. **Verify database credentials in Server/.env:**
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=findmypark_nyc
   DB_PORT=3306
   PORT=3000
   ```

### If port 3000 is already in use:

Kill the existing process:
```bash
lsof -ti:3000 | xargs kill -9
```

Then restart:
```bash
cd Server && npm start
```

---

## One-Line Start Command

You can also use this single command to start everything:

```bash
cd "/Users/hengrui/Desktop/Courses/CS411 Database Systems/fa25-cs411-team020-IShowCode/Server" && npm start
```

---

## Notes

- The server must be running for the frontend to work
- The database must be running and accessible
- Default port is 3000 (change in Server/.env if needed)
- The frontend is automatically served from the `client` directory

