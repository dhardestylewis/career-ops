import unittest

class TextEditor:
    def __init__(self): pass
    def append(self, text: str) -> None: pass
    def delete(self, count: int) -> None: pass
    def move_cursor_left(self, count: int) -> None: pass
    def move_cursor_right(self, count: int) -> None: pass
    def get_text(self) -> str: return ""

\n\n# --- CUMULATIVE PAST TESTS ---\n\nclass TestPast_0_Editor1(unittest.TestCase):
    def setUp(self): self.ed = TextEditor()
    def test_basic(self):
        self.ed.append("hello")
        self.assertEqual(self.ed.get_text(), "hello")
        self.ed.append(" world")
        self.assertEqual(self.ed.get_text(), "hello world")
        self.ed.delete(6)
        self.assertEqual(self.ed.get_text(), "hello")
        self.ed.delete(100) # Deleting more than exists should just empty it
        self.assertEqual(self.ed.get_text(), "")\n\n\n\n# --- CURRENT LEVEL TESTS ---\n\nclass TestEditor2(unittest.TestCase):
    def setUp(self): self.ed = TextEditor()
    def test_cursor(self):
        self.ed.append("hello")
        self.ed.move_cursor_left(2) # Cursor before 'lo'
        self.ed.append("XX")
        self.assertEqual(self.ed.get_text(), "helXXlo")
        
        self.ed.move_cursor_right(1)
        self.ed.delete(1) # Deletes the character to the left of cursor
        self.assertEqual(self.ed.get_text(), "helXXo")
if __name__ == "__main__": unittest.main()
