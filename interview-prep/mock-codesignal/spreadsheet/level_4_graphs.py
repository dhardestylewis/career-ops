import unittest

class Spreadsheet:
    def __init__(self): pass
    def set_cell(self, cell: str, val: int | str) -> None: pass
    def get_cell(self, cell: str) -> int | None: return None

class TestSheet4(unittest.TestCase):
    def setUp(self): self.s = Spreadsheet()
    def test_deep_graphs(self):
        self.s.set_cell("A1", 5)
        self.s.set_cell("B1", "=A1+5")
        self.s.set_cell("C1", "=B1+10")
        
        self.assertEqual(self.s.get_cell("C1"), 20)
        
        # Modifying A1 cascades to B1, which cascades to C1
        self.s.set_cell("A1", 10)
        self.assertEqual(self.s.get_cell("C1"), 25)
if __name__ == "__main__": unittest.main()
