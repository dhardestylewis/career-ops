import unittest

class Store:
    def __init__(self): pass
    def add_stock(self, item_id: str, qty: int) -> None: pass
    def add_to_cart(self, user_id: str, item_id: str, timestamp: int) -> bool: return False
    def get_stock(self, item_id: str, timestamp: int) -> int: return 0

class TestInv4(unittest.TestCase):
    def setUp(self): self.s = Store()
    def test_reservation_timeout(self):
        self.s.add_stock("apple", 1)
        # Reserved for 10 minutes (600 seconds)
        self.assertTrue(self.s.add_to_cart("u1", "apple", timestamp=0))
        self.assertEqual(self.s.get_stock("apple", timestamp=500), 0)
        
        # Timeout expires! Stock returns
        self.assertEqual(self.s.get_stock("apple", timestamp=601), 1)
if __name__ == "__main__": unittest.main()
