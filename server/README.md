# FindMyPark NYC - Backend API

Express.js backend server providing RESTful API for the FindMyPark NYC application.

## Project Structure

```
Server/
├── config/
│   ├── database.js      # Database configuration
│   └── dbConnection.js  # Database connection setup
├── models/
│   ├── User.js          # User model
│   ├── Park.js          # Park model
│   ├── Facility.js      # Facility model
│   ├── Trail.js         # Trail model
│   └── Review.js        # Review model
├── routes/
│   ├── parksRoutes.js         # Park routes
│   ├── facilitiesRoutes.js    # Facility routes
│   ├── trailsRoutes.js        # Trail routes
│   ├── reviewsRoutes.js       # Review routes
│   └── usersRoutes.js         # User routes
├── controllers/
│   ├── parkController.js      # Park controller
│   ├── facilityController.js  # Facility controller
│   ├── trailController.js     # Trail controller
│   ├── reviewController.js    # Review controller
│   └── userController.js      # User controller
├── server.js            # Main server file
├── package.json         # Project dependencies
└── .env                 # Environment variables
```

## Installation and Running

### 1. Install Dependencies

```bash
cd Server
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `Server` directory with the following configuration:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=findmypark_nyc
DB_PORT=3306
PORT=3000
```

### 3. Start the Server

Development mode (auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start at `http://localhost:3000`.

## API Endpoints

### Parks

- `GET /api/parks` - Get list of parks
  - Query parameters: `name`, `borough`, `latitude`, `longitude`, `radius`, `limit`
- `GET /api/parks/:parkId` - Get a single park
  - Query parameters: `details=true` (includes facilities and trails)
- `GET /api/parks/boroughs` - Get all boroughs
- `GET /api/parks/stats` - Get statistics
- `GET /api/parks/by-facility?facilityType=...` - Get parks by facility type

### Facilities

- `GET /api/facilities` - Get list of facilities
  - Query parameters: `type`, `park_id`, `is_lighted`, `is_accessible`, `borough`, `limit`
- `GET /api/facilities/:facilityId` - Get a single facility
- `GET /api/facilities/types` - Get all facility types
- `GET /api/facilities/stats` - Get statistics

### Trails

- `GET /api/trails` - Get list of trails
  - Query parameters: `park_id`, `difficulty`, `limit`
- `GET /api/trails/:trailId` - Get a single trail
- `GET /api/trails/difficulties` - Get all difficulty levels
- `GET /api/trails/stats` - Get statistics

### Reviews

- `POST /api/reviews` - Create a review
  - Body: `{ user_id, park_id?, facility_id?, rating, comment? }`
- `GET /api/reviews/:reviewId` - Get a single review
- `PUT /api/reviews/:reviewId` - Update a review
- `DELETE /api/reviews/:reviewId` - Delete a review
- `GET /api/reviews/park/:parkId` - Get park reviews
- `GET /api/reviews/facility/:facilityId` - Get facility reviews
- `GET /api/reviews/user/:userId` - Get user reviews

### Users

- `POST /api/users/register` - Register a new user
  - Body: `{ username, email, password }`
- `POST /api/users/login` - User login
  - Body: `{ username, password }`
- `GET /api/users/:userId` - Get user information
- `PUT /api/users/:userId` - Update user information
- `DELETE /api/users/:userId` - Delete user
- `GET /api/users/preferences` - Get user preferences
  - Requires authentication (user_id in query or session)
- `PUT /api/users/preferences` - Update user preferences
  - Body: `{ favorite_facilities: [], preferred_boroughs: [], ... }`

### Other

- `GET /` - Frontend application (serves index.html)
- `GET /health` - Health check

## Usage Examples

### Search Parks

```bash
# Search by name
curl "http://localhost:3000/api/parks?name=Central&limit=10"

# Search by borough
curl "http://localhost:3000/api/parks?borough=Manhattan&limit=20"

# Nearby search
curl "http://localhost:3000/api/parks?latitude=40.7829&longitude=-73.9654&radius=2.0"
```

### Get Park Details

```bash
# Basic information
curl "http://localhost:3000/api/parks/park_id_123"

# Include facilities and trails
curl "http://localhost:3000/api/parks/park_id_123?details=true"
```

### Search Facilities

```bash
# Search basketball courts
curl "http://localhost:3000/api/facilities?type=Basketball&limit=10"

# Search lighted tennis courts
curl "http://localhost:3000/api/facilities?type=Tennis&is_lighted=true"

# Search accessible facilities
curl "http://localhost:3000/api/facilities?is_accessible=true&borough=Manhattan"
```

### Create Review

```bash
curl -X POST "http://localhost:3000/api/reviews" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "park_id": "park_id_123",
    "rating": 4.5,
    "comment": "Great park!"
  }'
```

### User Registration

```bash
curl -X POST "http://localhost:3000/api/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "secure_password"
  }'
```

### Update User Preferences

```bash
curl -X PUT "http://localhost:3000/api/users/preferences?user_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "favorite_facilities": ["Basketball", "Tennis"],
    "preferred_boroughs": ["Manhattan", "Brooklyn"]
  }'
```

## Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Sequelize** - ORM for MySQL
- **MySQL2** - MySQL database driver
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## Notes

1. **Password Security**: User passwords are hashed using bcrypt
2. **SQL Injection Protection**: All queries use parameterized queries through Sequelize
3. **Error Handling**: Complete error handling mechanism included
4. **Connection Pool**: Database connections managed through Sequelize connection pool
5. **CORS**: CORS enabled to allow cross-origin requests
6. **Static Files**: Server serves static files from the `../client` directory
7. **User Preferences**: User preferences stored as JSON in the `preferences` field of the User model

## Development Recommendations

1. Use `nodemon` for development to auto-restart the server
2. Use Postman or similar tools to test APIs
3. Use environment variables to manage sensitive information in production
4. Consider adding JWT authentication middleware to protect routes that require authentication
5. Test database connection before starting the server
