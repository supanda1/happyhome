# Toilet Services (Classic) - Image Assets

## Overview
This directory contains 5 high-quality toilet service images downloaded from Pexels.com for the "Toilet Services (Classic)" subcategory.

## Image Details

### Files
- `toilet-service-1.jpg` - Modern toilet installation
- `toilet-service-2.jpg` - Bathroom plumbing work 
- `toilet-service-3.jpg` - Toilet repair service
- `toilet-service-4.jpg` - Professional toilet maintenance
- `toilet-service-5.jpg` - Toilet installation tools

### Technical Specifications
- **Format**: JPEG
- **Resolution**: 800px width (optimized for web)
- **Compression**: Auto-compressed from Pexels
- **Source**: Pexels.com (License-free)
- **Usage**: Commercial use allowed

### License Information
All images are sourced from Pexels.com under their free license:
- ✅ Free for commercial use
- ✅ No attribution required (but appreciated)
- ✅ Modification allowed
- ✅ Distribution allowed

## Integration

### Database Integration
Images are integrated into the PostgreSQL database via the `subcategories` table:
```sql
UPDATE subcategories 
SET image_paths = '[
  "/images/subcategories/plumbing/toilet-services/toilet-service-1.jpg",
  "/images/subcategories/plumbing/toilet-services/toilet-service-2.jpg", 
  "/images/subcategories/plumbing/toilet-services/toilet-service-3.jpg",
  "/images/subcategories/plumbing/toilet-services/toilet-service-4.jpg",
  "/images/subcategories/plumbing/toilet-services/toilet-service-5.jpg"
]'::jsonb 
WHERE name = 'Toilets';
```

### Frontend Integration
Images are automatically loaded via:
- `DynamicImage` component for subcategory display
- `SmartImage` component with fallback support
- Backend API serving image paths from database

### Image Rotation
The system automatically rotates through the 5 images:
- Category page: Shows image 1 by default
- Service detail page: Cycles through all 5 images
- Admin panel: Displays all available images

## Maintenance

### Adding New Images
1. Download images from Pexels.com
2. Optimize for web (800px width recommended)
3. Save to this directory with sequential naming
4. Update database `image_paths` array
5. Update frontend image mappings if needed

### Image Optimization
Current images are web-optimized. For better performance:
- Consider WebP format for modern browsers
- Implement lazy loading
- Add responsive image sizes

## Performance Notes
- Images are served directly from the public directory
- No CDN currently configured (consider for production)
- Browser caching enabled for static assets
- Total directory size: ~500KB for 5 images

## Future Enhancements
- [ ] Add WebP format support
- [ ] Implement progressive image loading
- [ ] Add image compression middleware
- [ ] Consider CDN integration for production
- [ ] Add image alt text optimization