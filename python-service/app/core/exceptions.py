"""Custom exceptions for the briefing service."""


class BriefingError(Exception):
    """Base exception for all briefing-related errors."""

    pass


class BriefingNotFoundError(BriefingError):
    """Raised when a briefing with the given ID is not found."""

    def __init__(self, briefing_id: str):
        self.briefing_id = briefing_id
        super().__init__(f"Briefing not found: {briefing_id}")


class BriefingNotGeneratedError(BriefingError):
    """Raised when trying to access a report that hasn't been generated yet."""

    def __init__(self, briefing_id: str):
        self.briefing_id = briefing_id
        super().__init__(f"Report has not been generated yet: {briefing_id}")


class DatabaseError(BriefingError):
    """Raised when a database operation fails unexpectedly."""

    pass
