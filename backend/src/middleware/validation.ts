import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

// Helper function to handle validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined
      }))
    });
  }
  
  next();
};

// UUID validation - returns array of middleware functions
export const validateUUID = (fieldName: string = 'id') => {
  return [
    param(fieldName)
      .isUUID(4)
      .withMessage(`${fieldName} must be a valid UUID`),
    handleValidationErrors
  ];
};

// Common validation rules
export const commonValidations = {
  // Required string with length constraints
  requiredString: (fieldName: string, minLength: number = 1, maxLength: number = 255) => 
    body(fieldName)
      .trim()
      .notEmpty()
      .withMessage(`${fieldName} is required`)
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${fieldName} must be between ${minLength} and ${maxLength} characters`),

  // Optional string with length constraints
  optionalString: (fieldName: string, maxLength: number = 255) =>
    body(fieldName)
      .optional()
      .trim()
      .isLength({ max: maxLength })
      .withMessage(`${fieldName} must be at most ${maxLength} characters`),

  // Email validation
  email: (fieldName: string = 'email') =>
    body(fieldName)
      .trim()
      .notEmpty()
      .withMessage(`${fieldName} is required`)
      .isEmail()
      .withMessage(`${fieldName} must be a valid email address`)
      .normalizeEmail(),

  // Phone validation
  phone: (fieldName: string = 'phone') =>
    body(fieldName)
      .trim()
      .notEmpty()
      .withMessage(`${fieldName} is required`)
      .matches(/^[+]?[\d\s\-\(\)]{10,15}$/)
      .withMessage(`${fieldName} must be a valid phone number`),

  // Positive number validation
  positiveNumber: (fieldName: string) =>
    body(fieldName)
      .notEmpty()
      .withMessage(`${fieldName} is required`)
      .isFloat({ min: 0 })
      .withMessage(`${fieldName} must be a positive number`),

  // Positive integer validation
  positiveInteger: (fieldName: string) =>
    body(fieldName)
      .notEmpty()
      .withMessage(`${fieldName} is required`)
      .isInt({ min: 0 })
      .withMessage(`${fieldName} must be a positive integer`),

  // Boolean validation
  boolean: (fieldName: string) =>
    body(fieldName)
      .optional()
      .isBoolean()
      .withMessage(`${fieldName} must be a boolean`),

  // Date validation
  date: (fieldName: string) =>
    body(fieldName)
      .notEmpty()
      .withMessage(`${fieldName} is required`)
      .isISO8601()
      .withMessage(`${fieldName} must be a valid ISO 8601 date`),

  // Optional date validation
  optionalDate: (fieldName: string) =>
    body(fieldName)
      .optional()
      .isISO8601()
      .withMessage(`${fieldName} must be a valid ISO 8601 date`),

  // Array validation
  array: (fieldName: string) =>
    body(fieldName)
      .isArray()
      .withMessage(`${fieldName} must be an array`),

  // Optional array validation
  optionalArray: (fieldName: string) =>
    body(fieldName)
      .optional()
      .isArray()
      .withMessage(`${fieldName} must be an array`),

  // JSON validation
  json: (fieldName: string) =>
    body(fieldName)
      .custom((value) => {
        try {
          if (typeof value === 'string') {
            JSON.parse(value);
          }
          return true;
        } catch {
          throw new Error(`${fieldName} must be valid JSON`);
        }
      }),

  // UUID validation for body
  uuid: (fieldName: string) =>
    body(fieldName)
      .notEmpty()
      .withMessage(`${fieldName} is required`)
      .isUUID(4)
      .withMessage(`${fieldName} must be a valid UUID`),

  // Optional UUID validation
  optionalUUID: (fieldName: string) =>
    body(fieldName)
      .optional()
      .isUUID(4)
      .withMessage(`${fieldName} must be a valid UUID`),

  // Enum validation
  enum: (fieldName: string, validValues: string[]) =>
    body(fieldName)
      .notEmpty()
      .withMessage(`${fieldName} is required`)
      .isIn(validValues)
      .withMessage(`${fieldName} must be one of: ${validValues.join(', ')}`),

  // Optional enum validation
  optionalEnum: (fieldName: string, validValues: string[]) =>
    body(fieldName)
      .optional()
      .isIn(validValues)
      .withMessage(`${fieldName} must be one of: ${validValues.join(', ')}`),

  // GST percentage validation (0, 5, 12, 18, 28)
  gstPercentage: (fieldName: string = 'gst_percentage') =>
    body(fieldName)
      .optional()
      .isIn(['0', '5', '12', '18', '28'])
      .withMessage(`${fieldName} must be one of: 0, 5, 12, 18, 28`),

  // Discount type validation
  discountType: (fieldName: string = 'discount_type') =>
    body(fieldName)
      .notEmpty()
      .withMessage(`${fieldName} is required`)
      .isIn(['percentage', 'fixed_amount', 'free_service'])
      .withMessage(`${fieldName} must be one of: percentage, fixed_amount, free_service`),

  // Rating validation (1-5)
  rating: (fieldName: string = 'rating') =>
    body(fieldName)
      .optional()
      .isFloat({ min: 1, max: 5 })
      .withMessage(`${fieldName} must be between 1 and 5`),

  // Pagination validation
  pagination: {
    page: query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page must be a positive integer'),
    
    limit: query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
  }
};

// Business logic validation helpers
export const businessValidations = {
  // Validate discount value based on discount type
  discountValue: (discountTypeField: string = 'discount_type', discountValueField: string = 'discount_value') =>
    body(discountValueField)
      .custom((value, { req }) => {
        const discountType = req.body[discountTypeField];
        
        if (discountType === 'percentage') {
          if (value < 0 || value > 100) {
            throw new Error('Discount percentage must be between 0 and 100');
          }
        } else if (discountType === 'fixed_amount') {
          if (value < 0) {
            throw new Error('Fixed discount amount must be positive');
          }
        }
        
        return true;
      }),

  // Validate date ranges
  dateRange: (startDateField: string, endDateField: string) =>
    body(endDateField)
      .custom((value, { req }) => {
        const startDate = new Date(req.body[startDateField]);
        const endDate = new Date(value);
        
        if (endDate <= startDate) {
          throw new Error(`${endDateField} must be after ${startDateField}`);
        }
        
        return true;
      }),

  // Validate future date
  futureDate: (fieldName: string) =>
    body(fieldName)
      .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        
        if (date <= now) {
          throw new Error(`${fieldName} must be in the future`);
        }
        
        return true;
      }),

  // Validate minimum order amount vs maximum discount
  couponAmounts: () =>
    body('maximum_discount_amount')
      .optional()
      .custom((value, { req }) => {
        const minOrderAmount = parseFloat(req.body.minimum_order_amount) || 0;
        const maxDiscount = parseFloat(value) || 0;
        
        if (maxDiscount > 0 && maxDiscount > minOrderAmount) {
          throw new Error('Maximum discount amount cannot exceed minimum order amount');
        }
        
        return true;
      }),

  // Validate price relationships
  priceValidation: (basePriceField: string = 'base_price', discountedPriceField: string = 'discounted_price') =>
    body(discountedPriceField)
      .optional()
      .custom((value, { req }) => {
        const basePrice = parseFloat(req.body[basePriceField]) || 0;
        const discountedPrice = parseFloat(value) || 0;
        
        if (discountedPrice > 0 && discountedPrice >= basePrice) {
          throw new Error('Discounted price must be less than base price');
        }
        
        return true;
      })
};

// Pre-built validation chains for common entities
export const validationChains = {
  // Category validation
  category: {
    create: [
      commonValidations.requiredString('name', 2, 100),
      commonValidations.requiredString('description', 5, 500),
      commonValidations.optionalString('icon', 10),
      commonValidations.boolean('is_active'),
      commonValidations.positiveInteger('sort_order'),
      handleValidationErrors
    ],
    
    update: [
      validateUUID('id'),
      commonValidations.optionalString('name', 100),
      commonValidations.optionalString('description', 500),
      commonValidations.optionalString('icon', 10),
      commonValidations.boolean('is_active'),
      body('sort_order').optional().isInt({ min: 0 }),
      handleValidationErrors
    ]
  },

  // Service validation
  service: {
    create: [
      commonValidations.requiredString('name', 2, 200),
      commonValidations.requiredString('description', 10),
      commonValidations.optionalString('short_description', 300),
      commonValidations.uuid('category_id'),
      commonValidations.optionalUUID('subcategory_id'),
      commonValidations.positiveNumber('base_price'),
      body('discounted_price').optional().isFloat({ min: 0 }),
      commonValidations.positiveInteger('duration'),
      commonValidations.optionalArray('inclusions'),
      commonValidations.optionalArray('exclusions'),
      commonValidations.optionalArray('requirements'),
      commonValidations.boolean('is_active'),
      commonValidations.boolean('is_featured'),
      commonValidations.gstPercentage(),
      commonValidations.positiveNumber('service_charge'),
      businessValidations.priceValidation(),
      handleValidationErrors
    ]
  },

  // Coupon validation
  coupon: {
    create: [
      commonValidations.requiredString('code', 3, 50),
      commonValidations.requiredString('title', 5, 200),
      commonValidations.requiredString('description', 10),
      commonValidations.discountType(),
      commonValidations.positiveNumber('discount_value'),
      commonValidations.positiveNumber('minimum_order_amount'),
      body('maximum_discount_amount').optional().isFloat({ min: 0 }),
      commonValidations.date('valid_from'),
      commonValidations.date('valid_until'),
      body('usage_limit').optional().isInt({ min: 1 }),
      body('usage_limit_per_user').optional().isInt({ min: 1 }),
      commonValidations.boolean('first_time_users_only'),
      commonValidations.optionalArray('applicable_categories'),
      commonValidations.optionalArray('applicable_services'),
      businessValidations.discountValue(),
      businessValidations.dateRange('valid_from', 'valid_until'),
      businessValidations.couponAmounts(),
      handleValidationErrors
    ]
  },

  // Employee validation
  employee: {
    create: [
      commonValidations.requiredString('employee_id', 3, 50),
      commonValidations.requiredString('name', 2, 100),
      commonValidations.requiredString('expert', 2, 100),
      commonValidations.optionalArray('expertise_areas'),
      commonValidations.requiredString('manager', 2, 100),
      commonValidations.phone(),
      commonValidations.email(),
      commonValidations.boolean('is_active'),
      handleValidationErrors
    ]
  },

  // Order validation
  order: {
    create: [
      commonValidations.uuid('customer_id'),
      commonValidations.array('items'),
      body('items.*.service_id').isUUID(4).withMessage('Each item must have a valid service_id'),
      body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item quantity must be at least 1'),
      commonValidations.optionalString('notes', 1000),
      handleValidationErrors
    ]
  },

  // Banner validation
  banner: {
    create: [
      commonValidations.requiredString('title', 2, 200),
      commonValidations.optionalString('subtitle', 300),
      commonValidations.optionalString('description'),
      commonValidations.optionalString('button_text', 100),
      commonValidations.optionalString('button_link', 500),
      commonValidations.optionalString('image_url', 500),
      body('background_color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Background color must be a valid hex color'),
      body('text_color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Text color must be a valid hex color'),
      commonValidations.optionalEnum('position_type', ['hero', 'secondary', 'promotional']),
      commonValidations.boolean('is_active'),
      commonValidations.positiveInteger('sort_order'),
      handleValidationErrors
    ]
  }
};