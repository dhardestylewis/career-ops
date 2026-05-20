import unittest

# ============================================================================
# LEVEL 1: Basic Task Queue
# ============================================================================
# Implement a simple in-memory Task Queue.
# 
# Requirements:
# 1. `push(task_id: str, payload: dict)`: Adds a task to the back of the queue.
#    - If `task_id` already exists in the queue, return False and do not update.
#    - Otherwise, return True.
# 
# 2. `pop()`: Removes and returns the task at the front of the queue.
#    - Returns the `payload` dict of the task.
#    - If the queue is empty, return None.
# 
# 3. `size()`: Returns the current number of tasks in the queue.
# ============================================================================

class TaskQueue:
    def __init__(self):
        pass

    def push(self, task_id: str, payload: dict) -> bool:
        return False

    def pop(self) -> dict | None:
        return None
        
    def size(self) -> int:
        return 0


# ============================================================================
# TESTS (Do not modify)
# ============================================================================
class TestTaskQueueLevel1(unittest.TestCase):
    def setUp(self):
        self.q = TaskQueue()

    def test_basic_push_pop(self):
        self.assertTrue(self.q.push("t1", {"data": 1}))
        self.assertEqual(self.q.size(), 1)
        self.assertEqual(self.q.pop(), {"data": 1})
        self.assertEqual(self.q.size(), 0)
        self.assertIsNone(self.q.pop())

    def test_fifo_ordering(self):
        self.q.push("t1", {"data": 1})
        self.q.push("t2", {"data": 2})
        self.q.push("t3", {"data": 3})
        
        self.assertEqual(self.q.pop(), {"data": 1})
        self.assertEqual(self.q.pop(), {"data": 2})
        self.assertEqual(self.q.pop(), {"data": 3})

    def test_duplicate_task_id(self):
        self.assertTrue(self.q.push("t1", {"data": 1}))
        self.assertFalse(self.q.push("t1", {"data": 2})) # Duplicate ID should fail
        self.assertEqual(self.q.size(), 1)
        self.assertEqual(self.q.pop(), {"data": 1})

    def test_edge_empty_pops(self):
        self.assertIsNone(self.q.pop())
        self.assertIsNone(self.q.pop())
        self.assertEqual(self.q.size(), 0)

    def test_edge_interleaved_push_pop(self):
        self.q.push("t1", {"data": 1})
        self.assertEqual(self.q.pop(), {"data": 1})
        self.q.push("t2", {"data": 2})
        self.q.push("t3", {"data": 3})
        self.assertEqual(self.q.pop(), {"data": 2})
        self.q.push("t4", {"data": 4})
        self.assertEqual(self.q.pop(), {"data": 3})
        self.assertEqual(self.q.pop(), {"data": 4})
        self.assertEqual(self.q.size(), 0)

if __name__ == '__main__':
    unittest.main()
