import unittest

# LEVEL 5: Journaling
class FileSystem:
    def __init__(self): pass
    def mkdir(self, path: str) -> bool: return False
    def create_file(self, path: str) -> bool: return False
    def rollback_to(self, action_index: int) -> bool: return False
    def get_journal(self) -> list[str]: return []

\n\n# --- CUMULATIVE PAST TESTS ---\n\nclass TestPast_0_FSLevel1(unittest.TestCase):
    def setUp(self): self.fs = FileSystem()
    def test_basic(self):
        self.assertTrue(self.fs.mkdir("/a"))
        self.assertTrue(self.fs.create_file("/a/b.txt"))
        self.assertEqual(self.fs.ls("/a"), ["b.txt"])\n\nclass TestPast_1_FSLevel2(unittest.TestCase):
    def setUp(self): self.fs = FileSystem()
    def test_write_read(self):
        self.fs.mkdir("/a")
        self.fs.create_file("/a/b.txt")
        self.assertTrue(self.fs.write("/a/b.txt", "hello"))
        self.assertEqual(self.fs.read("/a/b.txt"), "hello")
        
        # Appending
        self.fs.write("/a/b.txt", " world")
        self.assertEqual(self.fs.read("/a/b.txt"), "hello world")\n\nclass TestPast_2_FSLevel3(unittest.TestCase):
    def setUp(self): self.fs = FileSystem()
    def test_permissions(self):
        self.fs.mkdir("/a")
        self.fs.create_file("/a/b.txt")
        self.fs.set_owner("/a/b.txt", "admin")
        
        # Only owner can write
        self.assertFalse(self.fs.write("/a/b.txt", "hello", user="guest"))
        self.assertTrue(self.fs.write("/a/b.txt", "hello", user="admin"))\n\nclass TestPast_3_FSLevel4(unittest.TestCase):
    def setUp(self): self.fs = FileSystem()
    def test_symlink_cycle(self):
        self.fs.mkdir("/a")
        
        # link1 points to link2, link2 points to link1
        self.assertTrue(self.fs.create_symlink("/a/link2", "/a/link1"))
        self.assertTrue(self.fs.create_symlink("/a/link1", "/a/link2"))
        
        # Reading a cycle should detect it and return None/Error, not crash
        self.assertIsNone(self.fs.read("/a/link1"))\n\n\n\n# --- CURRENT LEVEL TESTS ---\n\nclass TestFSLevel5(unittest.TestCase):
    def setUp(self): self.fs = FileSystem()
    def test_journaling(self):
        self.fs.mkdir("/a")
        self.fs.create_file("/a/b.txt")
        self.assertEqual(len(self.fs.get_journal()), 2)
        
        self.fs.rollback_to(1)
        # Should undo the file creation
        self.assertEqual(len(self.fs.get_journal()), 1)
if __name__ == "__main__": unittest.main()
