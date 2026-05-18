import unittest

# LEVEL 5: Journaling
class FileSystem:
    def __init__(self): pass
    def mkdir(self, path: str) -> bool: return False
    def create_file(self, path: str) -> bool: return False
    def rollback_to(self, action_index: int) -> bool: return False
    def get_journal(self) -> list[str]: return []

class TestFSLevel5(unittest.TestCase):
    def setUp(self): self.fs = FileSystem()
    def test_journaling(self):
        self.fs.mkdir("/a")
        self.fs.create_file("/a/b.txt")
        self.assertEqual(len(self.fs.get_journal()), 2)
        
        self.fs.rollback_to(1)
        # Should undo the file creation
        self.assertEqual(len(self.fs.get_journal()), 1)
if __name__ == "__main__": unittest.main()
