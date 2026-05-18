import unittest

# LEVEL 4: MVCC (Multi-Version Concurrency Control)
class CloudDB:
    def __init__(self): pass
    def write(self, key: str, value: str, timestamp: int) -> None: pass
    def read(self, key: str, at_timestamp: int) -> str | None: return None

\n\n# --- CUMULATIVE PAST TESTS ---\n\nclass TestPast_0_CDBLevel1(unittest.TestCase):
    def setUp(self): self.db = CloudDB()
    def test_basic(self):
        self.db.write("k1", "v1")
        self.assertEqual(self.db.read("k1"), "v1")\n\nclass TestPast_1_CDBLevel2(unittest.TestCase):
    def setUp(self): self.db = CloudDB(replicas=3)
    def test_replication(self):
        self.db.write("k1", "v1")
        self.assertEqual(self.db.read("k1", replica_id=0), "v1")
        self.assertEqual(self.db.read("k1", replica_id=1), "v1")
        self.assertEqual(self.db.read("k1", replica_id=2), "v1")\n\nclass TestPast_2_CDBLevel3(unittest.TestCase):
    def setUp(self): self.db = CloudDB(shard_count=2)
    def test_sharding(self):
        # Internally hash(key) % shard_count
        self.db.write("a", "1")
        self.db.write("b", "2")
        self.db.write("c", "3")
        
        # Elements should be distributed
        s0 = self.db.get_shard_size(0)
        s1 = self.db.get_shard_size(1)
        self.assertEqual(s0 + s1, 3)\n\n\n\n# --- CURRENT LEVEL TESTS ---\n\nclass TestCDBLevel4(unittest.TestCase):
    def setUp(self): self.db = CloudDB()
    def test_mvcc(self):
        self.db.write("k1", "v1", timestamp=10)
        self.db.write("k1", "v2", timestamp=20)
        
        self.assertEqual(self.db.read("k1", at_timestamp=15), "v1")
        self.assertEqual(self.db.read("k1", at_timestamp=25), "v2")
if __name__ == "__main__": unittest.main()
