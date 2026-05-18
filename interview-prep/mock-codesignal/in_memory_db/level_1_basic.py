import unittest

# LEVEL 1: Basic KV Store
class InMemoryDB:
    def __init__(self):
        pass

    def put(self, key: str, value: int) -> None:
        pass

    def get(self, key: str) -> int | None:
        return None

    def delete(self, key: str) -> bool:
        return False

class TestLevel1(unittest.TestCase):
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
if __name__ == "__main__": unittest.main()
