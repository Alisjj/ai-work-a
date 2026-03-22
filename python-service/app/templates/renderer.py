"""Template rendering utilities."""

from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape


class TemplateRenderer:
    """Renders Jinja2 templates for the briefing service."""

    def __init__(self) -> None:
        self._env: Environment | None = None
        self._templates_dir = Path(__file__).resolve().parent

    @property
    def env(self) -> Environment:
        """Lazy-load the Jinja2 environment."""
        if self._env is None:
            self._env = Environment(
                loader=FileSystemLoader(str(self._templates_dir)),
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


renderer = TemplateRenderer()
