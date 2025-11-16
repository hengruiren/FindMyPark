# FindMyPark NYC - Setup and Run Guide

This guide will help you set up and run the FindMyPark NYC application on a fresh computer.

## Prerequisites

Before starting, make sure you have the following installed:

1. **Node.js** (version 14 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **MySQL** (version 8.0 or higher)
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or use Homebrew on macOS: `brew install mysql`
   - Verify installation: `mysql --version`

3. **Git** (optional, for cloning the repository)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

## Step 1: Clone or Download the Project

If you have the project in a Git repository:
```bash
git clone <repository-url>
cd fa25-cs411-team020-IShowCode
```

Or download and extract the project folder to your desired location.

## Step 2: Set Up MySQL Database

### 2.1 Start MySQL Service

**On macOS:**
```bash
brew services start mysql
# Or if not using Homebrew:
sudo /usr/local/mysql/support-files/mysql.server start
```

**On Linux:**
```bash
sudo systemctl start mysql
# Or:
sudo service mysql start
```

**On Windows:**
- Open Services (Win + R, type `services.msc`)
- Find "MySQL" service and start it
- Or use MySQL Command Line Client

### 2.2 Create Tables

Run the SQL script to create all tables:
```bash
mysql -u root -p findmypark_nyc < database/create_tables.sql
```

Or if using the new user:
```bash
mysql -u findmypark_user -p findmypark_nyc < database/create_tables.sql
```

### 2.3 Import Data
```bash
cd database
python3 data_importer.py
```

Make sure you have Python 3 installed and required packages:
```bash
pip3 install mysql-connector-python pandas
```

## Step 3: Configure Backend Server

### 3.1 Install Node.js Dependencies

Navigate to the Server directory:
```bash
cd Server
npm install
```

This will install all required packages listed in `package.json`:
- express
- sequelize
- mysql2
- bcrypt
- cors
- etc.

### 3.2 Configure Database Connection

Edit `Server/config/database.js` and update the database credentials:

```javascript
const config = {
  host: 'localhost',
  user: 'root',  // Change to 'findmypark_user' if you created a new user
  password: 'your_mysql_password',  // Your MySQL password
  database: 'findmypark_nyc',
  // ... rest of config
};
```

Or if you prefer environment variables, create a `.env` file in the `Server` directory:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=findmypark_nyc
```

Then update `database.js` to read from environment variables:
```javascript
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'findmypark_nyc',
  // ...
};
```

### 3.3 Test Database Connection

You can test the connection by running:
```bash
node -e "const db = require('./config/dbConnection'); db.sequelize.authenticate().then(() => console.log('Connected!')).catch(err => console.error('Error:', err));"
```

## Step 4: Start the Backend Server

From the `Server` directory:
```bash
npm start
```

Or if you want to run in development mode with auto-reload:
```bash
npm run dev
```

The server should start on `http://localhost:3000`

You should see output like:
```
Server is running on port 3000
Database connected successfully
```

## Step 5: Access the Frontend

The frontend is served by the backend server. Simply open your web browser and navigate to:

```
http://localhost:3000
```

The application should load with:
- Interactive map of NYC parks
- Search functionality
- Filter options (facility types, boroughs, trails)
- User authentication (login/register)
- Review system

## Step 6: Using the Application

### 6.1 Create a User Account

1. Click "Register" in the top right
2. Enter username, email, and password
3. You'll be automatically logged in

### 6.2 Explore Parks

- Use the search bar to find parks by name
- Click facility type buttons to filter parks
- Select boroughs to filter by location
- Click on map markers to see park details
- Hover over markers to see quick info

### 6.3 Write Reviews

1. Click on a park marker or search for a park
2. Scroll to the Reviews section
3. If logged in, you can write a review with rating (1-5 stars) and comment
4. You can edit or delete your own reviews

### 6.4 User Settings

1. Click "Settings" next to your username
2. Select favorite sports/facilities
3. These preferences can be auto-applied when you login

## Troubleshooting

### Database Connection Issues

**Error: "Access denied for user"**
- Check your MySQL username and password in `Server/config/database.js`
- Make sure the MySQL service is running
- Verify the database exists: `mysql -u root -p -e "SHOW DATABASES;"`

**Error: "Unknown database 'findmypark_nyc'"**
- Create the database: `mysql -u root -p -e "CREATE DATABASE findmypark_nyc;"`
- Run the create_tables.sql script again

### Port Already in Use

**Error: "Port 3000 is already in use"**
- Find and kill the process: `lsof -ti:3000 | xargs kill -9` (macOS/Linux)
- Or change the port in `Server/server.js`:
  ```javascript
  const PORT = process.env.PORT || 3001;  // Change to 3001 or another port
  ```
- Then update `client/js/config.js`:
  ```javascript
  const API_BASE = 'http://localhost:3001/api';  // Match the new port
  ```

### Node Modules Issues

**Error: "Cannot find module"**
- Delete `node_modules` folder: `rm -rf node_modules`
- Delete `package-lock.json`: `rm package-lock.json`
- Reinstall: `npm install`

### Frontend Not Loading

**Blank page or API errors**
- Check browser console (F12) for errors
- Verify backend server is running on port 3000
- Check that `client` folder exists and contains `index.html`
- Verify API_BASE URL in `client/js/config.js` matches your server port

### Map Not Displaying

**Map is blank or shows errors**
- Check browser console for Leaflet.js errors
- Verify internet connection (Leaflet loads tiles from CDN)
- Check if there are CORS errors in the console

## Project Structure

```
fa25-cs411-team020-IShowCode/
├── Server/                 # Backend Node.js/Express server
│   ├── config/            # Database configuration
│   ├── controllers/       # Business logic
│   ├── models/            # Sequelize ORM models
│   ├── routes/            # API routes
│   └── server.js          # Main server file
├── client/                # Frontend application
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript modules
│   ├── images/           # Images and assets
│   └── index.html        # Main HTML file
├── database/             # Database scripts
│   ├── create_tables.sql # SQL schema
│   └── data_importer.py  # Data import script
└── START.md              # This file
```

## API Endpoints

The backend provides the following API endpoints:

- `GET /api/parks` - Get all parks
- `GET /api/facilities` - Get all facilities
- `GET /api/trails` - Get all trails
- `GET /api/reviews/park/:parkId` - Get park reviews
- `POST /api/reviews/createReview` - Create a review
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/:username/preferences` - Get user preferences
- `PUT /api/users/:username/preferences` - Update user preferences

## Development Tips

### Running in Development Mode

Install nodemon for auto-reload:
```bash
npm install -g nodemon
```

Then run:
```bash
nodemon server.js
```

### Viewing Database

Connect to MySQL and explore:
```bash
mysql -u root -p findmypark_nyc
```

Useful commands:
```sql
SHOW TABLES;
SELECT * FROM Park LIMIT 10;
SELECT * FROM User;
SELECT * FROM Review;
```

### Resetting Database

To start fresh:
```bash
mysql -u root -p < database/create_tables.sql
```

## Support

If you encounter any issues not covered in this guide:

1. Check the browser console (F12) for JavaScript errors
2. Check the server terminal for backend errors
3. Verify all prerequisites are installed correctly
4. Ensure MySQL service is running
5. Check that all ports are available

## Quick Start Script

For convenience, you can use the provided `start.sh` script (macOS/Linux):

```bash
chmod +x start.sh
./start.sh
```

This script will:
1. Check for Node.js and MySQL
2. Install npm dependencies
3. Start the MySQL service
4. Start the Node.js server

**Note:** Make sure to configure your database credentials before running the script.

---

**Happy exploring NYC parks! 🗽🌳**
