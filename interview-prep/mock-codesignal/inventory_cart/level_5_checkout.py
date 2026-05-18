import unittest

class Store:
    def __init__(self): pass
    def add_stock(self, item_id: str, qty: int) -> None: pass
    def add_to_cart(self, user_id: str, item_id: str) -> bool: return False
    def checkout(self, user_id: str, payment_success: bool) -> bool: return False
    def get_stock(self, item_id: str) -> int: return 0

class TestInv5(unittest.TestCase):
    def setUp(self): self.s = Store()
    def test_checkout(self):
        self.s.add_stock("apple", 1)
        self.s.add_to_cart("u1", "apple")
        
        # Payment fails, stock must be returned
        self.assertFalse(self.s.checkout("u1", payment_success=False))
        self.assertEqual(self.s.get_stock("apple"), 1)
        
        # Payment succeeds
        self.s.add_to_cart("u1", "apple")
        self.assertTrue(self.s.checkout("u1", payment_success=True))
        self.assertEqual(self.s.get_stock("apple"), 0)
if __name__ == "__main__": unittest.main()
