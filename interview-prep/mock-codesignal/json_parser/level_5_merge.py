import unittest

class JSONParser:
    def __init__(self): pass
    def parse(self, json_string: str) -> None: pass
    def merge(self, other_json_string: str) -> None: pass
    def get_value_by_path(self, path: str) -> str | None: return None



# --- CUMULATIVE PAST TESTS ---

class TestPast_0_JSON1(unittest.TestCase):
    def setUp(self): self.p = JSONParser()
    def test_flat(self):
        # Format: {"key1": "value1", "key2": "value2"}
        self.p.parse('{"name": "Alice", "city": "NY"}')
        self.assertEqual(self.p.get_value("name"), "Alice")
        self.assertEqual(self.p.get_value("city"), "NY")
        self.assertIsNone(self.p.get_value("age"))

class TestPast_1_JSON2(unittest.TestCase):
    def setUp(self): self.p = JSONParser()
    def test_nested(self):
        self.p.parse('{"user": {"name": "Alice", "age": "30"}}')
        # Should return a dictionary representation for nested objects
        val = self.p.get_value("user")
        self.assertTrue(isinstance(val, dict))
        self.assertEqual(val.get("name"), "Alice")

class TestPast_2_JSON3(unittest.TestCase):
    def setUp(self): self.p = JSONParser()
    def test_deep_paths(self):
        self.p.parse('{"user": {"address": {"city": "NY", "zip": "10001"}}}')
        
        self.assertEqual(self.p.get_value_by_path("user.address.city"), "NY")
        self.assertEqual(self.p.get_value_by_path("user.address.zip"), "10001")
        self.assertIsNone(self.p.get_value_by_path("user.profile.age"))

class TestPast_3_JSON4(unittest.TestCase):
    def setUp(self): self.p = JSONParser()
    def test_arrays(self):
        self.p.parse('{"users": [{"name": "Alice"}, {"name": "Bob"}]}')
        
        self.assertEqual(self.p.get_value_by_path("users[0].name"), "Alice")
        self.assertEqual(self.p.get_value_by_path("users[1].name"), "Bob")
        self.assertIsNone(self.p.get_value_by_path("users[2].name"))



# --- CURRENT LEVEL TESTS ---

class TestJSON5(unittest.TestCase):
    def setUp(self): self.p = JSONParser()
    def test_merge(self):
        self.p.parse('{"db": {"host": "localhost", "port": "5432"}}')
        # Merging should overwrite existing keys and add new ones
        self.p.merge('{"db": {"port": "8080", "user": "admin"}}')
        
        self.assertEqual(self.p.get_value_by_path("db.host"), "localhost")
        self.assertEqual(self.p.get_value_by_path("db.port"), "8080")
        self.assertEqual(self.p.get_value_by_path("db.user"), "admin")
if __name__ == "__main__": unittest.main()
