__version__ = "0.1.0"

from .middleware import AetherMiddleware
from .client import VerifiedCatalog
from .health import HealthChecker

__all__ = ["AetherMiddleware", "VerifiedCatalog", "HealthChecker", "discover", "get_oracle_status", "__version__"]


def discover(*args, **kwargs):
    from .client import VerifiedCatalog
    catalog = VerifiedCatalog(*args, **kwargs)
    return catalog.discover()


def get_oracle_status(*args, **kwargs):
    from .client import VerifiedCatalog
    catalog = VerifiedCatalog(*args, **kwargs)
    return catalog.get_status()
