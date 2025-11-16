/**
 * User controller - Business logic layer
 */
const { User } = require("../models");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");

class UserController {
  // Register new user
  static async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if username already exists
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash password and create user
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        username,
        email,
        password_hash: passwordHash,
      });

      res.status(201).json({
        user_id: user.user_id,
        message: "User created successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // User login
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password required" });
      }

      const user = await User.findOne({ where: { username } });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Return user info (without password)
      const { password_hash, ...userInfo } = user.toJSON();
      res.json({ user: userInfo, message: "Login successful" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get all users
  static async getAllUsers(req, res) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ["password_hash"] },
        order: [["user_id", "ASC"]],
      });

      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get user by username
  static async getUserByUsername(req, res) {
    try {
      const { username } = req.params;
      const user = await User.findOne({
        where: { username },
        attributes: { exclude: ["password_hash"] },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = user.toJSON();
      // Parse preferences if exists
      if (userData.preferences && typeof userData.preferences === 'string') {
        try {
          userData.preferences = JSON.parse(userData.preferences);
        } catch (e) {
          userData.preferences = null;
        }
      }

      res.json(userData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get user preferences
  static async getUserPreferences(req, res) {
    try {
      const { username } = req.params;
      const user = await User.findOne({
        where: { username },
        attributes: ['user_id', 'username', 'preferences'],
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = user.toJSON();
      const preferences = userData.preferences ? 
        (typeof userData.preferences === 'string' ? JSON.parse(userData.preferences) : userData.preferences) : 
        null;

      res.json({ preferences });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update user preferences
  static async updateUserPreferences(req, res) {
    try {
      const { username } = req.params;
      const { preferences } = req.body;

      if (!preferences || typeof preferences !== 'object') {
        return res.status(400).json({ error: "Invalid preferences format" });
      }

      const user = await User.findOne({ where: { username } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await User.update(
        { preferences: JSON.stringify(preferences) },
        { where: { username } }
      );

      res.json({ message: "Preferences updated successfully", preferences });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get user by email
  static async getUserByEmail(req, res) {
    try {
      const { email } = req.params;
      const user = await User.findOne({
        where: { email },
        attributes: { exclude: ["password_hash"] },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update user information
  static async updateUser(req, res) {
    try {
      const { username } = req.params;
      const updates = req.body;

      // Hash password if updating
      if (updates.password) {
        updates.password_hash = await bcrypt.hash(updates.password, 10);
        delete updates.password;
      }

      // Only allow specific fields to be updated
      const allowedFields = ["username", "email", "password_hash", "preferences"];
      const updateData = {};
      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });

      // Handle preferences as JSON string
      if (updates.preferences && typeof updates.preferences === 'object') {
        updateData.preferences = JSON.stringify(updates.preferences);
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const [updated] = await User.update(updateData, {
        where: { username },
      });

      if (updated === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "User updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Delete user
  static async deleteUser(req, res) {
    try {
      const { username } = req.params;
      const deleted = await User.destroy({ where: { username } });

      if (deleted === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = UserController;
