import logging

import psycopg

from .config import Config
from .postgres import PostgresRepository
from .worker import run_forever


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    config = Config.from_env()
    with psycopg.connect(config.database_url, autocommit=True) as conn:
        run_forever(
            PostgresRepository(conn),
            config.export_dir,
            config.max_attempts,
            config.poll_interval_seconds,
        )


if __name__ == "__main__":
    main()
