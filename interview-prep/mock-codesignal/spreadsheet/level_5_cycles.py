import unittest

class Spreadsheet:
    def __init__(self): pass
    def set_cell(self, cell: str, val: int | str) -> bool: return False
    def get_cell(self, cell: str) -> int | str | None: return None

class TestSheet5(unittest.TestCase):
    def setUp(self): self.s = Spreadsheet()
    def test_cycle_detection(self):
        self.assertTrue(self.s.set_cell("A1", "=B1"))
        self.assertTrue(self.s.set_cell("B1", "=C1"))
        
        # Setting C1 to A1 creates a cycle: C1 -> A1 -> B1 -> C1
        # Should return False and NOT apply the update
        self.assertFalse(self.s.set_cell("C1", "=A1"))
        
        # Valid update still works
        self.assertTrue(self.s.set_cell("C1", 10))
        self.assertEqual(self.s.get_cell("A1"), 10)
if __name__ == "__main__": unittest.main()
