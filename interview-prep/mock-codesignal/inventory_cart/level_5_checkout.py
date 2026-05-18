import unittest

class Store:
    def __init__(self): pass
    def add_stock(self, item_id: str, qty: int) -> None: pass
    def add_to_cart(self, user_id: str, item_id: str) -> bool: return False
    def checkout(self, user_id: str, payment_success: bool) -> bool: return False
    def get_stock(self, item_id: str) -> int: return 0

\n\n# --- CUMULATIVE PAST TESTS ---\n\nclass TestPast_0_Inv1(unittest.TestCase):
    def setUp(self): self.c = Cart()
    def test_basic(self):
        self.c.add_item("u1", "apple", 10)
        self.c.add_item("u1", "banana", 5)
        self.assertEqual(self.c.get_total("u1"), 15)
        self.assertTrue(self.c.remove_item("u1", "apple"))
        self.assertEqual(self.c.get_total("u1"), 5)\n\nclass TestPast_1_Inv2(unittest.TestCase):
    def setUp(self): self.c = Cart()
    def test_discount(self):
        self.c.add_item("u1", "apple", 100)
        self.c.apply_coupon("u1", 20) # 20% off
        self.assertEqual(self.c.get_total("u1"), 80.0)\n\nclass TestPast_2_Inv3(unittest.TestCase):
    def setUp(self): self.s = Store()
    def test_stock(self):
        self.s.add_stock("apple", 1)
        self.assertTrue(self.s.add_to_cart("u1", "apple"))
        self.assertEqual(self.s.get_stock("apple"), 0)
        
        self.assertFalse(self.s.add_to_cart("u2", "apple")) # Out of stock\n\nclass TestPast_3_Inv4(unittest.TestCase):
    def setUp(self): self.s = Store()
    def test_reservation_timeout(self):
        self.s.add_stock("apple", 1)
        # Reserved for 10 minutes (600 seconds)
        self.assertTrue(self.s.add_to_cart("u1", "apple", timestamp=0))
        self.assertEqual(self.s.get_stock("apple", timestamp=500), 0)
        
        # Timeout expires! Stock returns
        self.assertEqual(self.s.get_stock("apple", timestamp=601), 1)\n\n\n\n# --- CURRENT LEVEL TESTS ---\n\nclass TestInv5(unittest.TestCase):
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
