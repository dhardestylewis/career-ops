import unittest

class JSONParser:
    def __init__(self): pass
    def parse(self, json_string: str) -> None: pass
    def get_value_by_path(self, path: str) -> str | None: return None

class TestJSON3(unittest.TestCase):
    def setUp(self): self.p = JSONParser()
    def test_deep_paths(self):
        self.p.parse('{"user": {"address": {"city": "NY", "zip": "10001"}}}')
        
        self.assertEqual(self.p.get_value_by_path("user.address.city"), "NY")
        self.assertEqual(self.p.get_value_by_path("user.address.zip"), "10001")
        self.assertIsNone(self.p.get_value_by_path("user.profile.age"))
if __name__ == "__main__": unittest.main()
