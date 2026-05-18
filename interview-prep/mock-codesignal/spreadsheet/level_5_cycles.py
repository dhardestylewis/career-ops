import unittest

class Spreadsheet:
    def __init__(self): pass
    def set_cell(self, cell: str, val: int | str) -> bool: return False
    def get_cell(self, cell: str) -> int | str | None: return None

\n\n# --- CUMULATIVE PAST TESTS ---\n\nclass TestPast_0_Sheet1(unittest.TestCase):
    def setUp(self): self.s = Spreadsheet()
    def test_basic(self):
        self.s.set_cell("A1", 5)
        self.assertEqual(self.s.get_cell("A1"), 5)
        self.assertIsNone(self.s.get_cell("B1"))\n\nclass TestPast_1_Sheet2(unittest.TestCase):
    def setUp(self): self.s = Spreadsheet()
    def test_refs(self):
        self.s.set_cell("A1", 5)
        self.s.set_cell("B1", "=A1")
        self.assertEqual(self.s.get_cell("B1"), 5)
        
        # Updates flow
        self.s.set_cell("A1", 10)
        self.assertEqual(self.s.get_cell("B1"), 10)\n\nclass TestPast_2_Sheet3(unittest.TestCase):
    def setUp(self): self.s = Spreadsheet()
    def test_formulas(self):
        self.s.set_cell("A1", 5)
        self.s.set_cell("A2", 10)
        self.s.set_cell("B1", "=A1+A2")
        self.assertEqual(self.s.get_cell("B1"), 15)\n\nclass TestPast_3_Sheet4(unittest.TestCase):
    def setUp(self): self.s = Spreadsheet()
    def test_deep_graphs(self):
        self.s.set_cell("A1", 5)
        self.s.set_cell("B1", "=A1+5")
        self.s.set_cell("C1", "=B1+10")
        
        self.assertEqual(self.s.get_cell("C1"), 20)
        
        # Modifying A1 cascades to B1, which cascades to C1
        self.s.set_cell("A1", 10)
        self.assertEqual(self.s.get_cell("C1"), 25)\n\n\n\n# --- CURRENT LEVEL TESTS ---\n\nclass TestSheet5(unittest.TestCase):
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
