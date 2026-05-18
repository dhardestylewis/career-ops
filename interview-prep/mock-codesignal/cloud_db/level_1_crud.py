import unittest

class CloudDB:
    def __init__(self): pass
    def write(self, key: str, value: str) -> None: pass
    def read(self, key: str) -> str | None: return None

class TestCDBLevel1(unittest.TestCase):
    def setUp(self): self.db = CloudDB()
    def test_basic(self):
        self.db.write("k1", "v1")
        self.assertEqual(self.db.read("k1"), "v1")
if __name__ == "__main__": unittest.main()
