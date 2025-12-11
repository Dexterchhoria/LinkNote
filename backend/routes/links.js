const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation rules
const linkValidation = [
  body('url').isURL().withMessage('Invalid URL'),
  body('title').trim().notEmpty().isLength({ max: 255 }).withMessage('Title is required (max 255 characters)'),
  body('description').optional().trim().isLength({ max: 5000 }).withMessage('Description too long (max 5000 characters)'),
  body('category').optional().trim().isLength({ max: 100 }).withMessage('Category too long (max 100 characters)')
];

// Get all links for authenticated user
router.get('/', async (req, res) => {
  try {
    const { search, category, sortBy } = req.query;
    
    let query = 'SELECT * FROM links WHERE user_id = $1';
    const params = [req.user.id];
    
    // Add search filter
    if (search) {
      query += ' AND (title ILIKE $2 OR description ILIKE $2 OR url ILIKE $2 OR category ILIKE $2)';
      params.push(`%${search}%`);
    }
    
    // Add category filter
    if (category) {
      const paramIndex = params.length + 1;
      query += ` AND category = $${paramIndex}`;
      params.push(category);
    }
    
    // Add sorting
    switch (sortBy) {
      case 'oldest':
        query += ' ORDER BY created_at ASC';
        break;
      case 'title':
        query += ' ORDER BY title ASC';
        break;
      case 'newest':
      default:
        query += ' ORDER BY created_at DESC';
    }
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      links: result.rows
    });
  } catch (error) {
    console.error('Get links error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching links' 
    });
  }
});

// Get single link by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM links WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Link not found' 
      });
    }
    
    res.json({
      success: true,
      link: result.rows[0]
    });
  } catch (error) {
    console.error('Get link error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching link' 
    });
  }
});

// Create new link
router.post('/', linkValidation, async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const { url, title, description, category } = req.body;
    
    const result = await pool.query(
      'INSERT INTO links (user_id, url, title, description, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, url, title, description || null, category || null]
    );
    
    res.status(201).json({
      success: true,
      message: 'Link created successfully',
      link: result.rows[0]
    });
  } catch (error) {
    console.error('Create link error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating link' 
    });
  }
});

// Update link
router.put('/:id', linkValidation, async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const { url, title, description, category } = req.body;
    
    // Check if link exists and belongs to user
    const checkResult = await pool.query(
      'SELECT id FROM links WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Link not found' 
      });
    }
    
    const result = await pool.query(
      'UPDATE links SET url = $1, title = $2, description = $3, category = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [url, title, description || null, category || null, req.params.id, req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Link updated successfully',
      link: result.rows[0]
    });
  } catch (error) {
    console.error('Update link error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating link' 
    });
  }
});

// Delete link
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM links WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Link not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Link deleted successfully'
    });
  } catch (error) {
    console.error('Delete link error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting link' 
    });
  }
});

// Get all categories for user
router.get('/categories/list', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM links WHERE user_id = $1 AND category IS NOT NULL ORDER BY category',
      [req.user.id]
    );
    
    res.json({
      success: true,
      categories: result.rows.map(row => row.category)
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching categories' 
    });
  }
});

module.exports = router;
