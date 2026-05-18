import unittest

# LEVEL 2: TTL Expiration
# Note: You should maintain a min-heap to proactively clean up expired keys efficiently.
class InMemoryDB:
    def __init__(self): pass
    def put(self, key: str, value: int, ttl: int = None, now: int = 0) -> None: pass
    def get(self, key: str, now: int = 0) -> int | None: return None
    def delete(self, key: str) -> bool: return False
    def cleanup(self, now: int) -> int: return 0 # Returns number of keys cleaned up via heap

\n\n# --- CUMULATIVE PAST TESTS ---\n\nclass TestPast_0_Level1(unittest.TestCase):
    def setUp(self): self.db = InMemoryDB()
    def test_basic(self):
        self.db.put("a", 1)
        self.assertEqual(self.db.get("a"), 1)
        self.assertTrue(self.db.delete("a"))
        self.assertIsNone(self.db.get("a"))
    def test_missing(self):
        self.assertIsNone(self.db.get("missing"))
        self.assertFalse(self.db.delete("missing"))
    def test_overwrite(self):
        self.db.put("a", 1)
        self.db.put("a", 2)
        self.assertEqual(self.db.get("a"), 2)\n\n\n\n# --- CURRENT LEVEL TESTS ---\n\nclass TestLevel2(unittest.TestCase):
    def setUp(self): self.db = InMemoryDB()
    def test_ttl_cleanup(self):
        self.db.put("a", 1, ttl=10, now=0)
        self.db.put("b", 2, ttl=5, now=0)
        self.assertEqual(self.db.cleanup(now=6), 1) # b should be cleaned
        self.assertIsNone(self.db.get("b", now=6))
if __name__ == "__main__": unittest.main()
