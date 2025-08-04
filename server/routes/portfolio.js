const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const Portfolio = require('../models/Portfolio');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Multer destination called');
    console.log('Current working directory:', process.cwd());
    console.log('Target directory:', 'uploads/portfolio/');
    
    // Ensure directory exists
    const fs = require('fs');
    const uploadDir = 'uploads/portfolio/';
    
    if (!fs.existsSync(uploadDir)) {
      console.log('Creating directory:', uploadDir);
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('Multer fileFilter called for:', file.originalname);
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      console.log('File accepted:', file.originalname);
      return cb(null, true);
    } else {
      console.log('File rejected:', file.originalname, 'mimetype:', file.mimetype);
      cb(new Error('Tylko pliki obrazów są dozwolone!'));
    }
  }
});

// Get all portfolio items
router.get('/', async (req, res) => {
  try {
    const { category, active } = req.query;
    
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const portfolio = await Portfolio.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ order: 1, createdAt: -1 });

    res.json(portfolio);
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania portfolio' });
  }
});

// Get single portfolio item
router.get('/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Element portfolio nie został znaleziony' });
    }

    res.json(portfolio);
  } catch (error) {
    console.error('Get portfolio item error:', error);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania elementu portfolio' });
  }
});

// Create new portfolio item
router.post('/', [
  auth,
  requireRole(['admin', 'manager']),
  upload.single('image'),
  body('title').trim().isLength({ min: 3 }),
  body('description').trim().isLength({ min: 10 }),
  body('category').isIn(['web', 'mobile', 'desktop', 'api', 'other'])
], async (req, res) => {
  console.log('POST /portfolio - Request received');
  console.log('Files:', req.files);
  console.log('File:', req.file);
  console.log('Body:', req.body);
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Nieprawidłowe dane portfolio',
        errors: errors.array() 
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Obraz jest wymagany' });
    }

    // Parse technologies from JSON string if needed
    let technologies = [];
    console.log('Received technologies:', req.body.technologies);
    console.log('Type of technologies:', typeof req.body.technologies);
    
    if (req.body.technologies) {
      try {
        if (typeof req.body.technologies === 'string') {
          technologies = JSON.parse(req.body.technologies);
        } else {
          technologies = req.body.technologies;
        }
        console.log('Parsed technologies:', technologies);
      } catch (error) {
        console.error('Error parsing technologies:', error);
        return res.status(400).json({ 
          message: 'Nieprawidłowy format technologii',
          errors: [{ type: 'field', value: req.body.technologies, msg: 'Invalid technologies format', path: 'technologies', location: 'body' }]
        });
      }
    }

    // Validate technologies array
    if (!Array.isArray(technologies) || technologies.length === 0) {
      return res.status(400).json({ 
        message: 'Technologie są wymagane',
        errors: [{ type: 'field', value: req.body.technologies, msg: 'Technologies are required', path: 'technologies', location: 'body' }]
      });
    }

    const portfolioData = {
      ...req.body,
      technologies: technologies.filter(tech => tech.trim() !== ''),
      image: `/uploads/portfolio/${req.file.filename}`,
      createdBy: req.user._id
    };

    const portfolio = new Portfolio(portfolioData);
    await portfolio.save();

    const populatedPortfolio = await Portfolio.findById(portfolio._id)
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      message: 'Element portfolio został utworzony pomyślnie',
      portfolio: populatedPortfolio
    });
  } catch (error) {
    console.error('Create portfolio error:', error);
    res.status(500).json({ message: 'Błąd serwera podczas tworzenia elementu portfolio' });
  }
});

// Update portfolio item
router.put('/:id', [
  auth,
  requireRole(['admin', 'manager']),
  upload.single('image'),
  body('title').trim().isLength({ min: 3 }),
  body('description').trim().isLength({ min: 10 }),
  body('category').isIn(['web', 'mobile', 'desktop', 'api', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Nieprawidłowe dane portfolio',
        errors: errors.array() 
      });
    }

    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Element portfolio nie został znaleziony' });
    }

    const updateData = { ...req.body };
    
    // Parse technologies from JSON string if needed
    if (req.body.technologies) {
      console.log('Update - Received technologies:', req.body.technologies);
      console.log('Update - Type of technologies:', typeof req.body.technologies);
      
      try {
        if (typeof req.body.technologies === 'string') {
          updateData.technologies = JSON.parse(req.body.technologies);
        } else {
          updateData.technologies = req.body.technologies;
        }
        // Filter out empty technologies
        updateData.technologies = updateData.technologies.filter(tech => tech.trim() !== '');
        console.log('Update - Parsed technologies:', updateData.technologies);
      } catch (error) {
        console.error('Update - Error parsing technologies:', error);
        return res.status(400).json({ 
          message: 'Nieprawidłowy format technologii',
          errors: [{ type: 'field', value: req.body.technologies, msg: 'Invalid technologies format', path: 'technologies', location: 'body' }]
        });
      }
    }
    
    if (req.file) {
      updateData.image = `/uploads/portfolio/${req.file.filename}`;
    }

    Object.assign(portfolio, updateData);
    await portfolio.save();

    const updatedPortfolio = await Portfolio.findById(portfolio._id)
      .populate('createdBy', 'firstName lastName');

    res.json({
      message: 'Element portfolio został zaktualizowany pomyślnie',
      portfolio: updatedPortfolio
    });
  } catch (error) {
    console.error('Update portfolio error:', error);
    res.status(500).json({ message: 'Błąd serwera podczas aktualizacji elementu portfolio' });
  }
});

// Delete portfolio item
router.delete('/:id', [
  auth,
  requireRole(['admin', 'manager'])
], async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Element portfolio nie został znaleziony' });
    }

    await Portfolio.findByIdAndDelete(req.params.id);

    res.json({ message: 'Element portfolio został usunięty pomyślnie' });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    res.status(500).json({ message: 'Błąd serwera podczas usuwania elementu portfolio' });
  }
});

// Update portfolio order
router.put('/:id/order', [
  auth,
  requireRole(['admin', 'manager']),
  body('order').isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Nieprawidłowa kolejność',
        errors: errors.array() 
      });
    }

    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Element portfolio nie został znaleziony' });
    }

    portfolio.order = req.body.order;
    await portfolio.save();

    res.json({
      message: 'Kolejność została zaktualizowana pomyślnie',
      portfolio
    });
  } catch (error) {
    console.error('Update portfolio order error:', error);
    res.status(500).json({ message: 'Błąd serwera podczas aktualizacji kolejności' });
  }
});

// Toggle portfolio item active status
router.patch('/:id/toggle', [
  auth,
  requireRole(['admin', 'manager'])
], async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Element portfolio nie został znaleziony' });
    }

    portfolio.isActive = !portfolio.isActive;
    await portfolio.save();

    res.json({
      message: `Element portfolio został ${portfolio.isActive ? 'aktywowany' : 'dezaktywowany'} pomyślnie`,
      portfolio
    });
  } catch (error) {
    console.error('Toggle portfolio error:', error);
    res.status(500).json({ message: 'Błąd serwera podczas zmiany statusu elementu portfolio' });
  }
});

module.exports = router; 