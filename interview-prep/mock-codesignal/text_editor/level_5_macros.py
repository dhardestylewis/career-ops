import unittest

class TextEditor:
    def __init__(self): pass
    def append(self, text: str) -> None: pass
    def start_macro(self, name: str) -> None: pass
    def end_macro(self) -> None: pass
    def play_macro(self, name: str) -> None: pass
    def get_text(self) -> str: return ""

class TestEditor5(unittest.TestCase):
    def setUp(self): self.ed = TextEditor()
    def test_macros(self):
        self.ed.start_macro("greet")
        self.ed.append("hello ")
        self.ed.end_macro()
        
        self.ed.play_macro("greet")
        self.ed.play_macro("greet")
        
        self.assertEqual(self.ed.get_text(), "hello hello ")
if __name__ == "__main__": unittest.main()
