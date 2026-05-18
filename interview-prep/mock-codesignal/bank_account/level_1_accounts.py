import unittest

# LEVEL 1: Accounts + Transfers
class Bank:
    def __init__(self): pass
    def create_account(self, name: str) -> bool: return False
    def deposit(self, name: str, amount: int) -> bool: return False
    def transfer(self, src: str, dst: str, amount: int) -> bool: return False

class TestBankLevel1(unittest.TestCase):
    def setUp(self): self.bank = Bank()
    def test_basic(self):
        self.assertTrue(self.bank.create_account("A"))
        self.assertTrue(self.bank.create_account("B"))
        self.assertTrue(self.bank.deposit("A", 100))
        self.assertTrue(self.bank.transfer("A", "B", 50))
        # Add a way to check balance in tests implicitly by failing overdraws
        self.assertFalse(self.bank.transfer("A", "B", 60)) # insufficient
    def test_missing_account(self):
        self.assertFalse(self.bank.transfer("A", "C", 10))
if __name__ == "__main__": unittest.main()
