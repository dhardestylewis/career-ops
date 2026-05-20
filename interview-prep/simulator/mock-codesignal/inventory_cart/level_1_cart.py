import unittest

class Cart:
    def __init__(self): pass
    def add_item(self, user_id: str, item_id: str, price: int) -> None: pass
    def remove_item(self, user_id: str, item_id: str) -> bool: return False
    def get_total(self, user_id: str) -> int: return 0

class TestInv1(unittest.TestCase):
    def setUp(self): self.c = Cart()
    def test_basic(self):
        self.c.add_item("u1", "apple", 10)
        self.c.add_item("u1", "banana", 5)
        self.assertEqual(self.c.get_total("u1"), 15)
        self.assertTrue(self.c.remove_item("u1", "apple"))
        self.assertEqual(self.c.get_total("u1"), 5)
if __name__ == "__main__": unittest.main()
