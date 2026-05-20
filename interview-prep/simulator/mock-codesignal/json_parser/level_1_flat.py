import unittest

class JSONParser:
    def __init__(self): pass
    def parse(self, json_string: str) -> None: pass
    def get_value(self, key: str) -> str | None: return None

class TestJSON1(unittest.TestCase):
    def setUp(self): self.p = JSONParser()
    def test_flat(self):
        # Format: {"key1": "value1", "key2": "value2"}
        self.p.parse('{"name": "Alice", "city": "NY"}')
        self.assertEqual(self.p.get_value("name"), "Alice")
        self.assertEqual(self.p.get_value("city"), "NY")
        self.assertIsNone(self.p.get_value("age"))
if __name__ == "__main__": unittest.main()
