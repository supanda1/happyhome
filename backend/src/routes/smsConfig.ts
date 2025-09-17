import { Router, Request, Response } from 'express';
import { requireAdminAuth } from '../middleware/auth';

const router = Router();

// Get SMS configuration status
router.get('/status', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    // Check environment variables for SMS providers
    const providers = {
      twilio: {
        name: 'Twilio',
        type: 'Global SMS Service',
        configured: Boolean(
          process.env.TWILIO_ACCOUNT_SID && 
          process.env.TWILIO_AUTH_TOKEN && 
          process.env.TWILIO_FROM_NUMBER
        ),
        enabled: process.env.TWILIO_ENABLED === 'true',
        cost_per_sms: '₹1.20',
        coverage: 'Global',
        config_fields: [
          { name: 'TWILIO_ENABLED', value: process.env.TWILIO_ENABLED || 'false', required: false },
          { name: 'TWILIO_ACCOUNT_SID', value: maskValue(process.env.TWILIO_ACCOUNT_SID), required: true },
          { name: 'TWILIO_AUTH_TOKEN', value: maskValue(process.env.TWILIO_AUTH_TOKEN), required: true },
          { name: 'TWILIO_FROM_NUMBER', value: process.env.TWILIO_FROM_NUMBER || '', required: true }
        ]
      },
      textlocal: {
        name: 'TextLocal',
        type: 'Indian SMS Service', 
        configured: Boolean(
          process.env.TEXTLOCAL_API_KEY && 
          process.env.TEXTLOCAL_SENDER
        ),
        enabled: process.env.TEXTLOCAL_ENABLED === 'true',
        cost_per_sms: '₹0.25',
        coverage: 'India',
        config_fields: [
          { name: 'TEXTLOCAL_ENABLED', value: process.env.TEXTLOCAL_ENABLED || 'false', required: false },
          { name: 'TEXTLOCAL_API_KEY', value: maskValue(process.env.TEXTLOCAL_API_KEY), required: true },
          { name: 'TEXTLOCAL_SENDER', value: process.env.TEXTLOCAL_SENDER || '', required: true },
          { name: 'TEXTLOCAL_USE_HASH_AUTH', value: process.env.TEXTLOCAL_USE_HASH_AUTH || 'false', required: false },
          { name: 'TEXTLOCAL_USERNAME', value: process.env.TEXTLOCAL_USERNAME || '', required: false },
          { name: 'TEXTLOCAL_HASH_KEY', value: maskValue(process.env.TEXTLOCAL_HASH_KEY), required: false }
        ]
      },
      teleo: {
        name: 'Teleo',
        type: 'Indian SMS Service',
        configured: Boolean(
          process.env.TELEO_USERNAME && 
          process.env.TELEO_PASSWORD && 
          process.env.TELEO_SENDER_ID
        ),
        enabled: process.env.TELEO_ENABLED === 'true',
        cost_per_sms: '₹0.30',
        coverage: 'India',
        config_fields: [
          { name: 'TELEO_ENABLED', value: process.env.TELEO_ENABLED || 'false', required: false },
          { name: 'TELEO_USERNAME', value: process.env.TELEO_USERNAME || '', required: true },
          { name: 'TELEO_PASSWORD', value: maskValue(process.env.TELEO_PASSWORD), required: true },
          { name: 'TELEO_SENDER_ID', value: process.env.TELEO_SENDER_ID || '', required: true }
        ]
      },
      aws_sns: {
        name: 'AWS SNS',
        type: 'Cloud SMS Service',
        configured: Boolean(
          process.env.AWS_ACCESS_KEY_ID && 
          process.env.AWS_SECRET_ACCESS_KEY && 
          process.env.AWS_REGION
        ),
        enabled: process.env.AWS_SNS_ENABLED === 'true',
        cost_per_sms: '₹0.60',
        coverage: 'Global',
        config_fields: [
          { name: 'AWS_SNS_ENABLED', value: process.env.AWS_SNS_ENABLED || 'false', required: false },
          { name: 'AWS_ACCESS_KEY_ID', value: maskValue(process.env.AWS_ACCESS_KEY_ID), required: true },
          { name: 'AWS_SECRET_ACCESS_KEY', value: maskValue(process.env.AWS_SECRET_ACCESS_KEY), required: true },
          { name: 'AWS_REGION', value: process.env.AWS_REGION || 'ap-south-1', required: true }
        ]
      }
    };

    // Email provider status
    const emailProvider = {
      sendgrid: {
        name: 'SendGrid',
        type: 'Email Service',
        configured: Boolean(
          process.env.SENDGRID_API_KEY && 
          process.env.SENDGRID_FROM_EMAIL
        ),
        enabled: process.env.SENDGRID_ENABLED === 'true',
        config_fields: [
          { name: 'SENDGRID_ENABLED', value: process.env.SENDGRID_ENABLED || 'false', required: false },
          { name: 'SENDGRID_API_KEY', value: maskValue(process.env.SENDGRID_API_KEY), required: true },
          { name: 'SENDGRID_FROM_EMAIL', value: process.env.SENDGRID_FROM_EMAIL || '', required: true },
          { name: 'SENDGRID_FROM_NAME', value: process.env.SENDGRID_FROM_NAME || 'Happy Homes', required: false }
        ]
      }
    };

    // Mock provider status
    const mockProvider = {
      enabled: !hasAnyRealProvider(providers, emailProvider),
      simulate_failures: process.env.MOCK_SIMULATE_FAILURES === 'true',
      failure_rate: process.env.MOCK_FAILURE_RATE || '0.1'
    };

    // Overall status
    const status = {
      mock_mode: mockProvider.enabled,
      sms_providers: providers,
      email_provider: emailProvider,
      mock_settings: mockProvider,
      recommendations: generateRecommendations(providers, emailProvider),
      setup_instructions: getSetupInstructions()
    };

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error getting SMS configuration status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get SMS configuration status'
    });
  }
});

// Get SMS provider setup guide
router.get('/setup-guide', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const guide = {
      steps: [
        {
          step: 1,
          title: 'Choose SMS Provider',
          description: 'Select based on your target audience and budget',
          providers: [
            {
              name: 'TextLocal',
              best_for: 'India (Domestic)',
              cost: '₹0.25/SMS',
              setup_time: '15 minutes',
              signup_url: 'https://www.textlocal.in'
            },
            {
              name: 'Teleo', 
              best_for: 'India (High Volume)',
              cost: '₹0.30/SMS',
              setup_time: '10 minutes',
              signup_url: 'https://www.teleo.in'
            },
            {
              name: 'Twilio',
              best_for: 'Global Coverage',
              cost: '₹1.20/SMS',
              setup_time: '10 minutes', 
              signup_url: 'https://www.twilio.com'
            }
          ]
        },
        {
          step: 2,
          title: 'Get API Credentials',
          description: 'Sign up with your chosen provider and obtain API credentials',
          actions: [
            'Create account on provider website',
            'Verify your phone number and identity', 
            'Get API key/credentials from dashboard',
            'Apply for Sender ID approval (India providers)',
            'Add initial balance to your account'
          ]
        },
        {
          step: 3,
          title: 'Update Environment Variables',
          description: 'Add your provider credentials to the backend .env file',
          file_location: 'backend/.env',
          restart_required: true
        },
        {
          step: 4,
          title: 'Test Configuration',
          description: 'Send test SMS from admin panel to verify setup',
          test_location: 'Admin Panel → SMS Providers → Test SMS'
        }
      ],
      env_template: {
        textlocal: [
          'TEXTLOCAL_ENABLED=true',
          'TEXTLOCAL_API_KEY=your_textlocal_api_key_here',
          'TEXTLOCAL_SENDER=HPYHMS'
        ],
        teleo: [
          'TELEO_ENABLED=true', 
          'TELEO_USERNAME=your_teleo_username',
          'TELEO_PASSWORD=your_teleo_password',
          'TELEO_SENDER_ID=HPYHMS'
        ],
        twilio: [
          'TWILIO_ENABLED=true',
          'TWILIO_ACCOUNT_SID=AC1234567890abcdef',
          'TWILIO_AUTH_TOKEN=your_auth_token_here',
          'TWILIO_FROM_NUMBER=+1234567890'
        ],
        sendgrid: [
          'SENDGRID_ENABLED=true',
          'SENDGRID_API_KEY=SG.your_sendgrid_api_key_here',
          'SENDGRID_FROM_EMAIL=noreply@happyhomes.com',
          'SENDGRID_FROM_NAME=Happy Homes'
        ]
      }
    };

    res.json({
      success: true,
      data: guide
    });

  } catch (error) {
    console.error('Error getting setup guide:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get setup guide'
    });
  }
});

// Helper function to mask sensitive values
function maskValue(value?: string): string {
  if (!value) return '';
  if (value.length <= 8) return '*'.repeat(value.length);
  return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
}

// Check if any real provider is configured
function hasAnyRealProvider(smsProviders: any, emailProvider: any): boolean {
  const smsConfigured = Object.values(smsProviders).some((provider: any) => 
    provider.configured && provider.enabled
  );
  const emailConfigured = emailProvider.sendgrid.configured && emailProvider.sendgrid.enabled;
  
  return smsConfigured || emailConfigured;
}

// Generate recommendations based on current config
function generateRecommendations(smsProviders: any, emailProvider: any): string[] {
  const recommendations: string[] = [];

  // Check SMS providers
  const configuredSms = Object.values(smsProviders).filter((p: any) => p.configured && p.enabled);
  if (configuredSms.length === 0) {
    recommendations.push('🔴 No SMS providers configured. Add TextLocal for India or Twilio for global coverage.');
  } else if (configuredSms.length === 1) {
    recommendations.push('🟡 Only one SMS provider configured. Add a backup provider for reliability.');
  } else {
    recommendations.push('🟢 Multiple SMS providers configured for redundancy.');
  }

  // Check email provider
  if (!emailProvider.sendgrid.configured || !emailProvider.sendgrid.enabled) {
    recommendations.push('🔴 Email provider not configured. Add SendGrid for email notifications.');
  } else {
    recommendations.push('🟢 Email provider configured and ready.');
  }

  // Cost optimization
  const hasTextLocal = smsProviders.textlocal.configured && smsProviders.textlocal.enabled;
  const hasTeleo = smsProviders.teleo.configured && smsProviders.teleo.enabled;
  const onlyTwilio = smsProviders.twilio.configured && smsProviders.twilio.enabled && !hasTextLocal && !hasTeleo;
  
  if (onlyTwilio) {
    recommendations.push('💰 Consider adding TextLocal (₹0.25/SMS) or Teleo (₹0.30/SMS) for 75% cost savings on Indian numbers.');
  } else if (hasTextLocal || hasTeleo) {
    recommendations.push('💰 Cost-optimized setup detected. Indian SMS costs reduced by 75%.');
  }

  return recommendations;
}

// Get setup instructions
function getSetupInstructions(): any {
  return {
    quick_start: [
      {
        title: 'For Indian Customers (Recommended)',
        provider: 'TextLocal',
        steps: [
          'Go to https://www.textlocal.in',
          'Sign up and verify your account',
          'Get API key from dashboard',
          'Apply for sender ID "HPYHMS"',
          'Add ₹100 initial balance',
          'Set TEXTLOCAL_ENABLED=true in .env'
        ],
        time: '15 minutes',
        cost: '₹0.25 per SMS'
      },
      {
        title: 'For Global Customers',
        provider: 'Twilio', 
        steps: [
          'Go to https://www.twilio.com/try-twilio',
          'Sign up with phone verification',
          'Get Account SID and Auth Token',
          'Purchase a phone number',
          'Add $20 initial balance',
          'Set TWILIO_ENABLED=true in .env'
        ],
        time: '10 minutes',
        cost: '₹1.20 per SMS'
      }
    ],
    troubleshooting: [
      {
        issue: 'SMS not sending',
        solutions: [
          'Check API credentials are correct',
          'Verify sender ID is approved',
          'Ensure sufficient account balance',
          'Check phone number format (+91XXXXXXXXXX)',
          'Restart backend server after .env changes'
        ]
      },
      {
        issue: 'High failure rate',
        solutions: [
          'Check DND (Do Not Disturb) compliance',
          'Verify message content follows guidelines',
          'Ensure sender ID is registered',
          'Check provider service status',
          'Review message length (160 chars max)'
        ]
      }
    ]
  };
}

export default router;