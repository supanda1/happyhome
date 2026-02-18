import express from 'express';

const router = express.Router();

// GET /config/time-slots - Get available time slots for booking
router.get('/time-slots', async (req, res) => {
  try {
    // Return predefined time slots (can be made configurable later)
    const timeSlots = [
      {
        id: 1,
        start_time: '09:00',
        end_time: '10:00',
        display: '9:00 AM - 10:00 AM'
      },
      {
        id: 2,
        start_time: '10:00',
        end_time: '11:00',
        display: '10:00 AM - 11:00 AM'
      },
      {
        id: 3,
        start_time: '11:00',
        end_time: '12:00',
        display: '11:00 AM - 12:00 PM'
      },
      {
        id: 4,
        start_time: '14:00',
        end_time: '15:00',
        display: '2:00 PM - 3:00 PM'
      },
      {
        id: 5,
        start_time: '15:00',
        end_time: '16:00',
        display: '3:00 PM - 4:00 PM'
      },
      {
        id: 6,
        start_time: '16:00',
        end_time: '17:00',
        display: '4:00 PM - 5:00 PM'
      },
      {
        id: 7,
        start_time: '17:00',
        end_time: '18:00',
        display: '5:00 PM - 6:00 PM'
      }
    ];

    res.json({
      success: true,
      data: timeSlots,
      message: 'Time slots retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch time slots',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;