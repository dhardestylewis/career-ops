import unittest

class Store:
    def __init__(self): pass
    def add_stock(self, item_id: str, qty: int) -> None: pass
    def add_to_cart(self, user_id: str, item_id: str) -> bool: return False
    def get_stock(self, item_id: str) -> int: return 0

class TestInv3(unittest.TestCase):
    def setUp(self): self.s = Store()
    def test_stock(self):
        self.s.add_stock("apple", 1)
        self.assertTrue(self.s.add_to_cart("u1", "apple"))
        self.assertEqual(self.s.get_stock("apple"), 0)
        
        self.assertFalse(self.s.add_to_cart("u2", "apple")) # Out of stock
if __name__ == "__main__": unittest.main()
