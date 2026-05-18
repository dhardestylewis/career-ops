import unittest

# Implement Token Bucket: tokens refill at refill_rate per second.
class RateLimiter:
    def __init__(self, max_capacity: int, refill_rate: int): pass
    def allow_request(self, user_id: str, timestamp: int) -> bool: return False

\n\n# --- CUMULATIVE PAST TESTS ---\n\nclass TestPast_0_RL1(unittest.TestCase):
    def setUp(self): self.rl = RateLimiter(2)
    def test_basic(self):
        self.assertTrue(self.rl.allow_request("u1"))
        self.assertTrue(self.rl.allow_request("u1"))
        self.assertFalse(self.rl.allow_request("u1")) # Limit reached
        self.assertTrue(self.rl.allow_request("u2"))  # Different user\n\nclass TestPast_1_RL2(unittest.TestCase):
    def setUp(self): self.rl = RateLimiter(limit=2, window_sec=10)
    def test_window(self):
        self.assertTrue(self.rl.allow_request("u1", timestamp=0))
        self.assertTrue(self.rl.allow_request("u1", timestamp=5))
        self.assertFalse(self.rl.allow_request("u1", timestamp=9)) # Blocked
        
        # At t=11, the first request (t=0) falls out of the 10s window
        self.assertTrue(self.rl.allow_request("u1", timestamp=11))\n\nclass TestPast_2_RL3(unittest.TestCase):
    def setUp(self): self.rl = RateLimiter(default_limit=1, window_sec=10)
    def test_tiers(self):
        self.rl.set_user_tier("premium_user", 5)
        
        self.assertTrue(self.rl.allow_request("normal_user", 0))
        self.assertFalse(self.rl.allow_request("normal_user", 1)) # Blocked
        
        self.assertTrue(self.rl.allow_request("premium_user", 0))
        self.assertTrue(self.rl.allow_request("premium_user", 1)) # Allowed\n\n\n\n# --- CURRENT LEVEL TESTS ---\n\nclass TestRL4(unittest.TestCase):
    def setUp(self): self.rl = RateLimiter(max_capacity=5, refill_rate=1)
    def test_token_bucket(self):
        # Empty the bucket at t=0
        for _ in range(5):
            self.assertTrue(self.rl.allow_request("u1", timestamp=0))
        self.assertFalse(self.rl.allow_request("u1", timestamp=0))
        
        # 3 seconds later, 3 tokens refilled
        self.assertTrue(self.rl.allow_request("u1", timestamp=3))
        self.assertTrue(self.rl.allow_request("u1", timestamp=3))
        self.assertTrue(self.rl.allow_request("u1", timestamp=3))
        self.assertFalse(self.rl.allow_request("u1", timestamp=3))
if __name__ == "__main__": unittest.main()
