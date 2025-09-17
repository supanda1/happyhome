/**
 * Admin API Routes
 */

const express = require('express');
const router = express.Router();

// Mock contact settings data (since no database is set up for this)
let mockContactSettings = {
    companyName: "Happy Homes",
    tagline: "Your trusted home service partner", 
    phone: "",
    email: "",
    emergencyPhone: "",
    whatsappNumber: "",
    facebookUrl: "https://www.facebook.com/happyhomes.official",
    twitterUrl: "https://x.com/happyhomes_in",
    address: ""
};

/**
 * GET /api/admin/contact-settings
 * Get contact settings
 */
router.get('/contact-settings', (req, res) => {
    console.log('🔄 GET /api/admin/contact-settings');
    
    res.json({
        success: true,
        message: 'Contact settings retrieved successfully',
        data: mockContactSettings
    });
});

/**
 * PUT /api/admin/contact-settings
 * Update contact settings
 */
router.put('/contact-settings', (req, res) => {
    console.log('🔄 PUT /api/admin/contact-settings');
    
    // DEBUG: Log received data
    console.log('🐛 Backend received data:', req.body);
    console.log('🐛 Keys in data:', Object.keys(req.body));
    console.log('🐛 Required fields check:');
    console.log('  - phone:', `"${req.body.phone || ''}"`);
    console.log('  - email:', `"${req.body.email || ''}"`);
    console.log('  - companyName:', `"${req.body.companyName || ''}"`);
    
    // Validate required fields
    const requiredFields = ['phone', 'email', 'companyName'];
    const missingFields = requiredFields.filter(field => 
        !req.body[field] || req.body[field].trim() === ''
    );
    
    console.log('🐛 Missing fields:', missingFields);
    
    if (missingFields.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Phone, email, and company name are required'
        });
    }
    
    // Update mock data
    mockContactSettings = {
        ...mockContactSettings,
        ...req.body,
        updated_at: new Date().toISOString()
    };
    
    console.log('✅ Contact settings updated successfully');
    
    res.json({
        success: true,
        message: 'Contact settings updated successfully',
        data: mockContactSettings
    });
});

module.exports = router;