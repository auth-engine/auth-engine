import os
import subprocess
import sys
from pathlib import Path

import typer
import uvicorn

app = typer.Typer(help="AuthEngine CLI")


def get_project_root() -> Path:
    return Path(__file__).parent.parent.parent


@app.command()
def run(
    host: str = "0.0.0.0",
    port: int = 8000,
    reload: bool = False,
) -> None:
    """
    Run the FastAPI server
    """
    # Ensure src is in PYTHONPATH
    project_root = get_project_root()
    env = os.environ.copy()
    env["PYTHONPATH"] = str(project_root / "src")

    uvicorn.run(
        "auth_engine.main:app",
        host=host,
        port=port,
        reload=reload,
    )


@app.command()
def migrate() -> None:
    """
    Run Alembic migrations
    """
    project_root = get_project_root()
    alembic_path = str(Path(sys.executable).parent / "alembic")
    subprocess.run([alembic_path, "upgrade", "head"], cwd=project_root, check=True)


@app.command()
def makemigration(message: str) -> None:
    """
    Create a new migration (run from apps/api/ where alembic.ini lives)
    """
    project_root = get_project_root()
    alembic_path = str(Path(sys.executable).parent / "alembic")
    subprocess.run(
        [alembic_path, "revision", "--autogenerate", "-m", message],
        cwd=project_root,
        check=True,
    )


seed_app = typer.Typer(help="Load seed data from repo data/ into the database.")
app.add_typer(seed_app, name="seed")


def _seed(roles: bool, superadmin: bool, platform_config: bool) -> None:
    import asyncio
    import logging

    from auth_engine.seed import run_seed

    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    asyncio.run(run_seed(roles=roles, superadmin=superadmin, platform_config=platform_config))


@seed_app.callback(invoke_without_command=True)
def seed_default(ctx: typer.Context) -> None:
    """Seed roles, super admin, and platform config (same as `auth-engine seed all`)."""
    if ctx.invoked_subcommand is None:
        _seed(roles=True, superadmin=True, platform_config=True)


@seed_app.command("all")
def seed_all() -> None:
    """Seed roles, super admin, and platform tenant config."""
    _seed(roles=True, superadmin=True, platform_config=True)


@seed_app.command("roles")
def seed_roles_cmd() -> None:
    """Seed only roles and permissions from data/rbac.json."""
    _seed(roles=True, superadmin=False, platform_config=False)


@seed_app.command("superadmin")
def seed_superadmin_cmd() -> None:
    """Seed only the super admin (requires roles first)."""
    _seed(roles=False, superadmin=True, platform_config=False)


@seed_app.command("platform-config")
def seed_platform_config_cmd() -> None:
    """Seed platform tenant email, SMS, social providers, and password policy."""
    _seed(roles=False, superadmin=False, platform_config=True)


if __name__ == "__main__":
    app()
