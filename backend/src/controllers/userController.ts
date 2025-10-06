import { Request, Response } from 'express';
import pool from '../config/database';
import jwt from 'jsonwebtoken';

// JWT payload interface
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// User Address Interface (matching frontend expectations)
interface UserAddress {
  id: string;
  addressType: 'home' | 'office' | 'other';
  fullName: string;
  mobileNumber: string;
  pincode: string;
  houseNumber: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper function to extract user ID from JWT token (cookies or header)
const getUserIdFromToken = (req: Request): string | null => {
  // Simple cookie parser helper
  const parseCookies = (req: Request): Record<string, string> => {
    const cookies: Record<string, string> = {};
    const cookieHeader = req.headers.cookie;
    
    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.split('=');
        const value = rest.join('=').trim();
        if (name && value) {
          cookies[name.trim()] = decodeURIComponent(value);
        }
      });
    }
    
    return cookies;
  };

  // Get cookies from request
  const cookies = parseCookies(req);
  
  // First try to get token from HTTP-only cookie
  let token = cookies.access_token;
  
  // Fallback to Authorization header if no cookie (for backward compatibility)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded.userId;
  } catch {
    return null;
  }
};

// GET /api/user/addresses - Get user's addresses
export const getUserAddresses = async (req: Request, res: Response) => {
  try {
    
    // Try to get authenticated user ID
    const userId = getUserIdFromToken(req);
    
    if (!userId) {
      // User not authenticated - return empty addresses for anonymous users
      return res.json({
        success: true,
        data: []
      });
    }
    
    
    // Query addresses from database with user information
    const result = await pool.query(`
      SELECT 
        ua.id,
        ua.type as address_type,
        ua.title,
        ua.full_address,
        ua.landmark,
        ua.city,
        ua.state,
        ua.postal_code,
        ua.country,
        ua.is_default,
        ua.created_at,
        ua.updated_at,
        u.first_name,
        u.last_name,
        u.phone
      FROM user_addresses ua
      LEFT JOIN users u ON ua.user_id = u.id
      WHERE ua.user_id = $1 AND ua.is_active = true
      ORDER BY ua.is_default DESC, ua.created_at DESC
    `, [userId]);
    
    // Transform database result to frontend format
    const addresses: UserAddress[] = result.rows.map(row => ({
      id: row.id,
      addressType: row.address_type as 'home' | 'office' | 'other',
      fullName: `${row.first_name} ${row.last_name}`.trim(),
      mobileNumber: row.phone || '',
      pincode: row.postal_code,
      houseNumber: '', // Will extract from full_address
      area: row.full_address,
      landmark: row.landmark || '',
      city: row.city,
      state: row.state,
      isDefault: row.is_default,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    
    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch addresses'
    });
  }
};

// POST /api/user/addresses - Add new address
export const addUserAddress = async (req: Request, res: Response) => {
  try {
    
    // Handle both frontend format (street, zipCode) and legacy format (houseNumber, area, pincode)
    const { 
      addressType, 
      pincode, 
      zipCode,
      houseNumber, 
      area, 
      street,
      landmark, 
      city, 
      state, 
      isDefault 
    } = req.body;
    
    // Try to get authenticated user ID
    const userId = getUserIdFromToken(req);
    
    if (!userId) {
      // User not authenticated - cannot save permanent addresses
      return res.status(401).json({
        success: false,
        error: 'Authentication required to save addresses'
      });
    }
    
    
    // Handle field mapping - support both frontend format and legacy format
    const actualPincode = zipCode || pincode;
    const actualHouseNumber = houseNumber || '';
    const actualArea = area || street || '';
    
    // Validate required fields
    if (!addressType || !actualPincode || !actualArea || !city || !state) {
      return res.status(400).json({
        success: false,
        error: 'Missing required address fields: addressType, pincode/zipCode, area/street, city, state are required',
        received: { addressType, pincode, zipCode, houseNumber, area, street, city, state }
      });
    }
    
    // Combine houseNumber and area into full_address
    const fullAddress = actualHouseNumber ? `${actualHouseNumber}, ${actualArea}` : actualArea;
    
    // If this is set as default, unset other defaults for this user
    if (isDefault) {
      await pool.query(
        'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }
    
    // Check if this is the first address (make it default automatically)
    const existingAddressesResult = await pool.query(
      'SELECT COUNT(*) as count FROM user_addresses WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    const isFirstAddress = existingAddressesResult.rows[0].count === '0';
    const shouldBeDefault = isDefault || isFirstAddress;
    
    // Insert new address into database
    const result = await pool.query(`
      INSERT INTO user_addresses (
        id, user_id, type, title, full_address, landmark, city, state, 
        postal_code, country, is_default, is_active, created_at, updated_at
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 'India', $9, true, NOW(), NOW())
      RETURNING *
    `, [
      userId,
      addressType,
      `${addressType.charAt(0).toUpperCase() + addressType.slice(1)} Address`, // title
      fullAddress,
      landmark || null,
      city,
      state,
      actualPincode,
      shouldBeDefault
    ]);
    
    const savedAddress = result.rows[0];
    
    // Get user details for response
    const userResult = await pool.query(
      'SELECT first_name, last_name, phone FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];
    
    // Format response to match frontend interface
    const responseAddress: UserAddress = {
      id: savedAddress.id,
      addressType: savedAddress.type as 'home' | 'office' | 'other',
      fullName: `${user.first_name} ${user.last_name}`.trim(),
      mobileNumber: user.phone || '',
      pincode: savedAddress.postal_code,
      houseNumber: actualHouseNumber,
      area: actualArea,
      landmark: savedAddress.landmark || '',
      city: savedAddress.city,
      state: savedAddress.state,
      isDefault: savedAddress.is_default,
      createdAt: savedAddress.created_at,
      updatedAt: savedAddress.updated_at
    };
    
    
    res.status(201).json({
      success: true,
      data: responseAddress,
      message: 'Address added successfully'
    });
  } catch (error) {
    console.error('Error adding user address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add address'
    });
  }
};

// PUT /api/user/addresses - Update all addresses (bulk save) - DEPRECATED
export const updateUserAddresses = async (req: Request, res: Response) => {
  try {
    
    // Try to get authenticated user ID
    const userId = getUserIdFromToken(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to update addresses'
      });
    }
    
    // For now, return success but recommend using individual address updates
    
    res.json({
      success: true,
      message: 'Bulk address updates not supported. Use individual address update endpoints.',
      data: []
    });
  } catch (error) {
    console.error('Error updating user addresses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update addresses'
    });
  }
};

// PUT /api/user/addresses/:addressId - Update specific address
export const updateUserAddress = async (req: Request, res: Response) => {
  try {
    
    const { addressId } = req.params;
    const { 
      addressType, 
      houseNumber, 
      area, 
      landmark, 
      city, 
      state, 
      pincode,
      isDefault 
    } = req.body;
    
    // Try to get authenticated user ID
    const userId = getUserIdFromToken(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to update addresses'
      });
    }
    
    
    // Verify address belongs to user
    const existingResult = await pool.query(
      'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2 AND is_active = true',
      [addressId, userId]
    );
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }
    
    // If setting as default, unset other defaults for this user
    if (isDefault) {
      await pool.query(
        'UPDATE user_addresses SET is_default = false WHERE user_id = $1 AND id != $2',
        [userId, addressId]
      );
    }
    
    // Build update fields dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (addressType) {
      updates.push(`type = $${paramCount}`);
      values.push(addressType);
      paramCount++;
    }
    
    if (houseNumber && area) {
      updates.push(`full_address = $${paramCount}`);
      values.push(`${houseNumber}, ${area}`);
      paramCount++;
    }
    
    if (landmark !== undefined) {
      updates.push(`landmark = $${paramCount}`);
      values.push(landmark || null);
      paramCount++;
    }
    
    if (city) {
      updates.push(`city = $${paramCount}`);
      values.push(city);
      paramCount++;
    }
    
    if (state) {
      updates.push(`state = $${paramCount}`);
      values.push(state);
      paramCount++;
    }
    
    if (pincode) {
      updates.push(`postal_code = $${paramCount}`);
      values.push(pincode);
      paramCount++;
    }
    
    if (isDefault !== undefined) {
      updates.push(`is_default = $${paramCount}`);
      values.push(isDefault);
      paramCount++;
    }
    
    // Always update the updated_at field
    updates.push(`updated_at = NOW()`);
    
    if (updates.length === 1) { // Only updated_at, no real changes
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }
    
    // Add WHERE conditions
    values.push(addressId, userId);
    const whereClause = `WHERE id = $${paramCount} AND user_id = $${paramCount + 1}`;
    
    // Update address in database
    const updateResult = await pool.query(`
      UPDATE user_addresses 
      SET ${updates.join(', ')} 
      ${whereClause}
      RETURNING *
    `, values);
    
    const updatedAddress = updateResult.rows[0];
    
    // Get user details for response
    const userResult = await pool.query(
      'SELECT first_name, last_name, phone FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];
    
    // Extract houseNumber and area from full_address for response
    const fullAddressParts = updatedAddress.full_address.split(', ');
    const responseHouseNumber = fullAddressParts[0] || '';
    const responseArea = fullAddressParts.slice(1).join(', ') || updatedAddress.full_address;
    
    // Format response to match frontend interface
    const responseAddress: UserAddress = {
      id: updatedAddress.id,
      addressType: updatedAddress.type as 'home' | 'office' | 'other',
      fullName: `${user.first_name} ${user.last_name}`.trim(),
      mobileNumber: user.phone || '',
      pincode: updatedAddress.postal_code,
      houseNumber: responseHouseNumber,
      area: responseArea,
      landmark: updatedAddress.landmark || '',
      city: updatedAddress.city,
      state: updatedAddress.state,
      isDefault: updatedAddress.is_default,
      createdAt: updatedAddress.created_at,
      updatedAt: updatedAddress.updated_at
    };
    
    
    res.json({
      success: true,
      data: responseAddress,
      message: 'Address updated successfully'
    });
  } catch (error) {
    console.error('Error updating user address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update address'
    });
  }
};

// DELETE /api/user/addresses/:addressId - Delete specific address
export const deleteUserAddress = async (req: Request, res: Response) => {
  try {
    
    const { addressId } = req.params;
    
    // Try to get authenticated user ID
    const userId = getUserIdFromToken(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to delete addresses'
      });
    }
    
    
    // Verify address belongs to user and get its details
    const existingResult = await pool.query(
      'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2 AND is_active = true',
      [addressId, userId]
    );
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }
    
    const addressToDelete = existingResult.rows[0];
    
    // Soft delete the address (set is_active = false)
    await pool.query(
      'UPDATE user_addresses SET is_active = false, updated_at = NOW() WHERE id = $1',
      [addressId]
    );
    
    // If deleted address was default, set another address as default
    if (addressToDelete.is_default) {
      const remainingAddressesResult = await pool.query(
        'SELECT id FROM user_addresses WHERE user_id = $1 AND is_active = true ORDER BY created_at ASC LIMIT 1',
        [userId]
      );
      
      if (remainingAddressesResult.rows.length > 0) {
        const newDefaultId = remainingAddressesResult.rows[0].id;
        await pool.query(
          'UPDATE user_addresses SET is_default = true, updated_at = NOW() WHERE id = $1',
          [newDefaultId]
        );
      }
    }
    
    
    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete address'
    });
  }
};

// GET /api/user/preferences - Get user preferences
export const getUserPreferences = async (req: Request, res: Response) => {
  try {
    
    // Try to get authenticated user ID
    const userId = getUserIdFromToken(req);
    
    if (!userId) {
      // Return default preferences for anonymous users
      return res.json({
        success: true,
        data: {
          emailNotifications: true,
          smsNotifications: true,
          pushNotifications: true,
          marketingEmails: false,
          serviceReminders: true,
          theme: 'light',
          language: 'en'
        }
      });
    }
    
    
    // Query preferences from database
    const result = await pool.query(`
      SELECT 
        email_notifications,
        sms_notifications,
        push_notifications,
        marketing_emails,
        service_reminders,
        theme,
        language,
        created_at,
        updated_at
      FROM user_preferences
      WHERE user_id = $1
    `, [userId]);
    
    let preferences;
    
    if (result.rows.length === 0) {
      // User doesn't have preferences set, create defaults
      const defaultPrefs = {
        email_notifications: true,
        sms_notifications: true,
        push_notifications: true,
        marketing_emails: false,
        service_reminders: true,
        theme: 'light',
        language: 'en'
      };
      
      await pool.query(`
        INSERT INTO user_preferences (
          id, user_id, email_notifications, sms_notifications, push_notifications,
          marketing_emails, service_reminders, theme, language, created_at, updated_at
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `, [
        userId,
        defaultPrefs.email_notifications,
        defaultPrefs.sms_notifications,
        defaultPrefs.push_notifications,
        defaultPrefs.marketing_emails,
        defaultPrefs.service_reminders,
        defaultPrefs.theme,
        defaultPrefs.language
      ]);
      
      preferences = defaultPrefs;
    } else {
      const row = result.rows[0];
      preferences = {
        email_notifications: row.email_notifications,
        sms_notifications: row.sms_notifications,
        push_notifications: row.push_notifications,
        marketing_emails: row.marketing_emails,
        service_reminders: row.service_reminders,
        theme: row.theme,
        language: row.language
      };
    }
    
    // Transform to frontend format (camelCase)
    const responsePreferences = {
      emailNotifications: preferences.email_notifications,
      smsNotifications: preferences.sms_notifications,
      pushNotifications: preferences.push_notifications,
      marketingEmails: preferences.marketing_emails,
      serviceReminders: preferences.service_reminders,
      theme: preferences.theme,
      language: preferences.language
    };
    
    
    res.json({
      success: true,
      data: responsePreferences
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch preferences'
    });
  }
};

// PUT /api/user/preferences - Update user preferences
export const updateUserPreferences = async (req: Request, res: Response) => {
  try {
    
    // Try to get authenticated user ID
    const userId = getUserIdFromToken(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to update preferences'
      });
    }
    
    
    const {
      emailNotifications,
      smsNotifications,
      pushNotifications,
      marketingEmails,
      serviceReminders,
      theme,
      language
    } = req.body;
    
    // Convert camelCase to snake_case for database
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (emailNotifications !== undefined) {
      updates.push(`email_notifications = $${paramCount}`);
      values.push(emailNotifications);
      paramCount++;
    }
    
    if (smsNotifications !== undefined) {
      updates.push(`sms_notifications = $${paramCount}`);
      values.push(smsNotifications);
      paramCount++;
    }
    
    if (pushNotifications !== undefined) {
      updates.push(`push_notifications = $${paramCount}`);
      values.push(pushNotifications);
      paramCount++;
    }
    
    if (marketingEmails !== undefined) {
      updates.push(`marketing_emails = $${paramCount}`);
      values.push(marketingEmails);
      paramCount++;
    }
    
    if (serviceReminders !== undefined) {
      updates.push(`service_reminders = $${paramCount}`);
      values.push(serviceReminders);
      paramCount++;
    }
    
    if (theme !== undefined) {
      updates.push(`theme = $${paramCount}`);
      values.push(theme);
      paramCount++;
    }
    
    if (language !== undefined) {
      updates.push(`language = $${paramCount}`);
      values.push(language);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No preferences to update'
      });
    }
    
    // Always update the updated_at field
    updates.push(`updated_at = NOW()`);
    values.push(userId);
    
    // Check if user preferences exist
    const existingResult = await pool.query(
      'SELECT id FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    
    let result;
    
    if (existingResult.rows.length === 0) {
      // Insert new preferences
      const insertFields = updates.map(u => u.split(' = ')[0]).filter(f => f !== 'updated_at');
      const insertValues = values.slice(0, -1); // Remove userId from values for insert
      
      result = await pool.query(`
        INSERT INTO user_preferences (
          id, user_id, ${insertFields.join(', ')}, created_at, updated_at
        )
        VALUES (gen_random_uuid(), $${paramCount}, ${insertFields.map((_, i) => `$${i + 1}`).join(', ')}, NOW(), NOW())
        RETURNING *
      `, [...insertValues, userId]);
    } else {
      // Update existing preferences
      result = await pool.query(`
        UPDATE user_preferences 
        SET ${updates.join(', ')} 
        WHERE user_id = $${paramCount}
        RETURNING *
      `, values);
    }
    
    const updatedPrefs = result.rows[0];
    
    // Transform to frontend format (camelCase)
    const responsePreferences = {
      emailNotifications: updatedPrefs.email_notifications,
      smsNotifications: updatedPrefs.sms_notifications,
      pushNotifications: updatedPrefs.push_notifications,
      marketingEmails: updatedPrefs.marketing_emails,
      serviceReminders: updatedPrefs.service_reminders,
      theme: updatedPrefs.theme,
      language: updatedPrefs.language
    };
    
    
    res.json({
      success: true,
      data: responsePreferences,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
};