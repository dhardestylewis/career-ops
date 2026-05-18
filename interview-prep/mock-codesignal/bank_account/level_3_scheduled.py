import unittest

# LEVEL 3: Scheduled Transactions
class Bank:
    def __init__(self): pass
    def create_account(self, name: str) -> bool: return False
    def deposit(self, name: str, amount: int) -> bool: return False
    def transfer(self, src: str, dst: str, amount: int) -> bool: return False
    def schedule_transfer(self, src: str, dst: str, amount: int, execute_at: int) -> str: return ""
    def process_scheduled(self, now: int) -> None: pass



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



# --- CURRENT LEVEL TESTS ---

class TestBankLevel3(unittest.TestCase):
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
if __name__ == "__main__": unittest.main()
