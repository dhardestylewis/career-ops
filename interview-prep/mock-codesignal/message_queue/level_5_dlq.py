import unittest

# ============================================================================
# LEVEL 5: Dead Letter Queue (DLQ)
# ============================================================================
# Requirements:
# 1. Update `__init__` to accept `max_retries: int = 3`.
# 
# 2. Track "Delivery Attempts":
#    - Every time a task returns to the main queue because its visibility 
#      timeout expired, its delivery attempt count increases by 1.
#    - (Note: The first time a task is pushed, its delivery count is 0. 
#      When it times out and returns to the queue, its delivery count becomes 1. 
#      When it times out a second time, it becomes 2, etc.)
# 
# 3. Dead Letter Queue:
#    - If a task's visibility timeout expires, and its delivery count 
#      would reach `max_retries`, it does NOT return to the main queue.
#    - Instead, it is permanently moved to the Dead Letter Queue (DLQ).
#    - Once in the DLQ, it cannot be popped or acked.
#    - However, it CAN still expire if it had an `expires_at`!
# 
# 4. Add `get_dlq_size(current_time: float) -> int`:
#    - Returns the number of unexpired tasks currently in the DLQ.
# ============================================================================

class TaskQueue:
    def __init__(self, max_retries: int = 3):
        pass

    def push(self, task_id: str, payload: dict, execute_at=None, expires_at=None) -> bool:
        return False

    def pop(self, current_time: float, visibility_timeout=None) -> dict | None:
        return None

    def ack(self, task_id: str) -> bool:
        return False
        
    def size(self, current_time: float) -> int:
        return 0
        
    def get_dlq_size(self, current_time: float) -> int:
        return 0


# ============================================================================
# TESTS (Do not modify)
# ============================================================================
class TestTaskQueueLevel5(unittest.TestCase):
    def setUp(self):
        self.q = TaskQueue(max_retries=2)

    def test_dlq_routing(self):
        self.q.push("t1", {"data": 1})
        
        # Attempt 1 (Delivery Count = 0 -> 1 after timeout)
        self.assertEqual(self.q.pop(0, visibility_timeout=10), {"data": 1})
        
        # Attempt 2 (Delivery Count = 1 -> 2 after timeout)
        self.assertEqual(self.q.pop(15, visibility_timeout=10), {"data": 1})
        
        # At time 30, it times out for the 2nd time.
        # Since max_retries = 2, it goes to DLQ instead of the main queue.
        self.assertIsNone(self.q.pop(30))
        
        self.assertEqual(self.q.size(30), 0)
        self.assertEqual(self.q.get_dlq_size(30), 1)

    def test_dlq_expiration(self):
        self.q = TaskQueue(max_retries=1)
        self.q.push("t1", {"data": 1}, expires_at=50)
        
        # Pop and timeout
        self.q.pop(0, visibility_timeout=10)
        
        # At time 15, it goes to DLQ (max_retries=1)
        self.assertEqual(self.q.get_dlq_size(15), 1)
        
        # At time 55, it has expired inside the DLQ!
        self.assertEqual(self.q.get_dlq_size(55), 0)

    def test_edge_dlq_independence(self):
        self.q = TaskQueue(max_retries=1)
        self.q.push("t1", {"data": 1})
        self.q.push("t2", {"data": 2})
        
        # Pop t1 and timeout
        self.q.pop(0, visibility_timeout=10)
        
        # t1 goes to DLQ at time 15
        self.assertEqual(self.q.get_dlq_size(15), 1)
        
        # t2 is still perfectly fine and can be popped normally
        self.assertEqual(self.q.pop(15), {"data": 2})

    def test_edge_acking_prevents_dlq(self):
        self.q = TaskQueue(max_retries=1)
        self.q.push("t1", {"data": 1})
        
        self.q.pop(0, visibility_timeout=10)
        
        # Ack before timeout
        self.assertTrue(self.q.ack("t1"))
        
        # At time 15, it should NOT go to DLQ because it was acked
        self.assertEqual(self.q.get_dlq_size(15), 0)

if __name__ == '__main__':
    unittest.main()
