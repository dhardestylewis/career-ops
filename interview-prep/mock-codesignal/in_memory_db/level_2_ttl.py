import unittest

# LEVEL 2: TTL Expiration
# Note: You should maintain a min-heap to proactively clean up expired keys efficiently.
class InMemoryDB:
    def __init__(self): pass
    def put(self, key: str, value: int, ttl: int = None, now: int = 0) -> None: pass
    def get(self, key: str, now: int = 0) -> int | None: return None
    def delete(self, key: str) -> bool: return False
    def cleanup(self, now: int) -> int: return 0 # Returns number of keys cleaned up via heap

class TestLevel2(unittest.TestCase):
    def setUp(self): self.db = InMemoryDB()
    def test_ttl_cleanup(self):
        self.db.put("a", 1, ttl=10, now=0)
        self.db.put("b", 2, ttl=5, now=0)
        self.assertEqual(self.db.cleanup(now=6), 1) # b should be cleaned
        self.assertIsNone(self.db.get("b", now=6))
if __name__ == "__main__": unittest.main()
