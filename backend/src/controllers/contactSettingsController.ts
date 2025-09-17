import { Request, Response } from 'express';
import pool from '../config/database';

// Get contact settings (only one record should exist)
export const getContactSettings = async (req: Request, res: Response) => {
  try {
    
    const result = await pool.query(`
      SELECT 
        id,
        phone,
        email,
        emergency_phone,
        whatsapp_number,
        company_name,
        tagline,
        address,
        facebook_url,
        twitter_url,
        instagram_url,
        linkedin_url,
        website_url,
        updated_at,
        updated_by
      FROM contact_settings 
      ORDER BY updated_at DESC
      LIMIT 1
    `);
    
    // If no settings exist, return default values (should not happen after migration)
    if (result.rows.length === 0) {
      const defaultSettings = {
        phone: '9437341234',
        email: 'care@happyhomesworld.com',
        emergencyPhone: '9437341234',
        whatsappNumber: '9437341234',
        companyName: 'Happy Homes',
        tagline: 'Your Trusted Home Service Partner',
        address: 'Bhubaneswar, Odisha 751001',
        facebookUrl: 'https://www.facebook.com/happyhomes.official',
        twitterUrl: 'https://x.com/happyhomes_in',
        instagramUrl: '',
        linkedinUrl: '',
        websiteUrl: ''
      };
      
      return res.json({
        success: true,
        data: defaultSettings
      });
    }
    
    // Map snake_case database fields to camelCase for frontend
    const dbData = result.rows[0];
    const mappedData = {
      id: dbData.id,
      phone: dbData.phone,
      email: dbData.email,
      emergencyPhone: dbData.emergency_phone,
      whatsappNumber: dbData.whatsapp_number,
      companyName: dbData.company_name,
      tagline: dbData.tagline,
      address: dbData.address,
      facebookUrl: dbData.facebook_url,
      twitterUrl: dbData.twitter_url,
      instagramUrl: dbData.instagram_url || '',
      linkedinUrl: dbData.linkedin_url || '',
      websiteUrl: dbData.website_url || '',
      updatedAt: dbData.updated_at,
      updatedBy: dbData.updated_by
    };
    
    res.json({
      success: true,
      data: mappedData
    });
  } catch (error) {
    console.error('Error fetching contact settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact settings'
    });
  }
};

// Update contact settings (upsert operation)
export const updateContactSettings = async (req: Request, res: Response) => {
  try {
    // Handle both camelCase (frontend) and snake_case (database) field names
    const { 
      phone,
      email,
      emergency_phone,
      emergencyPhone,  // camelCase from frontend
      whatsapp_number,
      whatsappNumber,  // camelCase from frontend
      company_name,
      companyName,     // camelCase from frontend
      tagline,
      address,
      facebook_url,
      facebookUrl,     // camelCase from frontend
      twitter_url,
      twitterUrl,      // camelCase from frontend
      instagram_url,
      instagramUrl,    // camelCase from frontend
      linkedin_url,
      linkedinUrl,     // camelCase from frontend
      website_url,
      websiteUrl,      // camelCase from frontend
      updated_by = 'admin'
    } = req.body;
    
    // Map to snake_case for database (prefer camelCase if available)
    const mappedFields = {
      phone,
      email,
      emergency_phone: emergencyPhone || emergency_phone,
      whatsapp_number: whatsappNumber || whatsapp_number,
      company_name: companyName || company_name,
      tagline,
      address,
      facebook_url: facebookUrl || facebook_url,
      twitter_url: twitterUrl || twitter_url,
      instagram_url: instagramUrl || instagram_url,
      linkedin_url: linkedinUrl || linkedin_url,
      website_url: websiteUrl || website_url,
      updated_by
    };
    
    // Validate required fields
    if (!mappedFields.phone || !mappedFields.email || !mappedFields.company_name) {
      return res.status(400).json({
        success: false,
        error: 'Phone, email, and company name are required'
      });
    }
    
    // Check if settings already exist
    const existingResult = await pool.query('SELECT id FROM contact_settings LIMIT 1');
    
    let result;
    if (existingResult.rows.length > 0) {
      // Update existing settings
      result = await pool.query(`
        UPDATE contact_settings 
        SET 
          phone = $1,
          email = $2,
          emergency_phone = $3,
          whatsapp_number = $4,
          company_name = $5,
          tagline = $6,
          address = $7,
          facebook_url = $8,
          twitter_url = $9,
          instagram_url = $10,
          linkedin_url = $11,
          website_url = $12,
          updated_at = NOW(),
          updated_by = $13
        WHERE id = $14
        RETURNING *
      `, [
        mappedFields.phone, mappedFields.email, mappedFields.emergency_phone, mappedFields.whatsapp_number,
        mappedFields.company_name, mappedFields.tagline, mappedFields.address,
        mappedFields.facebook_url, mappedFields.twitter_url, mappedFields.instagram_url,
        mappedFields.linkedin_url, mappedFields.website_url, mappedFields.updated_by,
        existingResult.rows[0].id
      ]);
    } else {
      // Insert new settings
      result = await pool.query(`
        INSERT INTO contact_settings (
          phone, email, emergency_phone, whatsapp_number,
          company_name, tagline, address, facebook_url, twitter_url,
          instagram_url, linkedin_url, website_url, updated_at, updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13)
        RETURNING *
      `, [
        mappedFields.phone, mappedFields.email, mappedFields.emergency_phone, mappedFields.whatsapp_number,
        mappedFields.company_name, mappedFields.tagline, mappedFields.address,
        mappedFields.facebook_url, mappedFields.twitter_url, mappedFields.instagram_url,
        mappedFields.linkedin_url, mappedFields.website_url, mappedFields.updated_by
      ]);
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Contact settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating contact settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update contact settings'
    });
  }
};

// Reset contact settings to defaults
export const resetContactSettings = async (req: Request, res: Response) => {
  try {
    
    const { updated_by = 'admin' } = req.body;
    
    const defaultSettings = {
      phone: '9437341234',
      email: 'care@happyhomesworld.com',
      emergency_phone: '9437341234',
      whatsapp_number: '9437341234',
      company_name: 'Happy Homes',
      tagline: 'Your Trusted Home Service Partner',
      address: 'Bhubaneswar, Odisha 751001'
    };
    
    // Check if settings exist
    const existingResult = await pool.query('SELECT id FROM contact_settings LIMIT 1');
    
    let result;
    if (existingResult.rows.length > 0) {
      // Update existing settings with defaults
      result = await pool.query(`
        UPDATE contact_settings 
        SET 
          phone = $1,
          email = $2,
          emergency_phone = $3,
          whatsapp_number = $4,
          company_name = $5,
          tagline = $6,
          address = $7,
          updated_at = NOW(),
          updated_by = $8
        WHERE id = $9
        RETURNING *
      `, [
        defaultSettings.phone, defaultSettings.email, 
        defaultSettings.emergency_phone, defaultSettings.whatsapp_number,
        defaultSettings.company_name, defaultSettings.tagline, 
        defaultSettings.address, updated_by, existingResult.rows[0].id
      ]);
    } else {
      // Insert default settings
      result = await pool.query(`
        INSERT INTO contact_settings (
          phone, email, emergency_phone, whatsapp_number,
          company_name, tagline, address, updated_at, updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
        RETURNING *
      `, [
        defaultSettings.phone, defaultSettings.email, 
        defaultSettings.emergency_phone, defaultSettings.whatsapp_number,
        defaultSettings.company_name, defaultSettings.tagline, 
        defaultSettings.address, updated_by
      ]);
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Contact settings reset to defaults successfully'
    });
  } catch (error) {
    console.error('Error resetting contact settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset contact settings'
    });
  }
};