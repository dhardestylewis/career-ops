import unittest

class RateLimiter:
    def __init__(self, limit: int): pass
    def allow_request(self, user_id: str) -> bool: return False

class TestRL1(unittest.TestCase):
    def setUp(self): self.rl = RateLimiter(2)
    def test_basic(self):
        self.assertTrue(self.rl.allow_request("u1"))
        self.assertTrue(self.rl.allow_request("u1"))
        self.assertFalse(self.rl.allow_request("u1")) # Limit reached
        self.assertTrue(self.rl.allow_request("u2"))  # Different user
if __name__ == "__main__": unittest.main()
