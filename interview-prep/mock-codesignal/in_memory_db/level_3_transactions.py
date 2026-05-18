import unittest

# LEVEL 3: Transactions & CAS (Compare-And-Set)
class InMemoryDB:
    def __init__(self): pass
    def put(self, key: str, value: int) -> None: pass
    def get(self, key: str) -> int | None: return None
    def begin(self) -> None: pass
    def commit(self) -> bool: return False
    def rollback(self) -> bool: return False
    # CAS Twist:
    def put_if_matches(self, key: str, expected_value: int, new_value: int) -> bool: return False

class TestLevel3(unittest.TestCase):
    def setUp(self): self.db = InMemoryDB()
    def test_cas(self):
        self.db.put("a", 1)
        # Should fail because current is 1, not 2
        self.assertFalse(self.db.put_if_matches("a", expected_value=2, new_value=5))
        # Should succeed
        self.assertTrue(self.db.put_if_matches("a", expected_value=1, new_value=5))
        self.assertEqual(self.db.get("a"), 5)
if __name__ == "__main__": unittest.main()
