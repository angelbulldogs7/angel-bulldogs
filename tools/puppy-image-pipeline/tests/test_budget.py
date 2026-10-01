from __future__ import annotations

import pytest

from puppy_images.generate import PaidExecutionDisabledError, require_paid_execution


def test_generate_requires_execute_flag() -> None:
    with pytest.raises(PaidExecutionDisabledError):
        require_paid_execution(execute_paid=False, budget_allows_paid=True)


def test_generate_requires_paid_budget_profile() -> None:
    with pytest.raises(PaidExecutionDisabledError):
        require_paid_execution(execute_paid=True, budget_allows_paid=False)


def test_generate_allows_when_explicit() -> None:
    require_paid_execution(execute_paid=True, budget_allows_paid=True)
