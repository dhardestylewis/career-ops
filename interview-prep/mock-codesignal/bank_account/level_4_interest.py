import unittest
from decimal import Decimal

# LEVEL 4: Interest (Using Decimal for precise financial arithmetic)
class Bank:
    def __init__(self): pass
    def create_account(self, name: str) -> bool: return False
    def deposit(self, name: str, amount: Decimal) -> bool: return False
    def set_interest_rate(self, name: str, rate: Decimal) -> bool: return False
    def apply_interest(self) -> None: pass
    def get_balance(self, name: str) -> Decimal: return Decimal('0.00')

class TestBankLevel4(unittest.TestCase):
    def setUp(self): self.bank = Bank()
    def test_decimal_interest(self):
        self.bank.create_account("A")
        self.bank.deposit("A", Decimal('100.00'))
        self.bank.set_interest_rate("A", Decimal('0.05'))
        self.bank.apply_interest()
        self.assertEqual(self.bank.get_balance("A"), Decimal('105.00'))
if __name__ == "__main__": unittest.main()
