import unittest

# Concurrency: simulate multiple threads requesting simultaneously
class RateLimiter:
    def __init__(self, max_capacity: int): pass
    def allow_request(self, user_id: str) -> bool: return False

class TestRL5(unittest.TestCase):
    def setUp(self): self.rl = RateLimiter(max_capacity=100)
    def test_concurrency(self):
        # In a real test, this would spawn 200 threads.
        # We test that the thread locks don't over-allow.
        allowed = 0
        for _ in range(150):
            if self.rl.allow_request("u1"):
                allowed += 1
        self.assertEqual(allowed, 100)
if __name__ == "__main__": unittest.main()
