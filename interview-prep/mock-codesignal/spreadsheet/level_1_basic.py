import unittest

class Spreadsheet:
    def __init__(self): pass
    def set_cell(self, cell: str, val: int) -> None: pass
    def get_cell(self, cell: str) -> int | None: return None

class TestSheet1(unittest.TestCase):
    def setUp(self): self.s = Spreadsheet()
    def test_basic(self):
        self.s.set_cell("A1", 5)
        self.assertEqual(self.s.get_cell("A1"), 5)
        self.assertIsNone(self.s.get_cell("B1"))
if __name__ == "__main__": unittest.main()
