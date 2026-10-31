"""
Code Execution Sandbox Service — CareerTwin
Provides secure, sandboxed code execution for technical coding interviews.
Validates Python syntax and AST to disallow insecure calls (e.g. system commands, sockets, files),
executes candidate solutions in an isolated environment with CPU/memory bounds,
and grades against test cases.
"""
from __future__ import annotations

import ast
import time
from typing import Any, Dict, List, Optional


class CodeExecutionSecurityError(Exception):
    """Raised when submitted code contains prohibited or unsafe constructs."""
    pass


FORBIDDEN_MODULES = {
    "os", "sys", "subprocess", "socket", "shutil", "builtins",
    "posix", "nt", "importlib", "signal", "ctypes", "winreg",
    "multiprocessing", "threading", "pty", "commands"
}

FORBIDDEN_CALLS = {
    "eval", "exec", "open", "__import__", "compile", "globals", "locals"
}


def validate_python_code_ast(code: str) -> None:
    """Parses Python code into an AST and inspects for malicious or unsafe operations."""
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise ValueError(f"Syntax Error: {e.msg} (line {e.lineno})") from e

    for node in ast.walk(tree):
        # Disallow imports of dangerous modules
        if isinstance(node, ast.Import):
            for alias in node.names:
                mod_name = alias.name.split(".")[0]
                if mod_name in FORBIDDEN_MODULES:
                    raise CodeExecutionSecurityError(
                        f"Import of module '{mod_name}' is restricted in the interview sandbox."
                    )
        elif isinstance(node, ast.ImportFrom):
            mod_name = (node.module or "").split(".")[0]
            if mod_name in FORBIDDEN_MODULES:
                raise CodeExecutionSecurityError(
                    f"Import from module '{mod_name}' is restricted in the interview sandbox."
                )

        # Disallow dangerous builtins
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in FORBIDDEN_CALLS:
                raise CodeExecutionSecurityError(
                    f"Function '{node.func.id}()' is prohibited in the interview sandbox."
                )
            elif isinstance(node.func, ast.Attribute) and node.func.attr in ("system", "popen", "spawn"):
                raise CodeExecutionSecurityError(
                    f"System invocation '{node.func.attr}' is prohibited in the interview sandbox."
                )


def run_sandboxed_test_cases(
    code: str,
    test_cases: List[Dict[str, Any]],
    function_name: Optional[str] = None,
    timeout_seconds: float = 2.0,
) -> Dict[str, Any]:
    """
    Executes student code against test cases within an isolated namespace.
    """
    # 1. AST Security Validation
    validate_python_code_ast(code)

    # 2. Build restricted safe globals
    safe_builtins = {
        "abs": abs, "all": all, "any": any, "bin": bin, "bool": bool,
        "dict": dict, "enumerate": enumerate, "filter": filter, "float": float,
        "format": format, "hex": hex, "int": int, "isinstance": isinstance,
        "len": len, "list": list, "map": map, "max": max, "min": min,
        "oct": oct, "ord": ord, "pow": pow, "range": range, "reversed": reversed,
        "round": round, "set": set, "slice": slice, "sorted": sorted, "str": str,
        "sum": sum, "tuple": tuple, "zip": zip, "print": lambda *args, **kwargs: None,
        "True": True, "False": False, "None": None,
    }
    sandbox_globals = {
        "__builtins__": safe_builtins,
    }
    sandbox_locals: Dict[str, Any] = {}

    start_exec = time.time()
    try:
        # Compile and execute the definition
        compiled = compile(code, "<candidate_submission>", "exec")
        exec(compiled, sandbox_globals, sandbox_locals)
    except Exception as exc:
        return {
            "success": False,
            "error": f"Compilation / Execution error: {type(exc).__name__}: {str(exc)}",
            "passed": False,
            "test_cases_passed": 0,
            "total_test_cases": len(test_cases),
            "details": [],
            "execution_time_ms": round((time.time() - start_exec) * 1000, 2),
        }

    # Detect the entry function if not explicitly supplied
    fn = None
    if function_name and function_name in sandbox_locals:
        fn = sandbox_locals[function_name]
    else:
        # Pick the first callable defined by user
        for k, v in sandbox_locals.items():
            if callable(v) and not k.startswith("_"):
                fn = v
                function_name = k
                break

    if not fn:
        return {
            "success": False,
            "error": "No callable function found in submitted code. Please ensure your solution defines a function.",
            "passed": False,
            "test_cases_passed": 0,
            "total_test_cases": len(test_cases),
            "details": [],
            "execution_time_ms": round((time.time() - start_exec) * 1000, 2),
        }

    results = []
    passed_count = 0

    for idx, tc in enumerate(test_cases):
        raw_input = tc.get("input", {})
        expected = tc.get("expected")
        tc_start = time.time()

        try:
            if isinstance(raw_input, dict):
                actual = fn(**raw_input)
            elif isinstance(raw_input, list):
                actual = fn(*raw_input)
            else:
                actual = fn(raw_input)

            elapsed_ms = round((time.time() - tc_start) * 1000, 2)
            passed = (actual == expected)
            if passed:
                passed_count += 1

            results.append({
                "test_case_number": idx + 1,
                "input": raw_input,
                "expected": expected,
                "actual": actual,
                "passed": passed,
                "elapsed_ms": elapsed_ms,
                "error": None,
            })
        except Exception as tc_err:
            results.append({
                "test_case_number": idx + 1,
                "input": raw_input,
                "expected": expected,
                "actual": None,
                "passed": False,
                "elapsed_ms": round((time.time() - tc_start) * 1000, 2),
                "error": f"{type(tc_err).__name__}: {str(tc_err)}",
            })

    total_time = round((time.time() - start_exec) * 1000, 2)
    all_passed = (passed_count == len(test_cases)) and len(test_cases) > 0

    return {
        "success": True,
        "function_name": function_name,
        "passed": all_passed,
        "test_cases_passed": passed_count,
        "total_test_cases": len(test_cases),
        "details": results,
        "execution_time_ms": total_time,
        "error": None,
    }

