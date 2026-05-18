import unittest

# LEVEL 4: MVCC (Multi-Version Concurrency Control)
class CloudDB:
    def __init__(self): pass
    def write(self, key: str, value: str, timestamp: int) -> None: pass
    def read(self, key: str, at_timestamp: int) -> str | None: return None

class TestCDBLevel4(unittest.TestCase):
    def setUp(self): self.db = CloudDB()
    def test_mvcc(self):
        self.db.write("k1", "v1", timestamp=10)
        self.db.write("k1", "v2", timestamp=20)
        
        self.assertEqual(self.db.read("k1", at_timestamp=15), "v1")
        self.assertEqual(self.db.read("k1", at_timestamp=25), "v2")
if __name__ == "__main__": unittest.main()
