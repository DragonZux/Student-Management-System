import sys
import unittest
from pathlib import Path

from jose import jwt

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password


class SecurityTests(unittest.TestCase):
    def test_password_hash_verifies_original_password(self):
        hashed_password = get_password_hash("admin12345")

        self.assertNotEqual(hashed_password, "admin12345")
        self.assertTrue(verify_password("admin12345", hashed_password))
        self.assertFalse(verify_password("wrong-password", hashed_password))

    def test_access_token_contains_subject_and_session_id(self):
        token = create_access_token(subject="user-1", jti="session-1")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

        self.assertEqual(payload["sub"], "user-1")
        self.assertEqual(payload["jti"], "session-1")
        self.assertIn("exp", payload)


if __name__ == "__main__":
    unittest.main()
