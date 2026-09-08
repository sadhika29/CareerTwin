import logging
import time
from contextlib import contextmanager


logger = logging.getLogger("careertwin")


@contextmanager
def log_execution(agent_name: str, execution_id: str):
	start = time.perf_counter()
	try:
		yield
		status = "success"
	except Exception:
		status = "error"
		raise
	finally:
		logger.info("agent=%s execution_id=%s duration=%.3f status=%s", agent_name, execution_id, time.perf_counter() - start, status)
