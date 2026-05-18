import unittest

# LEVEL 4: Symlinks & Cycle Detection
class FileSystem:
    def __init__(self): pass
    def mkdir(self, path: str) -> bool: return False
    def create_file(self, path: str) -> bool: return False
    def write(self, path: str, content: str) -> bool: return False
    def read(self, path: str) -> str | None: return None
    def create_symlink(self, target_path: str, link_path: str) -> bool: return False

class TestFSLevel4(unittest.TestCase):
    def setUp(self): self.fs = FileSystem()
    def test_symlink_cycle(self):
        self.fs.mkdir("/a")
        
        # link1 points to link2, link2 points to link1
        self.assertTrue(self.fs.create_symlink("/a/link2", "/a/link1"))
        self.assertTrue(self.fs.create_symlink("/a/link1", "/a/link2"))
        
        # Reading a cycle should detect it and return None/Error, not crash
        self.assertIsNone(self.fs.read("/a/link1"))
if __name__ == "__main__": unittest.main()
