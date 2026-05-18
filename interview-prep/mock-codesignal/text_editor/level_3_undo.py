import unittest

class TextEditor:
    def __init__(self): pass
    def append(self, text: str) -> None: pass
    def delete(self, count: int) -> None: pass
    def undo(self) -> None: pass
    def redo(self) -> None: pass
    def get_text(self) -> str: return ""

class TestEditor3(unittest.TestCase):
    def setUp(self): self.ed = TextEditor()
    def test_undo_redo(self):
        self.ed.append("hello")
        self.ed.append(" world")
        self.ed.undo()
        self.assertEqual(self.ed.get_text(), "hello")
        
        self.ed.redo()
        self.assertEqual(self.ed.get_text(), "hello world")
        
        self.ed.undo()
        self.ed.append(" there")
        # Appending clears the redo stack
        self.ed.redo() # Should do nothing
        self.assertEqual(self.ed.get_text(), "hello there")
if __name__ == "__main__": unittest.main()
