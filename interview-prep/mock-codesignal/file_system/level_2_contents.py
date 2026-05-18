import unittest

# LEVEL 2: File Contents
class FileSystem:
    def __init__(self): pass
    def mkdir(self, path: str) -> bool: return False
    def create_file(self, path: str) -> bool: return False
    def write(self, path: str, content: str) -> bool: return False
    def read(self, path: str) -> str | None: return None

class TestFSLevel2(unittest.TestCase):
    def setUp(self): self.fs = FileSystem()
    def test_write_read(self):
        self.fs.mkdir("/a")
        self.fs.create_file("/a/b.txt")
        self.assertTrue(self.fs.write("/a/b.txt", "hello"))
        self.assertEqual(self.fs.read("/a/b.txt"), "hello")
        
        # Appending
        self.fs.write("/a/b.txt", " world")
        self.assertEqual(self.fs.read("/a/b.txt"), "hello world")
if __name__ == "__main__": unittest.main()
