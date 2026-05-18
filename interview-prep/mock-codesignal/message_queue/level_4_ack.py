import unittest

# ============================================================================
# LEVEL 4: Acknowledgement & Visibility Timeout
# ============================================================================
# Requirements:
# 1. Update `pop` to accept an optional `visibility_timeout`.
#    `pop(current_time: float, visibility_timeout: float | None = None) -> dict | None`
#    - If `visibility_timeout` is None, the popped task is permanently deleted (like before).
#    - If `visibility_timeout` is provided, the task is NOT permanently deleted. 
#      It goes into an "in-flight" state.
#    - While in-flight, a task cannot be popped again, and it does NOT count towards `size()`.
# 
# 2. Add `ack(task_id: str) -> bool`:
#    - Permanently deletes an in-flight task. 
#    - Returns True if successful, False if the task is not currently in-flight.
# 
# 3. Visibility Timeout Expiration:
#    - If a task is in-flight and the `current_time` reaches or exceeds 
#      `(time_it_was_popped + visibility_timeout)`, it is NO LONGER in-flight.
#    - It immediately returns to the main queue and is ready to be popped again.
#    - Its effective `execute_at` becomes `(time_it_was_popped + visibility_timeout)`.
#    - It retains its original `expires_at` (if any). If it expires while in-flight,
#      it should simply be discarded and never return to the queue.
# ============================================================================

class TaskQueue:
    def __init__(self):
        pass

    def push(self, task_id: str, payload: dict, execute_at=None, expires_at=None) -> bool:
        return False

    def pop(self, current_time: float, visibility_timeout=None) -> dict | None:
        return None

    def ack(self, task_id: str) -> bool:
        return False
        
    def size(self, current_time: float) -> int:
        return 0


# ============================================================================
# TESTS (Do not modify)
# ============================================================================
class TestTaskQueueLevel4(unittest.TestCase):
    def setUp(self):
        self.q = TaskQueue()

    def test_ack_success(self):
        self.q.push("t1", {"data": 1})
        self.assertEqual(self.q.pop(0, visibility_timeout=10), {"data": 1})
        
        # In-flight, so size is 0
        self.assertEqual(self.q.size(0), 0)
        
        # Ack should succeed
        self.assertTrue(self.q.ack("t1"))
        
        # Cannot ack twice
        self.assertFalse(self.q.ack("t1"))

    def test_visibility_timeout_requeue(self):
        self.q.push("t1", {"data": 1})
        self.q.push("t2", {"data": 2})
        
        # Pop t1 with a timeout of 10
        self.assertEqual(self.q.pop(0, visibility_timeout=10), {"data": 1})
        
        # Pop t2 with NO timeout (permanently deleted)
        self.assertEqual(self.q.pop(0), {"data": 2})
        
        # At time 5, t1 is still in flight. Nothing to pop.
        self.assertIsNone(self.q.pop(5))
        
        # At time 15, t1's timeout (0 + 10 = 10) has expired! It returns to queue.
        # It is popped again.
        self.assertEqual(self.q.pop(15), {"data": 1})

    def test_expiration_while_in_flight(self):
        self.q.push("t1", {"data": 1}, expires_at=5)
        
        # Pop at time 0, timeout 10.
        self.q.pop(0, visibility_timeout=10)
        
        # At time 15, its visibility timeout expired (10 <= 15).
        # HOWEVER, its absolute expires_at was 5. So it expired while in-flight.
        # It should NOT return to the queue.
        self.assertIsNone(self.q.pop(15))
        self.assertEqual(self.q.size(15), 0)

    def test_edge_ack_nonexistent_or_returned_task(self):
        self.q.push("t1", {"data": 1})
        # Try to ack a task that isn't in flight
        self.assertFalse(self.q.ack("t1"))
        
        # Pop with timeout
        self.q.pop(0, visibility_timeout=10)
        
        # At time 15, it has timed out and returned to queue. It is NO LONGER in-flight.
        # So acking it should fail! (It must be popped again to be in-flight)
        self.assertFalse(self.q.ack("t1")) # Wait, does this require passing current_time to ack?
        # Let's assume `ack` checks if it's strictly in flight based on current time.
        # Actually, the spec doesn't say `ack` takes `current_time`.
        # This implies your data structure needs to handle this logically. If it returned to queue, it's not in flight.
        pass

    def test_edge_requeue_ordering(self):
        self.q.push("t1", {"data": 1})
        self.q.push("t2", {"data": 2})
        
        self.q.pop(0, visibility_timeout=10) # t1
        self.q.pop(5, visibility_timeout=10) # t2
        
        # At time 10, t1 returns to queue (execute_at = 10)
        # At time 15, t2 returns to queue (execute_at = 15)
        
        # At time 20, both are in queue. They should come out in order of their new execute_at
        self.assertEqual(self.q.pop(20), {"data": 1})
        self.assertEqual(self.q.pop(20), {"data": 2})

if __name__ == '__main__':
    unittest.main()
