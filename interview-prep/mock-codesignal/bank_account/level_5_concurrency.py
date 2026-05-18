import unittest

# LEVEL 5: Limits and Freezes
class Bank:
    def __init__(self): pass
    def create_account(self, name: str) -> bool: return False
    def deposit(self, name: str, amount: int) -> bool: return False
    def transfer(self, src: str, dst: str, amount: int) -> bool: return False
    def freeze_account(self, name: str) -> bool: return False
    def unfreeze_account(self, name: str) -> bool: return False

class TestBankLevel5(unittest.TestCase):
    def setUp(self): self.bank = Bank()
    def test_freeze(self):
        self.bank.create_account("A")
        self.bank.create_account("B")
        self.bank.deposit("A", 100)
        self.bank.freeze_account("A")
        
        # Transfers out of a frozen account should fail
        self.assertFalse(self.bank.transfer("A", "B", 50))
        
        self.bank.unfreeze_account("A")
        self.assertTrue(self.bank.transfer("A", "B", 50))
if __name__ == "__main__": unittest.main()
