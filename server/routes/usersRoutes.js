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

// Get user by ID
router.get("/:userId", UserController.getUserById);

// Update user information (requires authentication middleware)
router.put("/:userId", UserController.updateUser);

// Delete user (requires authentication middleware)
router.delete("/:userId", UserController.deleteUser);

module.exports = router;

