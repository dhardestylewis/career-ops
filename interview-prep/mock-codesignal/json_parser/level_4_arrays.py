import unittest

class JSONParser:
    def __init__(self): pass
    def parse(self, json_string: str) -> None: pass
    def get_value_by_path(self, path: str) -> str | None: return None

class TestJSON4(unittest.TestCase):
    def setUp(self): self.p = JSONParser()
    def test_arrays(self):
        self.p.parse('{"users": [{"name": "Alice"}, {"name": "Bob"}]}')
        
        self.assertEqual(self.p.get_value_by_path("users[0].name"), "Alice")
        self.assertEqual(self.p.get_value_by_path("users[1].name"), "Bob")
        self.assertIsNone(self.p.get_value_by_path("users[2].name"))
if __name__ == "__main__": unittest.main()
