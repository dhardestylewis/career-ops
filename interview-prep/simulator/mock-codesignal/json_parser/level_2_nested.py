import unittest

class JSONParser:
    def __init__(self): pass
    def parse(self, json_string: str) -> None: pass
    def get_value(self, key: str) -> str | dict | None: return None



# --- CUMULATIVE PAST TESTS ---

class TestPast_0_JSON1(unittest.TestCase):
    def setUp(self): self.p = JSONParser()
    def test_flat(self):
        # Format: {"key1": "value1", "key2": "value2"}
        self.p.parse('{"name": "Alice", "city": "NY"}')
        self.assertEqual(self.p.get_value("name"), "Alice")
        self.assertEqual(self.p.get_value("city"), "NY")
        self.assertIsNone(self.p.get_value("age"))



# --- CURRENT LEVEL TESTS ---

class TestJSON2(unittest.TestCase):
    def setUp(self): self.p = JSONParser()
    def test_nested(self):
        self.p.parse('{"user": {"name": "Alice", "age": "30"}}')
        # Should return a dictionary representation for nested objects
        val = self.p.get_value("user")
        self.assertTrue(isinstance(val, dict))
        self.assertEqual(val.get("name"), "Alice")
if __name__ == "__main__": unittest.main()
