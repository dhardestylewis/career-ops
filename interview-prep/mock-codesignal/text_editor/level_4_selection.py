import unittest

class TextEditor:
    def __init__(self): pass
    def append(self, text: str) -> None: pass
    def move_cursor_left(self, count: int) -> None: pass
    def select(self, left: int, right: int) -> None: pass
    def copy(self) -> None: pass
    def paste(self) -> None: pass
    def get_text(self) -> str: return ""

class TestEditor4(unittest.TestCase):
    def setUp(self): self.ed = TextEditor()
    def test_copy_paste(self):
        self.ed.append("hello world")
        # Select "hello" (indices 0 to 5)
        self.ed.select(0, 5)
        self.ed.copy()
        
        # Cursor moves to end
        self.ed.append(" ")
        self.ed.paste()
        
        self.assertEqual(self.ed.get_text(), "hello world hello")
if __name__ == "__main__": unittest.main()
