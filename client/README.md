# FindMyPark NYC - Frontend Application

A complete New York City parks map application that allows users to browse, search, and filter parks and facilities in NYC.

## Features

### 🗺️ Map Features
- Interactive New York City map (using Leaflet.js)
- All parks displayed as markers on the map
- Parks with facilities use blue markers, others use gray markers
- Click markers to display basic park information

### 🔍 Search Functionality
- Search by park name
- Real-time filtering of results

### 🏷️ Filter Features
- **Facility Type Filter**: Basketball, Volleyball, Tennis, Soccer, etc.
- **Borough Filter**: Bronx, Brooklyn, Manhattan, Queens, Staten Island
- Support for multi-condition combination filtering

### 📊 Statistics
- Display total number of parks
- Display number of parks after current filtering
- Display total number of facilities

### 📋 Detailed Information Panel
- Display detailed information when clicking map markers or parks
- Show basic park information (name, borough, type, area, etc.)
- Display all facility types and counts within the park
- Show detailed facility information including dimensions, surface, lighting, accessibility, condition, and ratings

### 👤 User Features
- User registration and login
- User settings and preferences
- Favorite facilities selection
- Preferred boroughs selection
- Display preferences (show only favorite facilities, prioritize preferred boroughs)

## Usage

### 1. Start the Server

Make sure the backend server is running:
```bash
cd Server
npm start
```

The server should be running at `http://localhost:3000`

### 2. Open the Frontend Application

There are two ways:

**Method 1: Directly open HTML file**
```bash
# Open in browser
open client/index.html
```

**Method 2: Access through server**
If the server is configured to serve static files, you can access:
```
http://localhost:3000/
```

### 3. Using Features

1. **Search Parks**: Enter park name in the search box, click search or press Enter
2. **Filter by Facility**: Click facility type buttons (Basketball, Volleyball, etc.)
3. **Filter by Borough**: Click borough buttons (Manhattan, Brooklyn, etc.)
4. **View Details**: Click markers on the map
5. **Reset View**: Click "Reset View" button to return to NYC center
6. **Clear Filters**: Click "Clear Filters" button to reset all filter conditions
7. **User Login/Logout**: Use the login/logout buttons in the header
8. **User Settings**: Click "Settings" button to configure preferences

## Technology Stack

- **HTML5** - Page structure
- **CSS3** - Styling and responsive design
- **JavaScript (ES6+)** - Application logic
- **Leaflet.js** - Map functionality
- **Fetch API** - Communication with backend API

## Directory Structure

```
client/
├── index.html          # Main page
├── css/
│   └── style.css      # Stylesheet
├── js/
│   └── app.js         # Main JavaScript logic
├── images/
│   └── logo.png       # Application logo
└── README.md          # Documentation
```

## API Endpoints Used

The frontend application uses the following backend APIs:

- `GET /api/parks` - Get all parks
- `GET /api/parks/boroughs` - Get all boroughs
- `GET /api/parks/stats` - Get statistics
- `GET /api/parks/by-facility?facilityType=...` - Get parks by facility type
- `GET /api/facilities` - Get all facilities
- `GET /api/facilities/types` - Get facility types
- `GET /api/facilities?park_id=...` - Get facilities for a specific park
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/preferences` - Get user preferences
- `PUT /api/users/preferences` - Update user preferences

## Browser Compatibility

- Chrome (Recommended)
- Firefox
- Safari
- Edge

## Notes

1. Make sure the backend server is running
2. If you encounter CORS errors, check the server CORS configuration
3. Initial load may take some time to load all park data
4. Map markers update in real-time based on filter conditions
5. User preferences are saved to the backend and persist across sessions
6. All parks are loaded with a limit of 10000 to ensure complete data display
