import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.schedule import schedules_conflict


class ScheduleTests(unittest.TestCase):
    def test_detects_overlapping_slots_on_same_day(self):
        left = [{"day": "Mon", "start": "08:00", "end": "10:00"}]
        right = [{"day": "Mon", "start": "09:30", "end": "11:00"}]

        self.assertTrue(schedules_conflict(left, right))

    def test_allows_same_time_on_different_days(self):
        left = [{"day": "Mon", "start": "08:00", "end": "10:00"}]
        right = [{"day": "Tue", "start": "08:00", "end": "10:00"}]

        self.assertFalse(schedules_conflict(left, right))


if __name__ == "__main__":
    unittest.main()
