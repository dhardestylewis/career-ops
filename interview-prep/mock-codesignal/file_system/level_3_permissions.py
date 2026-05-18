import unittest

# LEVEL 3: Permissions
class FileSystem:
    def __init__(self): pass
    def mkdir(self, path: str) -> bool: return False
    def create_file(self, path: str) -> bool: return False
    def set_owner(self, path: str, owner: str) -> bool: return False
    def write(self, path: str, content: str, user: str) -> bool: return False

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
