import unittest

# Implement Token Bucket: tokens refill at refill_rate per second.
class RateLimiter:
    def __init__(self, max_capacity: int, refill_rate: int): pass
    def allow_request(self, user_id: str, timestamp: int) -> bool: return False

class TestRL4(unittest.TestCase):
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
