import unittest

# LEVEL 3: Sharding
class CloudDB:
    def __init__(self, shard_count: int = 4): pass
    def write(self, key: str, value: str) -> None: pass
    def read(self, key: str) -> str | None: return None
    def get_shard_size(self, shard_id: int) -> int: return 0



# --- CUMULATIVE PAST TESTS ---

class TestPast_0_CDBLevel1(unittest.TestCase):
    def setUp(self): self.db = CloudDB()
    def test_basic(self):
        self.db.write("k1", "v1")
        self.assertEqual(self.db.read("k1"), "v1")

class TestPast_1_CDBLevel2(unittest.TestCase):
    def setUp(self): self.db = CloudDB(replicas=3)
    def test_replication(self):
        self.db.write("k1", "v1")
        self.assertEqual(self.db.read("k1", replica_id=0), "v1")
        self.assertEqual(self.db.read("k1", replica_id=1), "v1")
        self.assertEqual(self.db.read("k1", replica_id=2), "v1")



# --- CURRENT LEVEL TESTS ---

class TestCDBLevel3(unittest.TestCase):
    def setUp(self): self.db = CloudDB(shard_count=2)
    def test_sharding(self):
        # Internally hash(key) % shard_count
        self.db.write("a", "1")
        self.db.write("b", "2")
        self.db.write("c", "3")
        
        # Elements should be distributed
        s0 = self.db.get_shard_size(0)
        s1 = self.db.get_shard_size(1)
        self.assertEqual(s0 + s1, 3)
if __name__ == "__main__": unittest.main()
