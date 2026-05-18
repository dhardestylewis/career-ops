import unittest

class Store:
    def __init__(self): pass
    def add_stock(self, item_id: str, qty: int) -> None: pass
    def add_to_cart(self, user_id: str, item_id: str) -> bool: return False
    def get_stock(self, item_id: str) -> int: return 0



# --- CUMULATIVE PAST TESTS ---

class TestPast_0_Inv1(unittest.TestCase):
    def setUp(self): self.c = Cart()
    def test_basic(self):
        self.c.add_item("u1", "apple", 10)
        self.c.add_item("u1", "banana", 5)
        self.assertEqual(self.c.get_total("u1"), 15)
        self.assertTrue(self.c.remove_item("u1", "apple"))
        self.assertEqual(self.c.get_total("u1"), 5)

class TestPast_1_Inv2(unittest.TestCase):
    def setUp(self): self.c = Cart()
    def test_discount(self):
        self.c.add_item("u1", "apple", 100)
        self.c.apply_coupon("u1", 20) # 20% off
        self.assertEqual(self.c.get_total("u1"), 80.0)



# --- CURRENT LEVEL TESTS ---

class TestInv3(unittest.TestCase):
    def setUp(self): self.s = Store()
    def test_stock(self):
        self.s.add_stock("apple", 1)
        self.assertTrue(self.s.add_to_cart("u1", "apple"))
        self.assertEqual(self.s.get_stock("apple"), 0)
        
        self.assertFalse(self.s.add_to_cart("u2", "apple")) # Out of stock
if __name__ == "__main__": unittest.main()
