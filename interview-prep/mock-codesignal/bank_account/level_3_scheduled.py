import unittest

# LEVEL 3: Scheduled Transactions
class Bank:
    def __init__(self): pass
    def create_account(self, name: str) -> bool: return False
    def deposit(self, name: str, amount: int) -> bool: return False
    def transfer(self, src: str, dst: str, amount: int) -> bool: return False
    def schedule_transfer(self, src: str, dst: str, amount: int, execute_at: int) -> str: return ""
    def process_scheduled(self, now: int) -> None: pass

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
