# Synthetic test fixture: Reproducible Circular Import Error
from .module_b import helper_b

def main():
    return helper_b()
