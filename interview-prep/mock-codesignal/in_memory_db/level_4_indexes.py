import unittest

# LEVEL 4: Secondary Indexes & Prefix Scanning
class InMemoryDB:
    def __init__(self): pass
    def put(self, key: str, value: dict) -> None: pass
    def get(self, key: str) -> dict | None: return None
    def find(self, field: str, value: any) -> list[str]: return []
    # Prefix Scan Twist:
    def scan_by_prefix(self, prefix: str) -> list[dict]: return []

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
        self.assertEqual(self.db.get("a"), 2)\n\nclass TestPast_1_Level2(unittest.TestCase):
    def setUp(self): self.db = InMemoryDB()
    def test_ttl_cleanup(self):
        self.db.put("a", 1, ttl=10, now=0)
        self.db.put("b", 2, ttl=5, now=0)
        self.assertEqual(self.db.cleanup(now=6), 1) # b should be cleaned
        self.assertIsNone(self.db.get("b", now=6))\n\nclass TestPast_2_Level3(unittest.TestCase):
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
        self.assertEqual(self.db.get("a", at_time=5), 1)\n\nclass TestPast_3_Level3(unittest.TestCase):
    def setUp(self): self.db = InMemoryDB()
    def test_cas(self):
        self.db.put("a", 1)
        # Should fail because current is 1, not 2
        self.assertFalse(self.db.put_if_matches("a", expected_value=2, new_value=5))
        # Should succeed
        self.assertTrue(self.db.put_if_matches("a", expected_value=1, new_value=5))
        self.assertEqual(self.db.get("a"), 5)\n\n\n\n# --- CURRENT LEVEL TESTS ---\n\nclass TestLevel4(unittest.TestCase):
    def setUp(self): self.db = InMemoryDB()
    def test_scan_prefix(self):
        self.db.put("user_1", {"name": "Alice"})
        self.db.put("user_2", {"name": "Bob"})
        self.db.put("admin_1", {"name": "Charlie"})
        
        res = self.db.scan_by_prefix("user_")
        self.assertEqual(len(res), 2)
        names = [r["name"] for r in res]
        self.assertIn("Alice", names)
        self.assertIn("Bob", names)
if __name__ == "__main__": unittest.main()
