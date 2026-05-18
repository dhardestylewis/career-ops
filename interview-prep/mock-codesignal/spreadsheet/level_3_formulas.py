import unittest

class Spreadsheet:
    def __init__(self): pass
    def set_cell(self, cell: str, val: int | str) -> None: pass
    def get_cell(self, cell: str) -> int | None: return None

class TestSheet3(unittest.TestCase):
    def setUp(self): self.s = Spreadsheet()
    def test_formulas(self):
        self.s.set_cell("A1", 5)
        self.s.set_cell("A2", 10)
        self.s.set_cell("B1", "=A1+A2")
        self.assertEqual(self.s.get_cell("B1"), 15)
if __name__ == "__main__": unittest.main()
