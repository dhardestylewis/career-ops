import unittest

# ============================================================================
# LEVEL 2: Scheduled Tasks
# ============================================================================
# Requirements:
# 1. Update `push` to accept an optional `execute_at` timestamp (int or float).
#    `push(task_id: str, payload: dict, execute_at: float | None = None) -> bool`
# 
# 2. Update `pop` to accept a `current_time` timestamp.
#    `pop(current_time: float) -> dict | None`
#    - Tasks should ONLY be popped if `execute_at` is None, or `execute_at <= current_time`.
#    - Tasks must be popped in order of their `execute_at` time (ascending).
#    - For tasks with the same `execute_at` (or multiple None values), 
#      pop them in FIFO order (the order they were pushed).
#    - Treat `execute_at=None` as `execute_at=0` for ordering purposes.
# 
# 3. `size()` remains the total number of tasks in the queue, regardless of schedule.
# ============================================================================

class TaskQueue:
    def __init__(self):
        pass

    def push(self, task_id: str, payload: dict, execute_at=None) -> bool:
        return False

    def pop(self, current_time: float) -> dict | None:
        return None
        
    def size(self) -> int:
        return 0


# ============================================================================
# TESTS (Do not modify)
# ============================================================================
class TestTaskQueueLevel2(unittest.TestCase):
    def setUp(self):
        self.q = TaskQueue()

    def test_basic_schedule(self):
        self.q.push("t1", {"data": 1}, execute_at=10)
        self.q.push("t2", {"data": 2}, execute_at=20)
        
        self.assertEqual(self.q.size(), 2)
        
        # At time 5, nothing is ready
        self.assertIsNone(self.q.pop(5))
        
        # At time 15, t1 is ready
        self.assertEqual(self.q.pop(15), {"data": 1})
        self.assertIsNone(self.q.pop(15))
        
        # At time 25, t2 is ready
        self.assertEqual(self.q.pop(25), {"data": 2})

    def test_ordering(self):
        self.q.push("t1", {"data": 1}, execute_at=30)
        self.q.push("t2", {"data": 2}, execute_at=10)
        self.q.push("t3", {"data": 3}, execute_at=20)
        
        # At time 50, all are ready. They should come out ordered by execute_at
        self.assertEqual(self.q.pop(50), {"data": 2}) # t2 was at 10
        self.assertEqual(self.q.pop(50), {"data": 3}) # t3 was at 20
        self.assertEqual(self.q.pop(50), {"data": 1}) # t1 was at 30

    def test_fifo_tiebreaker(self):
        self.q.push("t1", {"data": 1}, execute_at=10)
        self.q.push("t2", {"data": 2}, execute_at=10)
        self.q.push("t3", {"data": 3}, execute_at=None) # behaves like 0
        self.q.push("t4", {"data": 4}, execute_at=None) # behaves like 0
        
        self.assertEqual(self.q.pop(15), {"data": 3})
        self.assertEqual(self.q.pop(15), {"data": 4})
        self.assertEqual(self.q.pop(15), {"data": 1})
        self.assertEqual(self.q.pop(15), {"data": 2})

    def test_edge_execute_at_boundaries(self):
        self.q.push("t1", {"data": 1}, execute_at=10)
        # Exactly at boundary
        self.assertEqual(self.q.pop(10), {"data": 1})

    def test_edge_past_execution(self):
        # Pushed with timestamp in the past relative to pop time
        self.q.push("t1", {"data": 1}, execute_at=-5)
        self.assertEqual(self.q.pop(0), {"data": 1})

if __name__ == '__main__':
    unittest.main()
