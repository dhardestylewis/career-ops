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



# --- CUMULATIVE PAST TESTS ---

class TestPast_0_BankLevel1(unittest.TestCase):
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

class TestPast_1_BankLevel2(unittest.TestCase):
    def setUp(self): self.bank = Bank()
    def test_ledger(self):
        self.bank.create_account("A")
        self.bank.create_account("B")
        self.bank.deposit("A", 100)
        self.bank.transfer("A", "B", 40)
        
        txs = self.bank.get_transactions("A")
        self.assertEqual(len(txs), 2)
        # Verify it captures the transfer amount
        amounts = [t.get("amount") for t in txs]
        self.assertIn(100, amounts)
        self.assertIn(40, amounts)

class TestPast_2_BankLevel3(unittest.TestCase):
    def setUp(self): self.bank = Bank()
    def test_schedule(self):
        self.bank.create_account("A")
        self.bank.create_account("B")
        self.bank.deposit("A", 100)
        
        self.bank.schedule_transfer("A", "B", 50, execute_at=10)
        self.bank.process_scheduled(now=5)
        self.assertTrue(self.bank.transfer("A", "B", 60)) # Should still work, schedule hasn't fired
        
        self.bank.process_scheduled(now=15)
        # Schedule fires but insufficient funds (100 - 60 = 40, needs 50)
        # Verify it drops or leaves pending



# --- CURRENT LEVEL TESTS ---

class TestBankLevel4(unittest.TestCase):
    def setUp(self): self.bank = Bank()
    def test_decimal_interest(self):
        self.bank.create_account("A")
        self.bank.deposit("A", Decimal('100.00'))
        self.bank.set_interest_rate("A", Decimal('0.05'))
        self.bank.apply_interest()
        self.assertEqual(self.bank.get_balance("A"), Decimal('105.00'))
if __name__ == "__main__": unittest.main()
