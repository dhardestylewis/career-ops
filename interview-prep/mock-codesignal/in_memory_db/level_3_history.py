import unittest

# LEVEL 3: History
class InMemoryDB:
    def __init__(self): pass
    def put(self, key: str, value: int, ttl: int = None, now: int = 0) -> None: pass
    def get(self, key: str, at_time: int = None, now: int = 0) -> int | None: return None
    def delete(self, key: str) -> bool: return False



# --- CUMULATIVE PAST TESTS ---

class TestPast_0_Level1(unittest.TestCase):
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
        self.assertEqual(self.db.get("a"), 2)

class TestPast_1_Level2(unittest.TestCase):
    def setUp(self): self.db = InMemoryDB()
    def test_ttl_cleanup(self):
        self.db.put("a", 1, ttl=10, now=0)
        self.db.put("b", 2, ttl=5, now=0)
        self.assertEqual(self.db.cleanup(now=6), 1) # b should be cleaned
        self.assertIsNone(self.db.get("b", now=6))



# --- CURRENT LEVEL TESTS ---

class TestLevel3(unittest.TestCase):
    def setUp(self): self.db = InMemoryDB()
    def test_history(self):
        self.db.put("a", 1, now=10)
        self.db.put("a", 2, now=20)
        self.assertEqual(self.db.get("a", at_time=15), 1)
        self.assertEqual(self.db.get("a", at_time=25), 2)
    def test_history_before_creation(self):
        self.db.put("a", 1, now=10)
        self.assertIsNone(self.db.get("a", at_time=5))
    def test_history_with_ttl(self):
        self.db.put("a", 1, ttl=10, now=0)
        self.assertIsNone(self.db.get("a", at_time=15))
        self.assertEqual(self.db.get("a", at_time=5), 1)
if __name__ == "__main__": unittest.main()
