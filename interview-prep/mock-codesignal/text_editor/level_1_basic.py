import unittest

class TextEditor:
    def __init__(self): pass
    def append(self, text: str) -> None: pass
    def delete(self, count: int) -> None: pass
    def get_text(self) -> str: return ""

class TestEditor1(unittest.TestCase):
    def setUp(self): self.ed = TextEditor()
    def test_basic(self):
        self.ed.append("hello")
        self.assertEqual(self.ed.get_text(), "hello")
        self.ed.append(" world")
        self.assertEqual(self.ed.get_text(), "hello world")
        self.ed.delete(6)
        self.assertEqual(self.ed.get_text(), "hello")
        self.ed.delete(100) # Deleting more than exists should just empty it
        self.assertEqual(self.ed.get_text(), "")
if __name__ == "__main__": unittest.main()
