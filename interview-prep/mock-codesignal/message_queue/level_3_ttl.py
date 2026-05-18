import unittest

# ============================================================================
# LEVEL 3: Time-To-Live (TTL) / Expiration
# ============================================================================
# Requirements:
# 1. Update `push` to accept an optional `expires_at`.
#    `push(task_id: str, payload: dict, execute_at=None, expires_at=None) -> bool`
# 
# 2. Update `pop(current_time: float) -> dict | None`:
#    - If a task's `expires_at` is NOT None, and `expires_at <= current_time`, 
#      it is expired.
#    - Expired tasks MUST NOT be returned by `pop`. They should be silently 
#      discarded and removed from the queue.
# 
# 3. Update `size(current_time: float) -> int`:
#    - Now `size` takes `current_time`.
#    - It should return the number of tasks in the queue that have NOT expired.
#      (Tasks that are not ready to execute due to `execute_at` still count towards size, 
#       as long as they haven't expired).
# ============================================================================

class TaskQueue:
    def __init__(self):
        pass

    def push(self, task_id: str, payload: dict, execute_at=None, expires_at=None) -> bool:
        return False

    def pop(self, current_time: float) -> dict | None:
        return None
        
    def size(self, current_time: float) -> int:
        return 0


# ============================================================================
# TESTS (Do not modify)
# ============================================================================
class TestTaskQueueLevel3(unittest.TestCase):
    def setUp(self):
        self.q = TaskQueue()

    def test_basic_expiration(self):
        self.q.push("t1", {"data": 1}, expires_at=10)
        
        self.assertEqual(self.q.size(5), 1)
        self.assertEqual(self.q.size(15), 0) # Expired!
        self.assertIsNone(self.q.pop(15))

    def test_pop_ignores_expired(self):
        self.q.push("t1", {"data": 1}, execute_at=5, expires_at=10)
        self.q.push("t2", {"data": 2}, execute_at=5, expires_at=30)
        
        # At time 15, t1 is expired. t2 is ready and not expired.
        self.assertEqual(self.q.pop(15), {"data": 2})
        self.assertIsNone(self.q.pop(15)) # t1 should be gone
        self.assertEqual(self.q.size(15), 0)

    def test_lazy_cleanup_in_size(self):
        self.q.push("t1", {"data": 1}, expires_at=10)
        self.q.push("t2", {"data": 2}, expires_at=20)
        
        # Calling size should ideally clean up expired tasks, or at least not count them
        self.assertEqual(self.q.size(15), 1)
        self.assertEqual(self.q.size(25), 0)

    def test_edge_expire_boundary(self):
        # Expires EXACTLY at the current time
        self.q.push("t1", {"data": 1}, expires_at=10)
        self.assertEqual(self.q.size(10), 0)
        self.assertIsNone(self.q.pop(10))

    def test_edge_push_already_expired(self):
        # Pushing a task that is already expired based on current time
        self.q.push("t1", {"data": 1}, expires_at=0)
        self.assertEqual(self.q.size(5), 0)
        self.assertIsNone(self.q.pop(5))

    def test_edge_expire_while_waiting_for_execution(self):
        # Task executes at 20, but expires at 15
        self.q.push("t1", {"data": 1}, execute_at=20, expires_at=15)
        # At time 10, it's not ready to execute, but size should include it as it's not expired
        self.assertEqual(self.q.size(10), 1)
        # At time 25, it's ready to execute, but it has expired!
        self.assertEqual(self.q.size(25), 0)
        self.assertIsNone(self.q.pop(25))

if __name__ == '__main__':
    unittest.main()
