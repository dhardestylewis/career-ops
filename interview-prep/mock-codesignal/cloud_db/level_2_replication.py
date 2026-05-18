import unittest

# LEVEL 2: Replication
class CloudDB:
    def __init__(self, replicas: int = 2): pass
    def write(self, key: str, value: str) -> None: pass
    def read(self, key: str, replica_id: int = 0) -> str | None: return None

class TestCDBLevel2(unittest.TestCase):
    def setUp(self): self.db = CloudDB(replicas=3)
    def test_replication(self):
        self.db.write("k1", "v1")
        self.assertEqual(self.db.read("k1", replica_id=0), "v1")
        self.assertEqual(self.db.read("k1", replica_id=1), "v1")
        self.assertEqual(self.db.read("k1", replica_id=2), "v1")
if __name__ == "__main__": unittest.main()
