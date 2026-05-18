import unittest

class RateLimiter:
    def __init__(self, default_limit: int, window_sec: int): pass
    def set_user_tier(self, user_id: str, limit: int) -> None: pass
    def allow_request(self, user_id: str, timestamp: int) -> bool: return False

class TestRL3(unittest.TestCase):
    def setUp(self): self.rl = RateLimiter(default_limit=1, window_sec=10)
    def test_tiers(self):
        self.rl.set_user_tier("premium_user", 5)
        
        self.assertTrue(self.rl.allow_request("normal_user", 0))
        self.assertFalse(self.rl.allow_request("normal_user", 1)) # Blocked
        
        self.assertTrue(self.rl.allow_request("premium_user", 0))
        self.assertTrue(self.rl.allow_request("premium_user", 1)) # Allowed
if __name__ == "__main__": unittest.main()
