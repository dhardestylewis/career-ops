import unittest

class Cart:
    def __init__(self): pass
    def add_item(self, user_id: str, item_id: str, price: int) -> None: pass
    def apply_coupon(self, user_id: str, pct_off: int) -> None: pass
    def get_total(self, user_id: str) -> float: return 0.0



# --- CUMULATIVE PAST TESTS ---

class TestPast_0_Inv1(unittest.TestCase):
    def setUp(self): self.c = Cart()
    def test_basic(self):
        self.c.add_item("u1", "apple", 10)
        self.c.add_item("u1", "banana", 5)
        self.assertEqual(self.c.get_total("u1"), 15)
        self.assertTrue(self.c.remove_item("u1", "apple"))
        self.assertEqual(self.c.get_total("u1"), 5)



# --- CURRENT LEVEL TESTS ---

class TestInv2(unittest.TestCase):
    def setUp(self): self.c = Cart()
    def test_discount(self):
        self.c.add_item("u1", "apple", 100)
        self.c.apply_coupon("u1", 20) # 20% off
        self.assertEqual(self.c.get_total("u1"), 80.0)
if __name__ == "__main__": unittest.main()
