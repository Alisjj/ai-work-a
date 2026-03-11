"""Template rendering utilities."""

import os

from jinja2 import Environment, FileSystemLoader, select_autoescape


class TemplateRenderer:
    """Renders Jinja2 templates for the briefing service."""

    def __init__(self) -> None:
        self._env: Environment | None = None

    @property
    def _templates_dir(self) -> str:
        """Get the path to the templates directory."""
        return os.path.join(os.path.dirname(__file__), "briefing_report.html")

    @property
    def env(self) -> Environment:
        """Lazy-load the Jinja2 environment."""
        if self._env is None:
            self._env = Environment(
                loader=FileSystemLoader(os.path.dirname(self._templates_dir)),
                autoescape=select_autoescape(["html"]),
            )
        return self._env

    def render_briefing(self, report: object) -> str:
        """
        Render the briefing report template.

        Args:
            report: The report view model to render.

        Returns:
            Rendered HTML string.
        """
        template = self.env.get_template("briefing_report.html")
        return template.render(report=report)


# Global renderer instance
renderer = TemplateRenderer()
