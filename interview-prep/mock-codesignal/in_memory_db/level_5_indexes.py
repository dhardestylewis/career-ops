import unittest

# LEVEL 5: Secondary Indexes / Queries
class InMemoryDB:
    def __init__(self): pass
    def put(self, key: str, value: dict) -> None: pass
    def get(self, key: str) -> dict | None: return None
    def find(self, field: str, value: any) -> list[str]: return []

class TestLevel5(unittest.TestCase):
    def setUp(self): self.db = InMemoryDB()
    def test_find(self):
        self.db.put("u1", {"age": 30, "city": "NY"})
        self.db.put("u2", {"age": 30, "city": "LA"})
        self.db.put("u3", {"age": 40, "city": "NY"})
        
        res = self.db.find("age", 30)
        self.assertEqual(set(res), {"u1", "u2"})
        
        res_ny = self.db.find("city", "NY")
        self.assertEqual(set(res_ny), {"u1", "u3"})
    
    def test_find_after_update(self):
        self.db.put("u1", {"age": 30})
        self.db.put("u1", {"age": 40})
        self.assertEqual(self.db.find("age", 30), [])
        self.assertEqual(self.db.find("age", 40), ["u1"])
if __name__ == "__main__": unittest.main()
