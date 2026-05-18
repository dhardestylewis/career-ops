import unittest

# LEVEL 4: Transactions
class InMemoryDB:
    def __init__(self): pass
    def put(self, key: str, value: int) -> None: pass
    def get(self, key: str) -> int | None: return None
    def delete(self, key: str) -> bool: return False
    def begin(self) -> None: pass
    def commit(self) -> bool: return False
    def rollback(self) -> bool: return False

class TestLevel4(unittest.TestCase):
    def setUp(self): self.db = InMemoryDB()
    def test_commit(self):
        self.db.put("a", 1)
        self.db.begin()
        self.db.put("a", 2)
        self.assertEqual(self.db.get("a"), 2)
        self.db.commit()
        self.assertEqual(self.db.get("a"), 2)
    def test_rollback(self):
        self.db.put("a", 1)
        self.db.begin()
        self.db.put("a", 2)
        self.db.rollback()
        self.assertEqual(self.db.get("a"), 1)
    def test_nested_transactions(self):
        self.db.begin()
        self.db.put("a", 1)
        self.db.begin()
        self.db.put("a", 2)
        self.db.rollback() # Rolls back inner
        self.assertEqual(self.db.get("a"), 1)
        self.db.commit()
if __name__ == "__main__": unittest.main()
