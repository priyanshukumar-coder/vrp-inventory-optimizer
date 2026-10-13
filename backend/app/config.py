from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "VRP Inventory Optimizer"
    planning_horizon: int = 7  # days
    frequencies: list[int] = [1, 3, 5, 7]  # possible delivery frequencies (days)
    service_level_z: float = 1.65  # z-score for 95% service level factor
    solver_time_limit: int = 300  # seconds
    solver_mip_gap: float = 0.05  # 5% optimality gap
    
settings = Settings()
