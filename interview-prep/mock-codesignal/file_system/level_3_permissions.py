import unittest

# LEVEL 3: Permissions
class FileSystem:
    def __init__(self): pass
    def mkdir(self, path: str) -> bool: return False
    def create_file(self, path: str) -> bool: return False
    def set_owner(self, path: str, owner: str) -> bool: return False
    def write(self, path: str, content: str, user: str) -> bool: return False



# --- CUMULATIVE PAST TESTS ---

class TestPast_0_FSLevel1(unittest.TestCase):
    def setUp(self): self.fs = FileSystem()
    def test_basic(self):
        self.assertTrue(self.fs.mkdir("/a"))
        self.assertTrue(self.fs.create_file("/a/b.txt"))
        self.assertEqual(self.fs.ls("/a"), ["b.txt"])

class TestPast_1_FSLevel2(unittest.TestCase):
    def setUp(self): self.fs = FileSystem()
    def test_write_read(self):
        self.fs.mkdir("/a")
        self.fs.create_file("/a/b.txt")
        self.assertTrue(self.fs.write("/a/b.txt", "hello"))
        self.assertEqual(self.fs.read("/a/b.txt"), "hello")
        
        # Appending
        self.fs.write("/a/b.txt", " world")
        self.assertEqual(self.fs.read("/a/b.txt"), "hello world")



# --- CURRENT LEVEL TESTS ---

class TestFSLevel3(unittest.TestCase):
    def setUp(self): self.fs = FileSystem()
    def test_permissions(self):
        self.fs.mkdir("/a")
        self.fs.create_file("/a/b.txt")
        self.fs.set_owner("/a/b.txt", "admin")
        
        # Only owner can write
        self.assertFalse(self.fs.write("/a/b.txt", "hello", user="guest"))
        self.assertTrue(self.fs.write("/a/b.txt", "hello", user="admin"))
if __name__ == "__main__": unittest.main()
