import unittest

class JSONParser:
    def __init__(self): pass
    def parse(self, json_string: str) -> None: pass
    def get_value(self, key: str) -> str | dict | None: return None

class TestJSON2(unittest.TestCase):
    def setUp(self): self.p = JSONParser()
    def test_nested(self):
        self.p.parse('{"user": {"name": "Alice", "age": "30"}}')
        # Should return a dictionary representation for nested objects
        val = self.p.get_value("user")
        self.assertTrue(isinstance(val, dict))
        self.assertEqual(val.get("name"), "Alice")
if __name__ == "__main__": unittest.main()
