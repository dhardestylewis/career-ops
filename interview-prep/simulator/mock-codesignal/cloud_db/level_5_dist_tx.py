import unittest

# LEVEL 5: Distributed Transactions (2PC)
class CloudDB:
    def __init__(self): pass
    def begin_transaction(self) -> int: return 0
    def write_tx(self, tx_id: int, key: str, value: str) -> None: pass
    def commit_transaction(self, tx_id: int) -> bool: return False
    def read(self, key: str) -> str | None: return None



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

class TestPast_2_CDBLevel3(unittest.TestCase):
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

class TestPast_3_CDBLevel4(unittest.TestCase):
    def setUp(self): self.db = CloudDB()
    def test_mvcc(self):
        self.db.write("k1", "v1", timestamp=10)
        self.db.write("k1", "v2", timestamp=20)
        
        self.assertEqual(self.db.read("k1", at_timestamp=15), "v1")
        self.assertEqual(self.db.read("k1", at_timestamp=25), "v2")



# --- CURRENT LEVEL TESTS ---

class TestCDBLevel5(unittest.TestCase):
    def setUp(self): self.db = CloudDB()
    def test_dist_tx(self):
        tx1 = self.db.begin_transaction()
        self.db.write_tx(tx1, "k1", "v1")
        self.db.write_tx(tx1, "k2", "v2")
        
        # Not visible yet
        self.assertIsNone(self.db.read("k1"))
        
        self.db.commit_transaction(tx1)
        self.assertEqual(self.db.read("k1"), "v1")
if __name__ == "__main__": unittest.main()
