import unittest

# LEVEL 4: Secondary Indexes & Prefix Scanning
class InMemoryDB:
    def __init__(self): pass
    def put(self, key: str, value: dict) -> None: pass
    def get(self, key: str) -> dict | None: return None
    def find(self, field: str, value: any) -> list[str]: return []
    # Prefix Scan Twist:
    def scan_by_prefix(self, prefix: str) -> list[dict]: return []

class TestLevel4(unittest.TestCase):
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
