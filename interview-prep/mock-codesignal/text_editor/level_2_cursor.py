import unittest

class TextEditor:
    def __init__(self): pass
    def append(self, text: str) -> None: pass
    def delete(self, count: int) -> None: pass
    def move_cursor_left(self, count: int) -> None: pass
    def move_cursor_right(self, count: int) -> None: pass
    def get_text(self) -> str: return ""

class TestEditor2(unittest.TestCase):
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
