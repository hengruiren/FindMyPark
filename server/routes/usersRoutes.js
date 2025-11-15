/**
 * User routes
 */
const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController");

// Register new user
router.post("/register", UserController.register);

// User login
router.post("/login", UserController.login);

// Get all users (must be before /:username route)
router.get("/", UserController.getAllUsers);

// Get user by email (must be before /:username route)
router.get("/email/:email", UserController.getUserByEmail);

// Get user by username
router.get("/:username", UserController.getUserByUsername);

// Update user information (requires authentication middleware)
router.put("/:username", UserController.updateUser);

// Delete user (requires authentication middleware)
router.delete("/:username", UserController.deleteUser);

module.exports = router;
