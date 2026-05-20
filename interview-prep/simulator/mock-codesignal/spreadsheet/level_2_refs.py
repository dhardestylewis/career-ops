import unittest

class Spreadsheet:
    def __init__(self): pass
    def set_cell(self, cell: str, val: int | str) -> None: pass
    def get_cell(self, cell: str) -> int | None: return None



# --- CUMULATIVE PAST TESTS ---

class TestPast_0_Sheet1(unittest.TestCase):
    def setUp(self): self.s = Spreadsheet()
    def test_basic(self):
        self.s.set_cell("A1", 5)
        self.assertEqual(self.s.get_cell("A1"), 5)
        self.assertIsNone(self.s.get_cell("B1"))



# --- CURRENT LEVEL TESTS ---

class TestSheet2(unittest.TestCase):
    def setUp(self): self.s = Spreadsheet()
    def test_refs(self):
        self.s.set_cell("A1", 5)
        self.s.set_cell("B1", "=A1")
        self.assertEqual(self.s.get_cell("B1"), 5)
        
        # Updates flow
        self.s.set_cell("A1", 10)
        self.assertEqual(self.s.get_cell("B1"), 10)
if __name__ == "__main__": unittest.main()
